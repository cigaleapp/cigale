import { uiState } from '$lib/state.svelte';
import { ulid } from 'ulid';
import { coordsScaler, toTopLeftCoords } from './BoundingBoxes.svelte';
import { errorMessage, humanFormatName } from './i18n';
import * as db from './idb.svelte';
import { tables } from './idb.svelte';
import { m } from './paraglide/messages';
import { clamp, unique } from './utils';

/**
 * @import { Image, Protocol } from './database.js';
 * @import { IDBTransactionWithAtLeast } from './idb.svelte';
 * @import * as DB from './database';
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
 * Retourne un id d'image
 * @example "01ARZ3NDEKTSV4RRFFQ69G5FAV_000001"
 * @param {string} fileId
 * @param {number} subindex
 */
export function imageId(fileId, subindex = 0) {
	return `${fileId}_${subindex.toString().padStart(6, '0')}`;
}

/**
 * Retourne un id d'un ImageFile
 * @example "01ARZ3NDEKTSV4RRFFQ69G5FAV"
 */
export function imageFileId() {
	return ulid();
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('imageId', () => {
		const id = imageFileId();
		expect(imageId(id)).toBe(id + '_000000');
		expect(imageId(id, 2)).toBe(id + '_000002');
		expect(imageId(id, 1234567)).toBe(id + '_1234567');
	});
}

/**
 * @param {string} id
 */
export function isValidImageId(id) {
	return /^[0-9A-Z]{26}_\d+$/.test(id);
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;
	describe('isValidImageId', () => {
		test('imageId() generates a valid ID', () => {
			expect(isValidImageId(imageId(imageFileId(), 0))).toBe(true);
		});
		test('imageFileId() is not a valid image ID by itself', () => {
			expect(isValidImageId(imageFileId())).toBe(false);
		});
	});
}

/**
 * @param {string} id
 */
function invalidImageIdError(id) {
	return new Error(
		`Malformed image id (correct format is aaaaaaaaaaaaaaaaaaaaaaaaaa_nnnnnn): ${id}`
	);
}

/**
 * Retourne l'id d'un objet ImageFile associé à l'objet Image
 * @template {string|undefined} T
 * @param {T} id
 * @returns {T}
 */
export function imageIdToFileId(id) {
	if (id === undefined) return id;

	if (!isValidImageId(id)) {
		throw invalidImageIdError(id);
	}
	// @ts-expect-error
	return id?.replace(/(_\d+)+$/, '');
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('imageIdToFileId', () => {
		const id = '0001KVE9TGKVKZ3GG307YQ70CZ';
		expect(imageIdToFileId(`${id}_000000`)).toBe(id);
		expect(imageIdToFileId(`${id}_1234567`)).toBe(id);
		expect(() => imageIdToFileId(`${id}_${id}_123456`)).toThrowErrorMatchingInlineSnapshot(
			`[Error: Malformed image id (correct format is aaaaaaaaaaaaaaaaaaaaaaaaaa_nnnnnn): 0001KVE9TGKVKZ3GG307YQ70CZ_0001KVE9TGKVKZ3GG307YQ70CZ_123456]`
		);
		expect(imageIdToFileId(undefined)).toBeUndefined();
		expect(() => imageIdToFileId('000001')).toThrowErrorMatchingInlineSnapshot(
			`[Error: Malformed image id (correct format is aaaaaaaaaaaaaaaaaaaaaaaaaa_nnnnnn): 000001]`
		);
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
		(uiState.classificationMetadataId && image.metadata[uiState.classificationMetadataId]) ||
			uiState.erroredImages.has(image.id)
	);
}

/**
 * @param {Image} image
 */
export function imageBufferWasSaved(image) {
	return Boolean(image.fileId || uiState.erroredImages.has(image.id));
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
				if (!notFoundOk) return Promise.reject(error);
			}
		}
	);

	uiState.erroredImages.delete(id);
	uiState.loadingImages.delete(id);
	uiState.queuedImages.delete(id);
	if (uiState.imageOpenedInCropper === id) {
		uiState.imageOpenedInCropper = '';
	}

	const previewURL = uiState.previewURLs.get(id);
	if (previewURL) {
		URL.revokeObjectURL(previewURL);
		uiState.previewURLs.delete(id);
	}
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

const ALWAYS_SUPPORTED_TYPES = ['image/jpeg', 'image/png'];

/**
 * Resize an image to fit within MAXWIDTH and MAXHEIGHT
 * @param {object} param0
 * @param {Blob} param0.source
 * @returns {Promise<[[number, number], ArrayBuffer]>} [[original width, original height], resized image data]
 */
export async function resizeToMaxSize({ source }) {
	// For some reason top-level import fails
	const { resize } = await import('pica-gpu');
	const originalImage = await createImageBitmap(source).catch((error) => {
		throw new Error(
			ALWAYS_SUPPORTED_TYPES.includes(source.type)
				? errorMessage(error)
				: ['image/CR2', 'image/x-canon-cr2'].includes(source.type)
					? m.file_format_not_supported_yet({ format: '.CR2' })
					: m.file_format_not_supported({ format: humanFormatName(source.type) })
		);
	});
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
	return unique(images.map((image) => image.fileId).filter((id) => id !== null));
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
	if (!isValidImageId(imageId) && !isValidImageId(`${imageId}_000000`)) {
		throw invalidImageIdError(imageId);
	}

	const [fileId, subindex] = imageId.split('_', 2);
	const subindexNumber = Number.parseInt(subindex, 10);
	return {
		fileId,
		subindex: Number.isNaN(subindexNumber) ? null : subindexNumber
	};
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;
	describe('parseImageId', () => {
		test('parses regular IDs', () => {
			const id = '0001KVE9TGKVKZ3GG307YQ70CZ';
			expect(parseImageId(`${id}_000000`)).toEqual({ fileId: id, subindex: 0 });
			expect(parseImageId(`${id}_1234567`)).toEqual({ fileId: id, subindex: 1234567 });
		});
		test('parses ImageFile IDs', () => {
			const id = '0001KVE9TGKVKZ3GG307YQ70CZ';
			expect(parseImageId(id)).toEqual({ fileId: id, subindex: null });
		});
		test('throws on malformed IDs', () => {
			expect(() => parseImageId('coming in hot!!!')).toThrowErrorMatchingInlineSnapshot(
				`[Error: Malformed image id (correct format is aaaaaaaaaaaaaaaaaaaaaaaaaa_nnnnnn): coming in hot!!!]`
			);
		});

		test('roundtrip', () => {
			const id = imageFileId();
			expect(parseImageId(imageId(id, 1234567))).toStrictEqual({
				fileId: id,
				subindex: 1234567
			});
		});
	});
}

/**
 * @param {ArrayBuffer} bytes image bytes
 * @param {string} contentType content type of the image
 * @param {import('./metadata').RuntimeValue<'boundingbox'>} centeredBoundingBox
 * @param {string} [padding] padding to add around the bounding box when cropping images. string of the form "npx" or "n%"
 * @returns {Promise<{ cropped: ArrayBuffer, original: ArrayBuffer }>}
 */
export async function cropImage(bytes, contentType, centeredBoundingBox, padding = '0px') {
	const bitmap = await createImageBitmap(new Blob([bytes], { type: contentType }));
	const boundingBox = coordsScaler({ x: bitmap.width, y: bitmap.height })(
		toTopLeftCoords(centeredBoundingBox)
	);

	const { inPixels } = parseCropPadding(padding);
	const paddingPixels = { x: inPixels(bitmap.width), y: inPixels(bitmap.height) };

	try {
		const croppedBitmap = await createImageBitmap(
			bitmap,
			clamp(boundingBox.x - paddingPixels.x, 0, bitmap.width),
			clamp(boundingBox.y - paddingPixels.y, 0, bitmap.height),
			clamp(boundingBox.width + 2 * paddingPixels.x, 1, bitmap.width),
			clamp(boundingBox.height + 2 * paddingPixels.y, 1, bitmap.height)
		);

		const canvas = new OffscreenCanvas(croppedBitmap.width, croppedBitmap.height);
		canvas.getContext('2d')?.drawImage(croppedBitmap, 0, 0);
		const croppedBytes = await canvas
			.convertToBlob({
				type: ['image/png', 'image/jpeg'].includes(contentType) ? contentType : 'image/png'
			})
			.then((blob) => blob.arrayBuffer());

		// @ts-ignore
		return { cropped: croppedBytes, original: bytes };
	} catch (error) {
		throw new Error(`Couldn't crop with ${JSON.stringify({ boundingBox, padding })}: ${error}`, {
			cause: error
		});
	} finally {
		bitmap.close();
	}
}

/**
 *
 * @param {string} padding
 * @returns {{ withUnit: string, unitless: number, unit: 'px' | '%', inPixels: (basis: number) => number }}
 */
export function parseCropPadding(padding) {
	const match = padding.match(/(\d+)(px|%)/);
	if (!match) throw new Error(`Invalid crop padding: ${padding}`);
	const [value, unit] = [Number.parseInt(match[1], 10), /** @type {'%'|'px'} */ (match[2])];
	return {
		withUnit: padding,
		unitless: value,
		unit,
		inPixels: (axis) => (unit === 'px' ? value : Math.round((axis * value) / 100))
	};
}
