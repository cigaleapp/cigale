import type { BinaryStorageBackend, BinaryStorageLocator } from './types.js';

import { pick } from '$lib/utils.js';

import { locatorToPath } from './utils.js';

export async function OPFSBackend(): Promise<BinaryStorageBackend<'opfs'>> {
	if (localStorage.getItem('playwright_mock_opfs') === 'true') {
		console.debug('Mocking OPFS...');
		await import('opfs-mock');
	}

	const root = await navigator.storage.getDirectory();

	// TODO:
	// If we're running in a web worker, we can use sync access handles, which are more performant
	// See https://developer.mozilla.org/en-US/docs/Web/API/FileSystemSyncAccessHandle
	// const isInWebWorker =
	// 	typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;

	/** Get to the directory handle of the given path */
	async function walk(locator: BinaryStorageLocator) {
		async function recurse([top, ...rest]: string[], base: FileSystemDirectoryHandle) {
			if (rest.length === 0) {
				return [base, top] as const;
			}

			return recurse(rest, await base.getDirectoryHandle(top, { create: true }));
		}

		return recurse(locatorToPath(locator).split('/'), root);
	}

	async function getFile(locator: BinaryStorageLocator) {
		const [directory, name] = await walk(locator);
		const handle = await directory.getFileHandle(name);
		return await handle.getFile();
	}

	return {
		name: 'opfs',
		async exists(locator) {
			const [directory, name] = await walk(locator);

			try {
				await directory.getFileHandle(name);
			} catch (error) {
				if (error instanceof DOMException && error.name === 'NotFoundError') {
					return false;
				}

				throw error;
			}

			return true;
		},
		async delete(locator) {
			const [directory, name] = await walk(locator);
			await directory.removeEntry(name);
		},
		async *list(locator) {
			const [parent, name] = await walk(locator);
			const directory = await parent.getDirectoryHandle(name).catch(() => undefined);

			if (!directory) return;

			for await (const name of directory.keys()) {
				yield { ...locator, name };
			}
		},
		async read(locator) {
			return getFile(locator);
		},
		async bytes(locator) {
			return getFile(locator).then((file) => file.arrayBuffer());
		},
		async text(locator) {
			return getFile(locator).then((file) => file.text());
		},
		async write(locator, content) {
			const [directory, name] = await walk(locator);

			let blob: Blob;

			if (content instanceof Blob) {
				blob = content;
			} else if ('text' in content) {
				blob = new Blob([content.text], pick(content, 'type'));
			} else if ('bytes' in content) {
				blob = new Blob([content.bytes], pick(content, 'type'));
			} else {
				blob = new Blob([Uint8Array.fromBase64(content.base64)], pick(content, 'type'));
			}

			const handle = await directory.getFileHandle(name, { create: true });

			const writable = await handle.createWritable();
			await writable.write(blob);
			await writable.close();
		},
		async size(locator) {
			const [directory, name] = await walk(locator);
			const handle = await directory.getFileHandle(name);
			const file = await handle.getFile();
			return file.size;
		},
		async count(locator) {
			const [parent, name] = await walk(locator);
			const directory = await parent.getDirectoryHandle(name).catch(() => undefined);

			if (!directory) return 0;

			let total = 0;
			for await (const _ of directory) {
				total++;
			}

			return total;
		},
		async clear(locator) {
			const [parent, name] = await walk(locator);
			const directory = await parent.getDirectoryHandle(name);

			if (directory.remove) {
				await directory.remove({ recursive: true });
				return;
			}

			for await (const name of parent.keys()) {
				await parent.removeEntry(name, { recursive: true });
			}
		},
	};
}
