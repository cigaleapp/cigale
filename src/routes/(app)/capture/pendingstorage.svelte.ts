import type { ExifFieldKey } from '#lib/exiffields.js';
import type { NamespacedMetadataID } from '#lib/schemas/common.js';
import type { BinaryStorageLocator } from '#lib/storage/types.js';

import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { GPSHelper } from 'piexifjs';

import { page } from '$app/state';
import { generateId } from '#lib/database.js';
import { getCurrentLocation } from '#lib/geolocation.js';
import { errorMessage } from '#lib/i18n.js';
import * as idb from '#lib/idb.svelte.js';
import { imageFileId } from '#lib/images.js';
import { processAudioFile } from '#lib/import/audio.svelte.js';
import { processImageFile } from '#lib/import/images.svelte.js';
import { storeMetadataValue } from '#lib/metadata/index.js';
import { getSettings } from '#lib/settings.svelte.js';
import { binaryStorage } from '#lib/storage/index.js';
import { toasts } from '#lib/toasts.svelte.js';
import { uiState } from '#lib/uistate.svelte.js';
import { switchValue } from '#lib/utils.js';

export const PENDING_PHOTOS_ROOT_FOLDER = '.pending_captures';

const SECTIONS = ['exif', 'photos', 'audio'] as const;

type Section = (typeof SECTIONS)[number];

type Kind = Exclude<Section, 'exif'>;

export type PendingPhotosRootFolders =
	typeof PENDING_PHOTOS_ROOT_FOLDER | `${typeof PENDING_PHOTOS_ROOT_FOLDER}/${Section}`;

// TODO: refactor this, make two private methods for each platform (native or web)'s impl of save/flush/clear/open/countPhotos

export class PendingStorage {
	public count = $state(0);
	private frozenCount = false;

	constructor(private sessionId: string) {}

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
		this.count =
			(await binaryStorage.count(this.locator('photos', ''))) +
			(await binaryStorage.count(this.locator('audio', '')));
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

		let bytes: ArrayBuffer;

		try {
			if (typeof data === 'string') {
				// TODO: once we have capacitor backend enabled again
				// // For capacitor storage, this is the URI
				// const dest = await Promise.resolve(
				// 	this.locator('audio', this.nextFilename('audio'))
				// )
				// 	.then(async (loc) => binaryStorage.findFree(loc))
				// 	.then(async (free) => binaryStorage.resolvePath(free));

				// console.debug(`[pending storage] copying audio: ${data} -> ${dest}`);
				// await Filesystem.rename({ from: data, to: dest });

				// name = dest.split('/').at(-1) ?? '';

				bytes = await Filesystem.readFile({ path: data })
					.then((result) => result.data as string)
					.then((base64) => Uint8Array.fromBase64(base64))
					.then((bytes) => bytes.buffer);
			} else {
				bytes = await data.arrayBuffer();
			}

			const file = await binaryStorage.create(
				this.locator('audio', this.nextFilename('audio')),
				{
					type: this.audioContentType,
					bytes,
				},
				{
					fixedFilenameCounter: 4,
				}
			);

			const name = file.name;

			this.log('saved audio as ', name);
			if (name) void this.saveExtraExif(name);
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
				this.locator('photos', this.nextFilename('photos')),
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

	async delete(section: Section, filename: string) {
		if (!this.frozenCount) {
			// Same reasoning as .save()
			this.count--;
		}

		try {
			await binaryStorage.delete(this.locator(section, filename));
			if (section !== 'exif') {
				await binaryStorage.delete(this.locator('exif', `${filename}.json`));
			}
		} catch (e) {
			console.error('Could not delete media', e);
			// toasts.error(errorMessage(e, 'Impossible de supprimer le média'));
		} finally {
			await this.refreshCount();
		}
	}

	async *files(...kinds: Kind[]) {
		for (const kind of kinds) {
			const contentType = switchValue(kind, {
				photos: this.photosContentType,
				audio: this.audioContentType,
			});
			for await (const location of binaryStorage.list(this.locator(kind, ''))) {
				if (!location.name.match(this.filenamePattern(kind))) {
					this.warn(
						`session's directory contains unrelated file ${JSON.stringify(location.name)} (doesnt match ${this.filenamePattern(kind)}), ignoring`
					);

					continue;
				}

				yield await binaryStorage.read(location, contentType);
			}
		}
	}

	async size() {
		let sum = 0;

		for await (const location of binaryStorage.list(
			...SECTIONS.map((s) => this.locator(s, ''))
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
				await this.delete('photos', file.name).catch((e) =>
					console.error('couldnt delete file', e)
				);
			}

			done++;
			onProgress({ total, done });
		}

		for await (const file of this.files('audio')) {
			let imported = false;

			try {
				await processAudioFile(page.data.swarpc, {
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
				await this.delete('audio', file.name).catch((e) =>
					console.error('couldnt delete file', e)
				);
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

		await this.delete('exif', name);
	}

	async clear() {
		this.log('clearing');
		for (const section of SECTIONS) {
			await binaryStorage.clear(this.locator(section, ''));
		}
	}

	private get photosContentType(): `image/${string}` {
		if (Capacitor.isNativePlatform()) return 'image/jpeg';
		return 'image/png';
	}

	private get audioContentType(): `audio/${string}` {
		if (Capacitor.isNativePlatform()) {
			return getSettings().audioCaptureUseAAC ? 'audio/aac' : 'audio/m4a';
		}
		return 'audio/m4a';
	}

	private contentType(kind: Kind) {
		switch (kind) {
			case 'photos':
				return this.photosContentType;
			case 'audio':
				return this.audioContentType;
		}
	}

	private fileNamePart(kind: Kind) {
		switch (kind) {
			case 'photos':
				return 'IMG';
			case 'audio':
				return 'Rec';
		}
	}

	/**
	 * Will receive _2, _3, etc. when using it to write files thanks to BinaryStorage.create
	 */
	private nextFilename(kind: Kind) {
		const [, ext] = this.contentType(kind).split('/', 2);
		return `${this.fileNamePart(kind)}.${ext.toUpperCase()}` as const;
	}

	private filenamePattern(kind: Kind) {
		const extensions = switchValue(kind, {
			photos: ['png', 'jpg', 'jpeg'],
			audio: ['m4a', 'aac', 'adts'],
		});

		return new RegExp(`^${this.fileNamePart(kind)}_(\\d+)\\.${extensions.join('|')}$`, 'i');
	}

	private locator<Name extends string>(section: Section, name: Name): BinaryStorageLocator<Name> {
		return {
			area: `${PENDING_PHOTOS_ROOT_FOLDER}/${section}`,
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
