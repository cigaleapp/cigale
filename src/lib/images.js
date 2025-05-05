import { uiState } from '$lib/state.svelte';
import { downloadAsFile } from './download';
import * as db from './idb.svelte';
import { tables } from './idb.svelte';

/**
 * Retourne un id d'image sous la forme 000001_000001
 * @param {number|string} index
 * @param {number} subindex
 */
export function imageId(index, subindex = 0) {
	return `${Number.parseInt(index.toString(), 0).toString().padStart(6, '0')}_${subindex.toString().padStart(6, '0')}`;
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
 * @param {import('$lib/database.js').Protocol} protocol
 * @param {import('$lib/database.js').Image} image
 */
export function imageIsCropped(protocol, image) {
	return Boolean(
		image.metadata[protocol.crop?.metadata ?? 'crop'] || uiState.erroredImages.has(image.id)
	);
}

/**
 * @param {import('$lib/database.js').Image} image
 */
export function imageIsClassified(image) {
	return Boolean(
		image.metadata[uiState.classificationMetadataId] || uiState.erroredImages.has(image.id)
	);
}

/**
 * @param {import('$lib/database.js').Image} image
 */
export function imageBufferWasSaved(image) {
	return Boolean(image.bufferExists || uiState.erroredImages.has(image.id));
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
 * @param {string} id
 * @param {import('./idb.svelte').IDBTransactionWithAtLeast<["Image", "ImageFile", "ImagePreviewFile"]>} [tx]
 * @param {boolean} [notFoundOk=true]
 */
export async function deleteImage(id, tx, notFoundOk = true) {
	await db.openTransaction(['Image', 'ImageFile', 'ImagePreviewFile'], { tx }, async (tx) => {
		const image = await tx.objectStore('Image').get(id);
		if (!image) {
			if (notFoundOk) return;
			throw 'Image non trouvée';
		}

		tx.objectStore('Image').delete(id);
		tx.objectStore('ImageFile').delete(imageIdToFileId(id));
		tx.objectStore('ImagePreviewFile').delete(imageIdToFileId(id));
		uiState.erroredImages.delete(id);
		uiState.loadingImages.delete(id);
		if (uiState.imageOpenedInCropper === id) {
			uiState.imageOpenedInCropper = '';
		}

		const previewURL = uiState.previewURLs.get(imageIdToFileId(id));
		if (previewURL) {
			URL.revokeObjectURL(previewURL);
			uiState.previewURLs.delete(imageIdToFileId(id));
			uiState.croppedPreviewURLs.delete(imageIdToFileId(id));
		}
	});
}

/**
 *
 * @param {object} param0
 * @param {string} param0.id id of the image to store the bytes for
 * @param {ArrayBuffer} param0.originalBytes the image data
 * @param {ArrayBuffer} param0.resizedBytes resized image data
 * @param {string} param0.contentType MIME type of the image
 * @param {import('./idb.svelte').IDBTransactionWithAtLeast<['Image', 'ImageFile', 'ImagePreviewFile']>} [param0.tx] transaction to use
 */
export async function storeImageBytes({ id, originalBytes, resizedBytes, contentType, tx }) {
	await db.openTransaction(['Image', 'ImageFile', 'ImagePreviewFile'], { tx }, async (tx) => {
		const image = await tx.objectStore('Image').get(id);
		if (!image) throw 'Image non trouvée';
		tx.objectStore('ImageFile').put({ id: imageIdToFileId(id), bytes: originalBytes });
		tx.objectStore('ImagePreviewFile').put({ id: imageIdToFileId(id), bytes: resizedBytes });
		const preview = new Blob([resizedBytes], { type: contentType });
		uiState.setPreviewURL(image, URL.createObjectURL(preview));
		tx.objectStore('Image').put({ ...image, bufferExists: true });
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
 * @returns {Promise<ArrayBuffer>}
 */
export async function resizeToMaxSize({ source }) {
	// For some reason top-level import fails
	const { resize } = await import('pica-gpu');
	const originalImage = await createImageBitmap(source);
	const originalCanvas = document.createElement('canvas');
	originalCanvas.width = originalImage.width;
	originalCanvas.height = originalImage.height;
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
			resolve(blob.arrayBuffer());
		}, source.type);
	});
}
