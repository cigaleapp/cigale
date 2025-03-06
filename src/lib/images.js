import { uiState } from '../routes/inference/state.svelte';

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
	return image.metadata.crop || uiState.erroredImages.has(image.id);
}

/**
 * @param {import('$lib/database.js').Image} image
 */
export function imageBufferWasSaved(image) {
	return image.bufferExists || uiState.erroredImages.has(image.id);
}
