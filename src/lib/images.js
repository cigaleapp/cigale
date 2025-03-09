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
 * @param {string} id
 */
export function imageIdToFileId(id) {
	return id.replace(/(_\d+)+$/, '');
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
