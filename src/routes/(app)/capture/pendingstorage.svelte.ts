import type { ExifFieldKey } from '$lib/exiffields';
import type { NamespacedMetadataID } from '$lib/schemas/common';
import type { BinaryStorageLocator } from '$lib/storage/types.js';
import type { PROCEDURES } from '$worker/procedures.js';
import type { SwarpcClient } from 'swarpc';

import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { GPSHelper } from 'piexifjs';

import { generateId } from '$lib/database.js';
import { getCurrentLocation } from '$lib/geolocation.js';
import { errorMessage } from '$lib/i18n.js';
import * as idb from '$lib/idb.svelte.js';
import { imageFileId } from '$lib/images.js';
import { processAudioFile } from '$lib/import/audio.svelte.js';
import { processImageFile } from '$lib/import/images.svelte.js';
import { storeMetadataValue } from '$lib/metadata/index.js';
import { binaryStorage } from '$lib/storage/index.js';
import { toasts } from '$lib/toasts.svelte.js';
import { uiState } from '$lib/uistate.svelte';
import { switchValue } from '$lib/utils.js';

export const PENDING_PHOTOS_ROOT_FOLDER = '.pending_captures';

export type PendingPhotosRootFolders =
	| typeof PENDING_PHOTOS_ROOT_FOLDER
	| `${typeof PENDING_PHOTOS_ROOT_FOLDER}/exif`
	| `${typeof PENDING_PHOTOS_ROOT_FOLDER}/photos`
	| `${typeof PENDING_PHOTOS_ROOT_FOLDER}/audio`;

// TODO: refactor this, make two private methods for each platform (native or web)'s impl of save/flush/clear/open/countPhotos

export class PendingStorage {
	public count = $state(0);
	private frozenCount = false;
	private audioURIs: string[] = [];

	constructor(
		private swarpc: SwarpcClient<typeof PROCEDURES>,
		private sessionId: string
	) {}

	static async open(sessionId: string): Promise<PendingStorage> {
		console.debug(PendingStorage.logHeader(''), 'opening', sessionId);

		const storage = new PendingStorage(sessionId);
		await storage.refreshCount();

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

	public freezeCount() {
		this.frozenCount = true;
	}
	public async unfreezeCount() {
		this.frozenCount = false;
		await this.refreshCount();
	}

	async refreshCount() {
		if (this.frozenCount) return;
		this.count = await binaryStorage.count(this.locator('photos', ''));
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
			fields.GPSHPositioningError = location.accuracy;

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

	async saveAudio(data: Blob | string) {
		if (!this.frozenCount) {
			this.count++;
		}

		if (typeof data === 'string') {
			this.audioURIs.push(data);
			return;
		}

		try {
			const { name } = await binaryStorage.create(
				this.locator('audio', this.nextFilename()),
				{
					type: this.audioContentType,
					bytes: await data.arrayBuffer(),
				},
				{
					fixedFilenameCounter: 4,
				}
			);

			this.log('saved audio as ', name);

			void this.saveExtraExif(name);

			return name;
		} catch (e) {
			console.error('Could not save photo', e);
			toasts.error(errorMessage(e, 'Impossible de sauvgarder la photo'));
			if (!this.frozenCount) this.count--;
		} finally {
			await this.refreshCount();
		}
	}

	/** @returns the name of the saved file */
	async savePhoto(data: string) {
		if (!this.frozenCount) {
			// Optimistic update + beyond an await state changes arent tracked anyways
			this.count++;
		}

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

			void this.saveExtraExif(name);

			return name;
		} catch (e) {
			console.error('Could not save photo', e);
			toasts.error(errorMessage(e, 'Impossible de sauvgarder la photo'));
			if (!this.frozenCount) this.count--;
		} finally {
			await this.refreshCount();
		}
	}

	async delete(filename: string) {
		if (!this.frozenCount) {
			// Same reasoning as .save()
			this.count--;
		}

		try {
			await binaryStorage.delete(this.locator('photos', filename));
			await binaryStorage.delete(this.locator('audio', filename));
			await binaryStorage.delete(this.locator('exif', `${filename}.json`));
		} catch (e) {
			console.error('Could not delete media', e);
			// toasts.error(errorMessage(e, 'Impossible de supprimer le média'));
		} finally {
			await this.refreshCount();
		}
	}

	async *files(kind: 'photos' | 'audio') {
		const contentType = switchValue(kind, {
			photos: this.photosContentType,
			audio: this.audioContentType,
		});

		for await (const location of binaryStorage.list(this.locator(kind, ''))) {
			if (!location.name.match(this.filenamePattern)) {
				this.warn(
					`session's directory contains unrelated file ${JSON.stringify(location.name)} (doesnt match ${this.filenamePattern}), ignoring`
				);

				continue;
			}

			yield await binaryStorage.read(location, contentType);
		}

		const uris = switchValue(kind, { photos: [], audio: this.audioURIs });

		for (const uri of uris) {
			const filename = uri.split('/').at(-1);

			if (!filename) {
				console.warn(`File URI ${uri} had no filename (no / segments), skipping`);
				continue;
			}

			yield await Filesystem.readFile({
				path: uri,
			})
				.then((result) => result.data as string)
				.then((base64) => Uint8Array.fromBase64(base64))
				.then((bytes) => new Blob([bytes], { type: contentType }))
				.then((blob) => new File([blob], filename));
		}
	}

	async size() {
		let sum = 0;

		for await (const location of binaryStorage.list(
			this.locator('photos', ''),
			this.locator('audio', ''),
			this.locator('exif', '')
		)) {
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

		for await (const file of this.files('photos')) {
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

			if (imported) {
				await this.delete(file.name).catch((e) => console.error('couldnt delete file', e));
			}

			done++;
			onProgress({ total, done });
		}

		for (const audioUri of this.audioURIs) {
			try {
				await processAudioFile(this.swarpc, {
					id: imageFileId(),
					// TODO
					// extraExif: {},
					sidecars: [],
					file,
				});
			} catch (error) {
				console.error("Couldn't process audio file", audioUri, error);
				hasErrors = true;
			}

			done++;
			onProgress({ total, done });
		}

		for await (const file of this.files('audio')) {
			let imported = false;

			try {
				await processAudioFile(this.swarpc, {
					id: imageFileId(),
					sidecars: [],
					file,
				});
				imported = true;
			} catch (error) {
				hasErrors = true;
				console.error("Couldn't process audio file", file, error);
				toasts.error(errorMessage(error, `Impossible d'importer ${file.name}`));
			}

			if (imported) {
				await this.delete(file.name).catch((e) => console.error('couldnt delete file', e));
			}

			done++;
			onProgress({ total, done });
		}

		return !hasErrors;
	}

	async flushToMetadata(name: string, metadata: NamespacedMetadataID) {
		this.log(`flushing ${name} to metadata ${metadata}`);

		const existing = uiState.currentSession?.metadata[metadata]?.value as string | undefined;
		if (existing) await idb.drop('MetadataValueFile', existing);

		const file = await binaryStorage.read(this.locator('photos', name), this.photosContentType);

		const id = await idb.set('MetadataValueFile', {
			id: generateId('MetadataValueFile'),
			sessionId: uiState.currentSessionId!,
			size: file.size,
			contentType: file.type,
			filename: file.name,
			bytes: await file.arrayBuffer(),
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			lastModifiedAt: new Date(file.lastModified || Date.now()).toISOString(),
		});

		await storeMetadataValue({
			db: idb.databaseHandle(),
			type: 'file',
			sessionId: uiState.currentSessionId!,
			subjectId: uiState.currentSessionId!,
			metadataId: metadata,
			value: id,
		});

		await this.delete(name);
	}

	async clear() {
		this.log('clearing');
		await binaryStorage.clear(this.locator(null, ''));
	}

	private get photosContentType(): `image/${string}` {
		if (Capacitor.isNativePlatform()) return 'image/jpeg';
		return 'image/png';
	}

	private get audioContentType(): `audio/${string}` {
		if (Capacitor.isNativePlatform()) return 'audio/m4a';
		return 'audio/m4a';
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
		section: 'photos' | 'exif' | 'audio' | null,
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
