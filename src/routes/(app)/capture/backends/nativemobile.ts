import type { PendingStorageBackend } from '../pendingstorage.svelte.js';

import { Directory, Filesystem } from '@capacitor/filesystem';

export const NativeCapacitorBackend: PendingStorageBackend<{
	_sessionId: string;
	_location: (filename: string) => { directory: Directory; path: string };
}> = {
	_sessionId: '',

	async *sessions() {
		const { files } = await Filesystem.readdir(this._location('')).catch(() => ({ files: [] }));

		for (const file of files) {
			yield file.name;
		}
	},

	async open(sessionId) {
		this._sessionId = sessionId;
		return this;
	},

	async save(base64, filename) {
		await Filesystem.writeFile({
			...this._location(filename),
			data: base64,
			recursive: true,
		});
	},

	async delete(filename) {
		await Filesystem.deleteFile({
			...this._location(filename),
		});
	},

	async count() {
		return await Filesystem.readdir(this._location(''))
			.then(({ files }) => files.length)
			.catch(() => 0);
	},

	async *files() {
		const { files } = await Filesystem.readdir(this._location('')).catch(() => ({ files: [] }));

		for (const entry of files) {
			const { data } = await Filesystem.readFile(this._location(entry.name));

			yield new File(
				[typeof data === 'string' ? Uint8Array.fromBase64(data) : data],
				entry.name,
				{
					type: 'image/jpeg',
				}
			);
		}
	},

	async clear() {
		await Filesystem.rmdir({
			...this._location('/'),
			recursive: true,
		});
	},

	/**
	 * Get a native location for filepath inside the base directory for the session
	 */
	_location(filepath) {
		return {
			directory: Directory.External,
			path: `.pending_nattures/${this._sessionId}/${filepath}`,
		};
	},
};
