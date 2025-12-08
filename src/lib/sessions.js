import * as idb from '$lib/idb.svelte.js';

import { imageIdToFileId } from './images';

/**
 * @param {string} sessionId
 */
export async function observationsOfSession(sessionId) {
	return idb.listByIndex('Observation', 'sessionId', sessionId);
}

/**
 * @param {string} sessionId
 */
export async function imagesOfSession(sessionId) {
	return idb.listByIndex('Image', 'sessionId', sessionId);
}

/**
 *
 * @param {string} sessionId
 */
export async function deleteSession(sessionId) {
	await idb.openTransaction(
		['Session', 'Observation', 'Image', 'ImageFile', 'ImagePreviewFile'],
		{ mode: 'readwrite' },
		async (tx) => {
			tx.objectStore('Session').delete(sessionId);

			const obs = await tx
				.objectStore('Observation')
				.index('sessionId')
				.openKeyCursor(sessionId);
			while (obs?.advance(1)) {
				obs.delete();
			}

			const imgs = await tx.objectStore('Image').index('sessionId').openKeyCursor(sessionId);

			while (imgs?.advance(1)) {
				const imgId = imgs.key;
				imgs.delete();
				tx.objectStore('ImageFile').delete(imageIdToFileId(imgId));
				tx.objectStore('ImagePreviewFile').delete(imageIdToFileId(imgId));
			}
		}
	);
}
