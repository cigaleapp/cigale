import LibRaw from 'libraw-wasm';
import { ulid } from 'ulid';

import { uiState } from '$lib/state.svelte';

import { toTopLeftCoords } from './BoundingBoxes.svelte.js';
import { errorMessage, humanFormatName } from './i18n.js';
import * as db from './idb.svelte.js';
import { tables } from './idb.svelte.js';
import { imageLimits } from './inference_utils.js';
import { clamp, unique } from './utils.js';

/**
 * @import { Image, Protocol } from './database.js';
 * @import { IDBTransactionWithAtLeast } from './idb.svelte';
 */

/**
 * Used for tests
 * @param {string} id
 * @param {string} fileId
 * @returns {Image}
 */
const sampleImage = (id, fileId) => ({
	id,
	fileId,
	sessionId: 'testing',
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
		`Identifiant d'image invalide (le format correct est aaaaaaaaaaaaaaaaaaaaaaaaaa_nnnnnn) : ${id}`
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
			`[Error: Identifiant d'image invalide (le format correct est aaaaaaaaaaaaaaaaaaaaaaaaaa_nnnnnn) : 0001KVE9TGKVKZ3GG307YQ70CZ_0001KVE9TGKVKZ3GG307YQ70CZ_123456]`
		);
		expect(imageIdToFileId(undefined)).toBeUndefined();
		expect(() => imageIdToFileId('000001')).toThrowErrorMatchingInlineSnapshot(
			`[Error: Identifiant d'image invalide (le format correct est aaaaaaaaaaaaaaaaaaaaaaaaaa_nnnnnn) : 000001]`
		);
	});
}

/**
 * @param {Protocol|undefined} protocol
 * @param {string|null} imageFileId
 */
export function imageIsAnalyzed(protocol, imageFileId) {
	if (!protocol) return false;
	if (!imageFileId) return false;
	if (uiState.erroredImages.has(imageFileId)) return true;
	return tables.Image.state.some(
		(img) => img.fileId === imageFileId && img.boundingBoxesAnalyzed
	);
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
 * @param {string} id ImageFile ID or Image ID
 * @param {IDBTransactionWithAtLeast<["Image", "ImageFile", "ImagePreviewFile"]>} [tx]
 * @param {boolean} [notFoundOk=true]
 */
export async function deleteImageFile(id, tx, notFoundOk = true) {
	await db.openTransaction(
		['Image', 'ImageFile', 'ImagePreviewFile', 'Observation'],
		{ tx, session: uiState.currentSession?.id },
		async (tx) => {
			const observations = await tx.objectStore('Observation').getAll();
			// Store there cuz imagesOfImageFile() reads from reactive state.
			const imagesOfFile = imagesOfImageFile(id);
			try {
				tx.objectStore('ImageFile').delete(id);
				tx.objectStore('ImagePreviewFile').delete(id);

				for (const image of imagesOfFile) {
					tx.objectStore('Image').delete(image.id);

					for (const observation of observations) {
						const remainingImages = observation.images.filter(
							(imageId) => imageId !== image.id
						);

						if (remainingImages.length === 0) {
							tx.objectStore('Observation').delete(observation.id);
						} else if (remainingImages.length < observation.images.length) {
							tx.objectStore('Observation').put({
								...observation,
								images: remainingImages
							});
						}
					}
				}
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

	const previewURL = uiState.getPreviewURL(id);
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
 * @param {string} [param0.sessionId] session ID to associate the image with
 */
export async function storeImageBytes({
	id,
	sessionId,
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
			dimensions: { width, height },
			sessionId: sessionId ?? uiState.currentSessionId
		});
		tx.objectStore('ImagePreviewFile').put({
			id,
			bytes: resizedBytes,
			contentType,
			filename,
			dimensions: { width, height },
			sessionId: sessionId ?? uiState.currentSessionId
		});
		const preview = new Blob([resizedBytes], { type: contentType });
		uiState.setPreviewURL(id, URL.createObjectURL(preview));
	});
}

/**
 * Loads a imageFileId preview into uiState.previewURLs
 * @param {string} id
 * @param {'global' | 'session'} [scope] whether to load into global or session preview URLs
 */
export async function loadPreviewImage(id, scope = 'session') {
	const file = await db.get('ImagePreviewFile', id);
	if (!file) return;
	const blob = new Blob([file.bytes], { type: file.contentType });
	uiState.setPreviewURL(id, URL.createObjectURL(blob), scope === 'global');
}

// ATTENTION: Changer aussi dans la validation des définitions de protocoles (Ctrl-F pour 1024 dans tout le projet pour être sûr·e de rien louper) si jamais on change ça
const MAXWIDTH = 1024;
/**
 * @param {object} param0
 * @param {number} param0.width
 * @param {number} param0.height
 */
const MAXHEIGHT = ({ width, height }) => Math.round((MAXWIDTH * height) / width);

const RAW_IMAGE_MEDIA_TYPES = [
	'image/CR2',
	'image/x-canon-cr2',
	'image/x-dcraw',
	'image/x-canon-crw',
	'image/x-kodak-dcr',
	'image/x-adobe-dng',
	'image/x-epson-erf',
	'image/x-kodak-k25',
	'image/x-kodak-kdc',
	'image/x-minolta-mrw',
	'image/x-nikon-nef',
	'image/x-olympus-orf',
	'image/x-pentax-pef',
	'image/x-fuji-raf',
	'image/x-panasonic-raw',
	'image/x-sony-sr2',
	'image/x-sony-srf',
	'image/x-sigma-x3f'
];

const RAW_IMAGE_FILE_EXTENSIONS = [
	'.3fr',
	'.ari',
	'.arw',
	'.bay',
	'.braw',
	'.crw',
	'.cr2',
	'.cr3',
	'.cap',
	'.data',
	'.dcs',
	'.dcr',
	'.dng',
	'.drf',
	'.eip',
	'.erf',
	'.fff',
	'.gpr',
	'.iiq',
	'.k25',
	'.kdc',
	'.mdc',
	'.mef',
	'.mos',
	'.mrw',
	'.nef',
	'.nrw',
	'.obm',
	'.orf',
	'.pef',
	'.ptx',
	'.pxn',
	'.r3d',
	'.raf',
	'.raw',
	'.rwl',
	'.rw2',
	'.rwz',
	'.sr2',
	'.srf',
	'.srw',
	'.tif',
	'.x3f'
];

const ALWAYS_SUPPORTED_TYPES = ['image/jpeg', 'image/png'];
const SUPPORT_PLANNED_TYPES = [...RAW_IMAGE_MEDIA_TYPES];

/* istanbul ignore next */
export function errorMessageImageTooLarge() {
	return `L'image est trop grande pour être traitée. Elle doit faire moins de ${imageLimits.maxResolutionInMP} Megapixels et ${imageLimits.maxMemoryUsageInMB} Mo`;
}

/**
 * Resize an image to fit within MAXWIDTH and MAXHEIGHT
 * @param {object} param0
 * @param {ImageBitmapSource} param0.source
 * @param {string} param0.type
 * @returns {Promise<[[number, number], ArrayBuffer]>} [[original width, original height], resized image data]
 */
export async function resizeToMaxSize({ source, type }) {
	// For some reason top-level import fails
	const { resize } = await import('pica-gpu');
	const originalImage = await createImageBitmap(source).catch((error) => {
		throw new Error(
			ALWAYS_SUPPORTED_TYPES.includes(type)
				? errorMessage(error)
				: SUPPORT_PLANNED_TYPES.includes(source.type)
					? `Les fichiers ${humanFormatName(source.type)} ne sont pas encore supportés`
					: `Le format de fichier ${humanFormatName(source.type)} n'est pas supporté`
		);
	});
	const { width, height } = originalImage;

	if (width * height > imageLimits.maxResolutionInMP * 1e6) {
		throw new Error(errorMessageImageTooLarge());
	}

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
		}, type);
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
 * @param {Array<Pick<Image, "fileId">>} images
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
				`[Error: Identifiant d'image invalide (le format correct est aaaaaaaaaaaaaaaaaaaaaaaaaa_nnnnnn) : coming in hot!!!]`
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
 * @param {import('./schemas/metadata.js').RuntimeValue<'boundingbox'>} centeredBoundingBox
 * @param {string} [padding] padding to add around the bounding box when cropping images. string of the form "npx" or "n%"
 * @returns {Promise<{ cropped: ArrayBuffer, original: ArrayBuffer }>}
 */
export async function cropImage(bytes, contentType, centeredBoundingBox, padding = '0px') {
	const bitmap = await createImageBitmap(new Blob([bytes], { type: contentType }));

	const { x, y, width, height } = parseCropPadding(padding).apply(bitmap, centeredBoundingBox);

	try {
		const croppedBitmap = await createImageBitmap(bitmap, x, y, width, height);

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
		throw new Error(
			`Couldn't crop with ${JSON.stringify({ centeredBoundingBox, padding })}: ${error}`,
			{
				cause: error
			}
		);
	} finally {
		bitmap.close();
	}
}

/**
 *
 * @param {string} padding
 * @returns {{ withUnit: string, unitless: number, unit: 'px' | '%', inPixels: (basis: number) => number, apply: (dimensions: {width: number, height: number}, cropbox: import('./BoundingBoxes.svelte.js').CenteredBoundingBox) => import('./BoundingBoxes.svelte.js').TopLeftBoundingBox}}
 */
export function parseCropPadding(padding) {
	const match = padding.match(/(\d+)(px|%)/);
	if (!match) throw new Error(`Invalid crop padding: ${padding}`);
	const [value, unit] = [Number.parseInt(match[1], 10), /** @type {'%'|'px'} */ (match[2])];
	return {
		withUnit: padding,
		unitless: value,
		unit,
		inPixels: (axis) => (unit === 'px' ? value : Math.round((axis * value) / 100)),
		apply({ width, height }, { w, h, ...xy }) {
			const { x, y } = toTopLeftCoords({ w, h, ...xy });

			return {
				x: clamp(x * width - this.inPixels(width), 0, width),
				y: clamp(y * height - this.inPixels(height), 0, height),
				width: clamp(w * width + this.inPixels(width) * 2, 1, width),
				height: clamp(h * height + this.inPixels(height) * 2, 1, height)
			};
		}
	};
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;
	describe('parseCropPadding', () => {
		test('parses pixel padding', () => {
			const padding = parseCropPadding('20px');
			expect(padding.unit).toBe('px');
			expect(padding.unitless).toBe(20);
			expect(padding.inPixels(200)).toBe(20);
		});

		test('parses percentage padding', () => {
			const padding = parseCropPadding('10%');
			expect(padding.unit).toBe('%');
			expect(padding.unitless).toBe(10);
			expect(padding.inPixels(300)).toBe(30);
		});
	});
}

/**
 *
 * @param {File} file
 */
export function isRawImage(file) {
	return (
		RAW_IMAGE_MEDIA_TYPES.includes(file.type) ||
		RAW_IMAGE_FILE_EXTENSIONS.some((ext) => file.name.toLocaleLowerCase().endsWith(ext))
	);
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe('isRawImage', () => {
		test('detects raw images by media type', () => {
			const file = new File([], 'image.cr2', { type: 'image/CR2' });
			expect(isRawImage(file)).toBe(true);
		});

		test('detects raw images by file extension', () => {
			const file = new File([], 'image.nef', { type: 'application/octet-stream' });
			expect(isRawImage(file)).toBe(true);
		});

		test('returns false on non-raw images', () => {
			const file = new File([], 'image.jpg', { type: 'image/jpeg' });
			expect(isRawImage(file)).toBe(false);
		});
	});
}

/**
 *
 * @param {ArrayBuffer} bytes
 */
export async function decodeRawPhoto(bytes) {
	const raw = new LibRaw();
	await raw.open(new Uint8Array(bytes));

	const { width, height, data: pixels } = await raw.imageData();
	const imageData = new ImageData(width, height);

	// Fill imageData. Note that pixels stores in the following order: R/G/B first -> height -> width
	for (let i = 0; i < pixels.length / 3; i++) {
		imageData.data[i * 4 + 0] = pixels[i * 3 + 0];
		imageData.data[i * 4 + 1] = pixels[i * 3 + 1];
		imageData.data[i * 4 + 2] = pixels[i * 3 + 2];
		imageData.data[i * 4 + 3] = 255;
	}

	return imageData;
}

/**
 * @param {ImageData} imageData
 * @returns {Promise<string>}
 */
export async function imageDataToBlobURL(imageData) {
	const canvas = new OffscreenCanvas(imageData.width, imageData.height);
	canvas.getContext('2d')?.putImageData(imageData, 0, 0);
	return canvas.convertToBlob().then((blob) => URL.createObjectURL(blob));
}
