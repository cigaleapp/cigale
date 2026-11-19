// Playwright won't have support for OPFS in storageState, at least for now
// see https://github.com/microsoft/playwright/pull/41420
// So we capture it with on our own with .addInitScript and separate JSON files...
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContextOptions, Page } from '@playwright/test';
import type { FixturePaths } from '$e2e/filepaths.js';

import { absoluteFixturePath } from './core.js';

/**
 * Source code of idb-opfs
 */
const idbopfs = readFileSync('node_modules/idb-opfs/dist/index.mjs', {
	encoding: 'utf8',
});

type FSEntry =
	| {
			type: 'directory';
			path: string;
	  }
	| {
			type: 'file';
			path: string;
			base64: string;
	  };

type _StorageStateNoOpfs = Exclude<BrowserContextOptions['storageState'], undefined | string>;

export type StorageState = Omit<_StorageStateNoOpfs, 'origins'> & {
	origins: Array<_StorageStateNoOpfs['origins'][number] & { opfs?: FSEntry[] }>;
};

export function supportsOpfs(page: Page): boolean {
	const isWebkit = page.context().browser()?.browserType().name() === 'webkit';
	return !isWebkit;
}

export async function collectOPFSState(page: Page, destination: FixturePaths.StorageStates) {
	const origin = new URL(page.url()).origin;

	const tree = await page.evaluate(async () => {
		async function serializeFile(directory: string, value: File): Promise<FSEntry> {
			const content = await value.bytes();

			return {
				path: `${directory}/${value.name}`,
				base64: content.toBase64(),
				type: 'file',
			};
		}

		async function walk(path: string, base: FileSystemDirectoryHandle) {
			const tree: FSEntry[] = [];

			for await (const [name, entry] of base) {
				if (entry.kind === 'directory') {
					tree.push(...(await walk(`${path}/${name}`, entry)));
					continue;
				}

				tree.push(await serializeFile(path, await entry.getFile()));
			}

			// Seems like Chrome does not store content in files themselves but in .crswap equivalents

			for (const [i, entry] of tree.entries()) {
				if (entry.type === 'file' && entry.base64 === '') {
					// Try to find the .crswap
					const crswap = tree.findIndex((e) => e.path === entry.path + '.crswap');

					// The entry just is an empty file then
					if (crswap === undefined) continue;

					if (tree[i].type !== 'file') continue;
					if (tree[crswap].type !== 'file') throw new Error('non-file crswap entry');

					// Remove the crswap entry and use its contents here
					tree[i].base64 = tree[crswap].base64;
					tree.splice(crswap, 1);
				}
			}

			return tree;
		}

		return await walk('', await navigator.storage.getDirectory());
	});

	const dest = absoluteFixturePath(destination);
	const existing: StorageState = existsSync(dest)
		? JSON.parse(readFileSync(dest).toString('utf8'))
		: { origins: [{ origin }] };

	existing.origins = existing.origins.map((o) =>
		o.origin === origin ? { ...o, opfs: tree } : o
	);

	mkdirSync(path.dirname(dest), { recursive: true });
	writeFileSync(dest, JSON.stringify(existing, null, 2));
}

/**
 * On webkit, OPFS is not supported, so we load the storage state ourselves after opfs has been mocked
 */
export async function restoreOPFS(
	page: Page,
	statefile: FixturePaths.StorageStates | StorageState
) {
	const isWebkit = page.context().browser()?.browserType().name() == 'webkit';

	if (!isWebkit) return;

	const state: StorageState =
		typeof statefile === 'string'
			? JSON.parse(readFileSync(absoluteFixturePath(statefile)).toString('utf8'))
			: statefile;

	const origin = new URL(page.url()).origin;
	const tree = state.origins.find((o) => o.origin === origin)?.opfs ?? [];

	await page.addInitScript(
		async ({ tree, isWebkit, idbopfs }) => {
			async function importModuleSource(source: string) {
				const blob = new Blob([source], { type: 'application/javascript' });
				const url = URL.createObjectURL(blob);
				const mod = await import(url);
				URL.revokeObjectURL(url);
				return mod;
			}

			if (isWebkit) {
				const { mockOPFS }: typeof import('idb-opfs') = await importModuleSource(idbopfs);
				await mockOPFS({ debug: true });
			}

			const root = await navigator.storage.getDirectory();

			// Clear OPFS in case there's anything: since Playwright isnt aware
			// of OPFS at all, it seems like there's no isolation
			for await (const entry of root.keys()) {
				await root.removeEntry(entry, { recursive: true });
			}

			async function _opfsHandleViaAbsolutePath(
				root: FileSystemDirectoryHandle,
				entry: FSEntry
			): Promise<FileSystemDirectoryHandle | FileSystemFileHandle> {
				const parents = entry.path.split('/');
				if (parents.shift() !== '') throw new Error('path doesnt start with /');

				const filename = parents.pop();
				if (!filename) throw new Error('called on empty path');

				let base = root;

				// create all parent directories (as needed ofc)
				while (parents.length > 0)
					base = await base.getDirectoryHandle(parents.shift()!, { create: true });

				if (entry.type === 'directory')
					return base.getDirectoryHandle(filename, { create: true });
				else return base.getFileHandle(filename, { create: true });
			}

			// Sorting the tree by filepath should be enough to create parent folders before needing them for children entries
			for (const entry of tree) {
				const handle = await _opfsHandleViaAbsolutePath(root, entry);

				if (handle.kind === 'file') {
					const name = entry.path.split('/').at(-1);
					if (!name) throw new Error('File has no name');
					if (entry.type !== 'file') throw new Error('Handle/entry type mismatch');

					const writable = await handle.createWritable();
					await writable.write(
						new File(entry.base64 ? [Uint8Array.fromBase64(entry.base64)] : [], name)
					);

					await writable.close();
				}
			}
		},
		{ tree, isWebkit, idbopfs }
	);
}

export async function mockOPFSOnWebWorkers(page: Page) {
	const isWebkit = page.context().browser()?.browserType().name() === 'webkit';

	if (!isWebkit) return;

	console.debug('Will mock OPFS in web workers');

	// Since opfs-mock is in-memory-backed, the web worker's opfs state is not shared
	// with the main thread. we need to do a indexeddb-backed opfs state...
	const mockOpfs = async ({ idbopfs: source }: { idbopfs: string }) => {
		console.debug('Mocking OPFS in web worker');

		const blob = new Blob([source], { type: 'application/javascript' });
		const url = URL.createObjectURL(blob);
		const idbopfs: typeof import('idb-opfs') = await import(url);
		URL.revokeObjectURL(url);

		await idbopfs.mockOPFS({ debug: true });
	};

	// Wait for opfs to be mocked on the web worker before continuing
	await new Promise<void>((resolve, reject) => {
		page.on(
			'worker',
			async (worker) =>
				await worker.evaluate(mockOpfs, { idbopfs }).then(resolve).catch(reject)
		);
	});

	// Also mock on future workers just in case
	page.on('worker', async (worker) => worker.evaluate(mockOpfs, { idbopfs }));
}
