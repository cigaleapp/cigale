// Playwright won't have support for OPFS in storageState, at least for now
// see https://github.com/microsoft/playwright/pull/41420
// So we capture it with on our own with .addInitScript and separate JSON files...

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import type { FixturePaths } from '$e2e/filepaths.js';

import { absoluteFixtureFilepath } from './core.js';

/**
 * Source code of idb-opfs
 */
const idbopfs = readFileSync('node_modules/idb-opfs/dist/index.mjs', {
	encoding: 'utf8',
});

export type OPFSTestArg = FSEntry[] | FixturePaths.Absolute<FixturePaths.OPFSStates>;

type FSEntry = {
	filepath: string;
	type: 'file' | 'empty-folder';
	base64?: string | undefined;
	contentType?: string | undefined;
};

export async function collectOPFSState(page: Page, destination: FixturePaths.OPFSStates) {
	const tree = await page.evaluate(async () => {
		async function serializeFile(directory: string, value: File): Promise<FSEntry> {
			const content = await value.bytes();

			return {
				filepath: `${directory}/${value.name}`,
				base64: content.toBase64(),
				contentType: value.type,
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
				if (entry.base64 === '') {
					// Try to find the .crswap
					const crswap = tree.findIndex((e) => e.filepath === entry.filepath + '.crswap');

					// The entry just is an empty file then
					if (crswap === undefined) continue;

					// Remove the crswap entry and use its contents here
					tree[i].base64 = tree[crswap].base64;
					tree.splice(crswap, 1);
				}
			}

			return tree;
		}

		return await walk('', await navigator.storage.getDirectory());
	});

	const dest = absoluteFixtureFilepath(destination);
	mkdirSync(path.dirname(dest), { recursive: true });
	writeFileSync(dest, JSON.stringify(tree, null, 2));
}

/**
 * @returns a function to run once the page starts loading web workers
 */
export async function restoreOPFSState(page: Page, input: OPFSTestArg) {
	// Playwright's Webkit build seems to have OPFS disabled
	// See https://github.com/microsoft/playwright/issues/18235
	const isWebkit = page.context().browser()?.browserType().name() == 'webkit';

	const tree: FSEntry[] =
		typeof input === 'string' ? JSON.parse(readFileSync(input, { encoding: 'utf8' })) : input;

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
				const parents = entry.filepath.split('/');
				if (parents.shift() !== '') throw new Error('path doesnt start with /');

				const filename = parents.pop();
				if (!filename) throw new Error('called on empty path');

				let base = root;

				// create all parent directories (as needed ofc)
				while (parents.length > 0)
					base = await base.getDirectoryHandle(parents.shift()!, { create: true });

				if (entry.type === 'empty-folder')
					return base.getDirectoryHandle(filename, { create: true });
				else return base.getFileHandle(filename, { create: true });
			}

			// Sorting the tree by filepath should be enough to create parent folders before needing them for children entries
			for (const entry of tree) {
				const handle = await _opfsHandleViaAbsolutePath(root, entry);

				if (handle.kind === 'file') {
					const name = entry.filepath.split('/').at(-1);
					if (!name) throw new Error('File has no name');

					const writable = await handle.createWritable();
					await writable.write(
						new File(
							entry.base64 ? [Uint8Array.fromBase64(entry.base64)] : [],
							name,
							entry.contentType ? { type: entry.contentType } : {}
						)
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
