import type { ExifFieldKey } from '$lib/exiffields';
import type { BinaryStorageLocator } from '$lib/storage/types.js';

import { Capacitor } from '@capacitor/core';
import { GPSHelper } from 'piexifjs';

import { getCurrentLocation } from '$lib/geolocation.js';
import { errorMessage } from '$lib/i18n.js';
import { imageFileId } from '$lib/images.js';
import { processImageFile } from '$lib/import.svelte.js';
import { binaryStorage } from '$lib/storage/index.js';
import { toasts } from '$lib/toasts.svelte.js';

export const PENDING_PHOTOS_ROOT_FOLDER = '.pending_captures';

export type PendingPhotosRootFolders =
	| typeof PENDING_PHOTOS_ROOT_FOLDER
	| `${typeof PENDING_PHOTOS_ROOT_FOLDER}/exif`
	| `${typeof PENDING_PHOTOS_ROOT_FOLDER}/photos`;

// TODO: refactor this, make two private methods for each platform (native or web)'s impl of save/flush/clear/open/countPhotos

export class PendingStorage {
	public count = $state(0);

	constructor(private sessionId: string) {}

	static async open(sessionId: string): Promise<PendingStorage> {
		console.debug(PendingStorage.logHeader(''), 'opening', sessionId);

		const storage = new PendingStorage(sessionId);

		storage.count = await binaryStorage.count(storage.locator('photos', ''));

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

	async saveExtraExif(photoName: string) {
		const fields = {} as {
			[K in ExifFieldKey]?: string | number | Array<[number, number]> | Date;
		};

		fields.ProcessingSoftware = 'Cigale Integrated Capture Mode';

		const location = await getCurrentLocation();

		if (location) {
			fields.GPSLongitude = GPSHelper.degToDmsRational(location.longitude);
			fields.GPSLatitude = GPSHelper.degToDmsRational(location.latitude);

			if (location.altitude !== null) {
				fields.GPSAltitudeRef = location.altitude > 0 ? 0 : 1;
				fields.GPSAltitude = [[Math.abs(location.altitude), 1]];
			}
		}

		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		fields.DateTimeOriginal = new Date();

		await binaryStorage.write(this.locator('exif', `${photoName}.json`), {
			type: 'application/json',
			text: JSON.stringify(fields),
		});

		this.log(`saved photo extra exif fields as ${photoName}.json`);
	}

	async extraExif(photoName: string) {
		const extraExifFile = await binaryStorage
			.read(this.locator('exif', `${photoName}.json`), 'application/json')
			.catch(() => undefined);

		if (!extraExifFile) return {};

		const fields: { [K in ExifFieldKey]?: string | number | Array<[number, number]> } =
			JSON.parse(await extraExifFile.text());

		this.log(`Extra EXIF data for ${photoName}: `, fields);

		return fields;
	}

	async save(data: string) {
		// Optimistic update + beyond an await state changes arent tracked anyways
		this.count++;

		try {
			const { name } = await binaryStorage.create(
				this.locator('photos', this.nextFilename()),
				{
					type: this.photosContentType,
					base64: data,
				},
				{
					fixedFilenameCounter: 4,
				}
			);

			this.log('saved photo as ', name);

			await this.saveExtraExif(name);
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
			await binaryStorage.delete(this.locator('photos', filename));
			await binaryStorage.delete(this.locator('exif', `${filename}.json`));
		} catch (e) {
			console.error('Could not delete photo', e);
			toasts.error(errorMessage(e, 'Impossible de supprimer la photo'));
			this.count = await binaryStorage
				.count(this.locator('photos', ''))
				.catch(() => this.count - 1);
		}
	}

	async *files() {
		for await (const location of binaryStorage.list(this.locator('photos', ''))) {
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

		for await (const location of binaryStorage.list(this.locator('photos', ''))) {
			sum += await binaryStorage.size(location);
		}

		for await (const location of binaryStorage.list(this.locator('exif', ''))) {
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
					extraExif: await this.extraExif(file.name),
					sidecars: [],
					file,
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
		await binaryStorage.clear(this.locator(null, ''));
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

	private locator<Name extends string>(
		section: 'photos' | 'exif' | null,
		name: Name
	): BinaryStorageLocator<Name> {
		return {
			area: section ? `${PENDING_PHOTOS_ROOT_FOLDER}/${section}` : PENDING_PHOTOS_ROOT_FOLDER,
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
