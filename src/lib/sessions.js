import * as idb from '$lib/idb.svelte.js';

import { imageIdToFileId } from './images.js';
import { withQueue } from './queue.svelte.js';
import { uiState } from './state.svelte.js';
import { undo } from './undo.svelte.js';

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

			const obs = await tx.objectStore('Observation').index('sessionId').getAll(sessionId);

			for (const o of obs) {
				tx.objectStore('Observation').delete(o.id);
			}

			const imgs = await tx.objectStore('Image').index('sessionId').getAll(sessionId);

			for (const img of imgs) {
				tx.objectStore('Image').delete(img.id);
				tx.objectStore('ImageFile').delete(imageIdToFileId(img.id));
				tx.objectStore('ImagePreviewFile').delete(imageIdToFileId(img.id));
			}
		}
	);
}

/**
 * @param {string} id id of the session to switch to
 */
export async function switchSession(id) {
	uiState.setCurrentSession(id);
	uiState.clearPreviewURLs();
	undo.clear();
	withQueue((q) => q.cancelAll('La session a été fermée'));
	await idb.tables.initialize(id);
}
