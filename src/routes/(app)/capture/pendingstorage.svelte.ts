import { Capacitor } from '@capacitor/core';

import { errorMessage } from '$lib/i18n.js';
import { imageFileId } from '$lib/images.js';
import { processImageFile } from '$lib/import.svelte.js';
import { toasts } from '$lib/toasts.svelte.js';

import { NativeCapacitorBackend } from './backends/nativemobile.js';
import { OriginPrivateFilesystemBackend } from './backends/web.js';

export const ROOT_FOLDER = '.pending_captures';

export type PendingStorageBackend<
	State extends Record<`_${string}`, unknown> = Record<`_${string}`, unknown>,
> = State & {
	/** Lists all sessionIds that have pending photos. Note: some sessionIds may be returned even they have 0 photos, as long as the subfolder exists. Some sessionIds may also not exist in the database */
	sessions(): AsyncIterable<string>;
	/** Open a pending storage */
	open(sessionId: string): Promise<PendingStorageBackend<State>>;
	/** Save a photo to pending storage as a file named filename */
	save(base64: string, filestem: string): Promise<void>;
	/** Delete a single pending photo */
	delete(filename: string): Promise<void>;
	/** Count number of photos in pending storage */
	count(): Promise<number>;
	/** Delete all the photos in pending storage */
	clear(): Promise<void>;
	/** Get all pending photos stored as File objects */
	files(): AsyncIterable<File>;
};

// TODO: refactor this, make two private methods for each platform (native or web)'s impl of save/flush/clear/open/countPhotos

export class PendingStorage {
	public count = $state(0);
	/** Filename of first image */
	private filenameCounterOrigin: number;

	constructor(private backend: PendingStorageBackend) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const now = new Date();
		this.filenameCounterOrigin = now.getHours() * 1e3 + now.getMinutes();
	}

	// TODO: do content detection
	private guessContentType(_base64: string): `image/${string}` {
		if (Capacitor.isNativePlatform()) return 'image/jpeg';
		return 'image/png';
	}

	private nextFilename(type: `image/${string}`) {
		const extension = type.split('/').at(-1)!.toUpperCase();
		return `IMG_${this.filenameCounterOrigin + this.count}.${extension}` as const;
	}

	/** 0-based */
	private indexOfFilename(filename: string) {
		return Number(filename.replace(/^IMG_(\d+)/, '$1')) - this.filenameCounterOrigin;
	}

	private static chooseBackend() {
		return Capacitor.isNativePlatform()
			? NativeCapacitorBackend
			: OriginPrivateFilesystemBackend;
	}

	static async open(sessionId: string): Promise<PendingStorage> {
		console.debug('[PendingStorage] opening', sessionId);

		const storage = new PendingStorage(await PendingStorage.chooseBackend().open(sessionId));

		storage.count = await storage.backend.count();

		return storage;
	}

	static async *sessions() {
		for await (const id of PendingStorage.chooseBackend().sessions()) {
			yield id;
		}
	}

	async save(data: string) {
		// Optimistic update + beyond an await state changes arent tracked anyways
		this.count++;

		const type = this.guessContentType(data);

		console.debug(`[PendingStorage] saving photo to ${this.nextFilename(type)}`);

		try {
			await this.backend.save(data, this.nextFilename(type));
		} catch (e) {
			console.error('Could not save photo', e);
			toasts.error(errorMessage(e, 'Impossible de sauvgarder la photo'));
			this.count--;
		}
	}

	async delete(filename: string) {
		// Same reasoning as .save()
		this.count--;

		try {
			await this.backend.delete(filename);
		} catch (e) {
			console.error('Could not delete photo', e);
			toasts.error(errorMessage(e, 'Impossible de supprimer la photo'));
			this.count = await this.backend.count().catch(() => this.count - 1);
		}
	}

	async *files() {
		for await (const file of this.backend.files()) {
			yield file;
		}
	}

	/**
	 * @returns true if all files were successfully flushed
	 */
	async flush({ onProgress }: { onProgress: (data: { total: number; done: number }) => void }) {
		console.debug(`[PendingStorage] flushing all pending photos`);

		let hasErrors = false;

		const total = $state.snapshot(this.count);
		let done = 0;

		for await (const file of this.files()) {
			let imported = false;

			try {
				await processImageFile({
					id: imageFileId(),
					file,
					sidecars: [],
				});
				imported = true;
			} catch (error) {
				hasErrors = true;
				console.error("Couldn't process image file", file, error);
				toasts.error(
					errorMessage(
						error,
						`Impossible d'importer ${file.name} (photo n°${this.indexOfFilename(file.name) + 1})`
					)
				);
			}

			if (imported)
				await this.delete(file.name).catch((e) => console.error('couldnt delete file', e));

			done++;
			onProgress({
				total,
				done,
			});
		}

		return !hasErrors;
	}

	async clear() {
		console.debug(`[PendingStorage] clearing`);
		await this.backend.clear();
	}
}
