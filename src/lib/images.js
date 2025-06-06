import { uiState } from '$lib/state.svelte';
import { downloadAsFile } from './download';
import * as db from './idb.svelte';
import { tables } from './idb.svelte';
import { unique } from './utils';
/**
 * @import { Image, Protocol } from './database.js';
 * @import { IDBTransactionWithAtLeast } from './idb.svelte';
 */

/**
 * Used for tests
 * @param {string} id
 * @param {string} fileId
 * @return {Image}
 */
const sampleImage = (id, fileId) => ({
	id,
	fileId,
	addedAt: new Date(667),
	dimensions: { width: 100, height: 100, aspectRatio: 1 },
	filename: 'gurt: syubau.jpeg',
	boundingBoxesAnalyzed: false,
	contentType: 'image/jpeg',
	metadata: {}
});

/**
 * Retourne un id d'image sous la forme 000001_000001
 * @param {number|string} index
 * @param {number} subindex
 */
export function imageId(index, subindex = 0) {
	return `${imageFileId(index)}_${subindex.toString().padStart(6, '0')}`;
}

/**
 * Retourne un id d'un ImageFile sous la forme 000001
 * @param {number|string} index
 */
export function imageFileId(index) {
	return Number.parseInt(index.toString(), 0).toString().padStart(6, '0');
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('imageId', () => {
		expect(imageId(1)).toBe('000001_000000');
		expect(imageId(1, 2)).toBe('000001_000002');
		expect(imageId(1234567)).toBe('1234567_000000');
		expect(imageId(1234567, 1234567)).toBe('1234567_1234567');
	});
}

/**
 * Retourne l'id d'un objet ImageFile associé à l'objet Image
 * @template {string|undefined} T
 * @param {T} id
 * @returns {T}
 */
export function imageIdToFileId(id) {
	if (id === undefined) return id;

	if (!/^\d+_\d+$/.test(id)) {
		throw new Error(`Malformed image id (correct format is XXXXXX_XXXXXX): ${id}`);
	}
	// @ts-expect-error
	return id?.replace(/(_\d+)+$/, '');
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('imageIdToFileId', () => {
		expect(imageIdToFileId('000001_000000')).toBe('000001');
		expect(imageIdToFileId('1234567_1234567')).toBe('1234567');
		expect(() => imageIdToFileId('1234567_1234567_1234567')).toThrowErrorMatchingInlineSnapshot(
			`[Error: Malformed image id (correct format is XXXXXX_XXXXXX): 1234567_1234567_1234567]`
		);
		expect(imageIdToFileId(undefined)).toBeUndefined();
	});
}

/**
 * @param {Protocol} protocol
 * @param {string|null} imageFileId
 */
export function imageIsAnalyzed(protocol, imageFileId) {
	if (!imageFileId) return false;
	if (uiState.erroredImages.has(imageFileId)) return true;
	return tables.Image.state.some((img) => img.fileId === imageFileId);
}

/**
 * @param {Image} image
 */
export function imageIsClassified(image) {
	return Boolean(
		image.metadata[uiState.classificationMetadataId] || uiState.erroredImages.has(image.id)
	);
}

/**
 * @param {Image} image
 */
export function imageBufferWasSaved(image) {
	return Boolean(image.fileId || uiState.erroredImages.has(image.id));
}

/**
 * Download an image
 * @param {string} imageId database id for the Image object
 * @param {object} [options]
 * @param {string} [options.as] save as -- defaults to the image object's filename
 */
export async function downloadImage(imageId, options) {
	const image = await tables.Image.get(imageId);
	if (!image) throw 'Image non trouvée';
	const file = await db.get('ImageFile', imageIdToFileId(imageId));
	if (!file) throw "L'image n'a pas de fichier associé";

	downloadAsFile(file.bytes, options?.as || image.filename, image.contentType);
}

/**
 *
 * @param {string} id ImageFile ID
 * @param {IDBTransactionWithAtLeast<["Image", "ImageFile", "ImagePreviewFile"]>} [tx]
 * @param {boolean} [notFoundOk=true]
 */
export async function deleteImageFile(id, tx, notFoundOk = true) {
	await db.openTransaction(
		['Image', 'ImageFile', 'ImagePreviewFile', 'Observation'],
		{ tx },
		async (tx) => {
			const observations = await tx.objectStore('Observation').getAll();
			try {
				imagesOfImageFile(id).map(({ id }) => tx.objectStore('Image').delete(id));
				tx.objectStore('ImageFile').delete(id);
				tx.objectStore('ImagePreviewFile').delete(id);
				observations
					.filter(({ images }) => images.includes(id))
					.map(({ images, ...rest }) =>
						tx.objectStore('Observation').put({
							...rest,
							images: images.filter((imageId) => imageId !== id)
						})
					);
			} catch (error) {
				if (notFoundOk) return;
				throw error;
			}
			uiState.erroredImages.delete(id);
			uiState.loadingImages.delete(id);
			if (uiState.imageOpenedInCropper === id) {
				uiState.imageOpenedInCropper = '';
			}

			const previewURL = uiState.previewURLs.get(id);
			if (previewURL) {
				URL.revokeObjectURL(previewURL);
				uiState.previewURLs.delete(id);
			}
		}
	);
}

/**
 *
 * @param {object} param0
 * @param {string} param0.id id of the ImageFile to create
 * @param {ArrayBuffer} param0.originalBytes the image data
 * @param {ArrayBuffer} param0.resizedBytes resized image data
 * @param {string} param0.contentType the content type of the image
 * @param {string} param0.filename the filename of the image
 * @param {number} param0.width the width of the image
 * @param {number} param0.height the height of the image
 * @param {IDBTransactionWithAtLeast<['Image', 'ImageFile', 'ImagePreviewFile']>} [param0.tx] transaction to use
 */
export async function storeImageBytes({
	id,
	originalBytes,
	resizedBytes,
	contentType,
	filename,
	width,
	height,
	tx
}) {
	await db.openTransaction(['ImageFile', 'ImagePreviewFile'], { tx }, async (tx) => {
		tx.objectStore('ImageFile').put({
			id,
			bytes: originalBytes,
			contentType,
			filename,
			dimensions: { width, height }
		});
		tx.objectStore('ImagePreviewFile').put({
			id,
			bytes: resizedBytes,
			contentType,
			filename,
			dimensions: { width, height }
		});
		const preview = new Blob([resizedBytes], { type: contentType });
		uiState.setPreviewURL(id, URL.createObjectURL(preview));
	});
}

// ATTENTION: Changer aussi dans la validation des définitions de protocoles (Ctrl-F pour 1024 dans tout le projet pour être sûr·e de rien louper) si jamais on change ça
const MAXWIDTH = 1024;
/**
 * @param {object} param0
 * @param {number} param0.width
 * @param {number} param0.height
 */
const MAXHEIGHT = ({ width, height }) => Math.round((MAXWIDTH * height) / width);

/**
 * Resize an image to fit within MAXWIDTH and MAXHEIGHT
 * @param {object} param0
 * @param {Blob} param0.source
 * @returns {Promise<[[number, number], ArrayBuffer]>} [[original width, original height], resized image data]
 */
export async function resizeToMaxSize({ source }) {
	// For some reason top-level import fails
	const { resize } = await import('pica-gpu');
	const originalImage = await createImageBitmap(source);
	const { width, height } = originalImage;
	const originalCanvas = document.createElement('canvas');
	originalCanvas.width = width;
	originalCanvas.height = height;
	originalCanvas.getContext('2d')?.drawImage(originalImage, 0, 0);

	const resizedCanvas = document.createElement('canvas');
	resizedCanvas.width = MAXWIDTH;
	resizedCanvas.height = MAXHEIGHT(originalImage);
	resize(originalCanvas, resizedCanvas, {
		targetWidth: MAXWIDTH,
		targetHeight: MAXHEIGHT(originalImage),
		filter: 'mks2013'
	});
	return new Promise((resolve) => {
		resizedCanvas.toBlob((blob) => {
			if (!blob) throw new Error('Failed to resize image');
			blob.arrayBuffer().then((buf) => resolve([[width, height], buf]));
		}, source.type);
	});
}

/**
 *
 * @param {string} imageFileId
 * @param {Image[]} [images] look for images in this array instead of the database
 * @returns {Image[]}
 */
export function imagesOfImageFile(imageFileId, images = undefined) {
	return (images ?? tables.Image.state).filter((img) => img.fileId === imageFileId);
}

if (import.meta.vitest) {
	const { _tablesState } = await import('./idb.svelte');
	const { test, expect } = import.meta.vitest;

	test('imagesOfImageFile', () => {
		const images = [sampleImage('1', '1'), sampleImage('2', '1'), sampleImage('3', '2')];
		const [img1, img2] = images;

		expect(imagesOfImageFile('1', images)).toEqual([img1, img2]);

		_tablesState.Image = [];
		expect(imagesOfImageFile('1')).toEqual([]);

		_tablesState.Image = images;
		expect(imagesOfImageFile('1')).toEqual([img1, img2]);
	});
}

/**
 *
 * @param {string[]} imageFileIds
 * @returns {Map<string, Image[]>}
 */
export function imagesByImageFile(imageFileIds) {
	const images = new Map();
	for (const imageFileId of imageFileIds) {
		images.set(imageFileId, imagesOfImageFile(imageFileId));
	}
	return images;
}

if (import.meta.vitest) {
	const { _tablesState } = await import('./idb.svelte');
	const { test, expect } = import.meta.vitest;

	/**
	 * @param {string} id
	 * @param {string} fileId
	 * @return {Image}
	 */
	const img = (id, fileId) => ({
		id,
		fileId,
		addedAt: new Date(),
		dimensions: { width: 100, height: 100, aspectRatio: 1 },
		filename: 'gurt: syubau.jpeg',
		boundingBoxesAnalyzed: false,
		contentType: 'image/jpeg',
		metadata: {}
	});

	test('imagesByImageFile', () => {
		_tablesState.Image = [img('1', '1'), img('2', '1'), img('3', '2')];

		const [img1, img2, img3] = _tablesState.Image;

		expect(imagesByImageFile(['1', '2'])).toEqual(
			new Map([
				['1', [img1, img2]],
				['2', [img3]]
			])
		);
	});
}

/**
 *
 * @param {Image[]} images
 * @returns {string[]}
 */
export function imageFileIds(images) {
	return unique(images.map((image) => image.fileId).filter((id) => id !== undefined));
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('imageFileIds', () => {
		const images = [sampleImage('1', '1'), sampleImage('2', '1'), sampleImage('3', '2')];
		expect(imageFileIds(images)).toEqual(['1', '2']);
	});
}

/**
 * @param {string} imageId
 * @returns {{ fileId: string; subindex: number|null }}
 */
export function parseImageId(imageId) {
	if (!/^\d+(_\d+)?$/.test(imageId)) {
		throw new Error(`Malformed image id (correct format is XXXXXX_XXXXXX): ${imageId}`);
	}

	const [fileId, subindex] = imageId.split('_', 2);
	const subindexNumber = Number.parseInt(subindex, 10);
	return {
		fileId,
		subindex: Number.isNaN(subindexNumber) ? null : subindexNumber
	};
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('parseImageId', () => {
		expect(parseImageId('000001_000000')).toEqual({ fileId: '000001', subindex: 0 });
		expect(parseImageId('1234567_1234567')).toEqual({ fileId: '1234567', subindex: 1234567 });
		expect(parseImageId('1234567')).toEqual({ fileId: '1234567', subindex: null });
		expect(() => parseImageId('coming in hot!!!')).toThrowErrorMatchingInlineSnapshot(
			`[Error: Malformed image id (correct format is XXXXXX_XXXXXX): coming in hot!!!]`
		);
	});
}
