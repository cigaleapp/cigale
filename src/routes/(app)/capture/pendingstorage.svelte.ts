import type { BinaryStorageLocator } from '$lib/storage/types.js';

import { Capacitor } from '@capacitor/core';

import { errorMessage } from '$lib/i18n.js';
import { imageFileId } from '$lib/images.js';
import { processImageFile } from '$lib/import.svelte.js';
import { binaryStorage } from '$lib/storage/index.js';
import { toasts } from '$lib/toasts.svelte.js';

export const PENDING_PHOTOS_ROOT_FOLDER = '.pending_captures';

// TODO: refactor this, make two private methods for each platform (native or web)'s impl of save/flush/clear/open/countPhotos

export class PendingStorage {
	public count = $state(0);
	/** Filename of first image */
	private filenameCounterOrigin: number;

	constructor(private sessionId: string) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const now = new Date();
		this.filenameCounterOrigin = now.getHours() * 1e3 + now.getMinutes();
	}

	static async open(sessionId: string): Promise<PendingStorage> {
		console.debug(PendingStorage.logHeader(''), 'opening', sessionId);

		const storage = new PendingStorage(sessionId);

		storage.count = await binaryStorage.count(storage.locator(''));

		return storage;
	}

	static async *sessions() {
		for await (const { sessionId } of binaryStorage.list({
			area: PENDING_PHOTOS_ROOT_FOLDER,
			sessionId: '',
			name: '',
		})) {
			if (sessionId) yield sessionId;
		}
	}

	async save(data: string) {
		// Optimistic update + beyond an await state changes arent tracked anyways
		this.count++;

		try {
			const { name } = await binaryStorage.create(
				this.locator(this.nextFilename()),
				{
					type: this.photosContentType,
					base64: data,
				},
				{
					fixedFilenameCounter: 4,
				}
			);

			this.log('saved photo as ', name);
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
			await binaryStorage.delete(this.locator(filename));
		} catch (e) {
			console.error('Could not delete photo', e);
			toasts.error(errorMessage(e, 'Impossible de supprimer la photo'));
			this.count = await binaryStorage.count(this.locator('')).catch(() => this.count - 1);
		}
	}

	async *files() {
		for await (const location of binaryStorage.list(this.locator(''))) {
			if (!location.name.match(this.filenamePattern)) {
				this.warn(
					`session's directory contains unrelated file ${JSON.stringify(location.name)} (doesnt match ${this.filenamePattern}), ignoring`
				);

				continue;
			}

			yield await binaryStorage.read(location, this.photosContentType);
		}
	}

	async size() {
		let sum = 0;

		for await (const location of binaryStorage.list(this.locator(''))) {
			sum += await binaryStorage.size(location);
		}

		return sum;
	}

	/**
	 * @returns true if all files were successfully flushed
	 */
	async flush({ onProgress }: { onProgress: (data: { total: number; done: number }) => void }) {
		this.log('flushing all pending photos');

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
				toasts.error(errorMessage(error, `Impossible d'importer ${file.name}`));
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
		this.log('clearing');
		await binaryStorage.clear(this.locator(''));
	}

	private get photosContentType(): `image/${string}` {
		if (Capacitor.isNativePlatform()) return 'image/jpeg';
		return 'image/png';
	}

	/**
	 * Will receive _2, _3, etc. when using it to write files thanks to BinaryStorage.create
	 */
	private nextFilename() {
		const extension = this.photosContentType.split('/').at(-1)!.toUpperCase();
		return `IMG.${extension}` as const;
	}

	private get filenamePattern() {
		const [, ext] = this.photosContentType.split('/', 2);
		return new RegExp(`^IMG_(\\d+)\\.${ext.toUpperCase()}$`);
	}

	private locator<Name extends string>(name: Name): BinaryStorageLocator<Name> {
		return {
			area: PENDING_PHOTOS_ROOT_FOLDER,
			sessionId: this.sessionId,
			name,
		};
	}

	private static logHeader(sessionId: string) {
		return `[PendingStorage ${sessionId || '<no session>'}]`;
	}

	private log(...args: unknown[]) {
		console.debug(PendingStorage.logHeader(this.sessionId), ...args);
	}

	private warn(...args: unknown[]) {
		console.warn(PendingStorage.logHeader(this.sessionId), ...args);
	}
}
