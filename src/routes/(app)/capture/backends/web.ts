import type { PendingStorageBackend } from '../pendingstorage.svelte.js';

import { ROOT_FOLDER } from '../pendingstorage.svelte.js';

export const OriginPrivateFilesystemBackend: PendingStorageBackend<{
	_base?: FileSystemDirectoryHandle;
	_root?: FileSystemDirectoryHandle;
	_openRoot: () => Promise<void>;
}> = {
	async *sessions() {
		await this._openRoot();

		for await (const [name] of this._root!) {
			yield name;
		}
	},

	async open(sessionId) {
		await this._openRoot();
		this._base = await this._root!.getDirectoryHandle(sessionId, { create: true });

		return this;
	},

	async save(base64, filename) {
		// XXX: we assume the base64 encoded data is jpeg...
		const file = await this._base!.getFileHandle(filename, { create: true });

		const writable = await file.createWritable();
		await writable.write(Uint8Array.fromBase64(base64));
		await writable.close();
	},

	async delete(filename) {
		await this._base!.removeEntry(filename);
	},

	async count() {
		// XXX: maybe theres a better way to get the size of a AsyncIterator ?
		let count = 0;
		for await (const _ of this._base!) {
			count++;
		}

		return count;
	},

	async *files() {
		for await (const entry of this._base!.values()) {
			if (!(entry instanceof FileSystemFileHandle)) continue;
			yield await entry.getFile();
		}
	},

	async clear() {
		await this._root!.removeEntry(this._base!.name, {
			recursive: true,
		});
	},

	async _openRoot() {
		const opfsRoot = await navigator.storage.getDirectory();

		this._root ??= await opfsRoot.getDirectoryHandle(ROOT_FOLDER, {
			create: true,
		});
	},
};
