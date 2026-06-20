import type { BinaryStorageBackend, BinaryStorageLocator } from './types.js';

import { locatorToPath } from './utils.js';

export async function OPFSBackend(): Promise<BinaryStorageBackend<'opfs'>> {
	const root = await navigator.storage.getDirectory();

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
		async read(locator) {
			const [directory, name] = await walk(locator);
			const handle = await directory.getFileHandle(name);
			const file = await handle.getFile();
			return file.arrayBuffer();
		},
		async write(locator, content) {
			const [directory, name] = await walk(locator);

			const handle = await directory.getFileHandle(name, { create: true });
			const writable = await handle.createWritable();
			await writable.write(content);
		},
		async size(locator) {
			const [directory, name] = await walk(locator);
			const handle = await directory.getFileHandle(name);
			const file = await handle.getFile();
			return file.size;
		},
	};
}
