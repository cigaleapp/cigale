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

/**
 * Retourne l'id d'un objet ImageFile associé à l'objet Image
 * @template {string|undefined} T
 * @param {T} id
 * @returns {T}
 */
export function imageIdToFileId(id) {
	// @ts-expect-error
	return id?.replace(/(_\d+)+$/, '');
}

/**
 * @param {import('$lib/database.js').Image} image
 */
export function imageIsCropped(image) {
	return Boolean(image.metadata.crop || uiState.erroredImages.has(image.id));
}

/**
 * @param {import('$lib/database.js').Image} image
 */
export function imageIsCLassified(image) {
	return Boolean(image.metadata.species || uiState.erroredImages.has(image.id));
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
