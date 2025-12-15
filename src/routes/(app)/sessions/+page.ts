import { dependencyURI, listByIndex, tables } from '$lib/idb.svelte.js';
import { loadPreviewImage } from '$lib/images.js';
import { uiState } from '$lib/state.svelte.js';
import { compareBy, nonnull } from '$lib/utils';

export async function load({ depends }) {
	depends(dependencyURI('Session', ''));

	return {
		sessions: await sortedSessions()
	};
}

/**
 * @param {string} sessionId
 */
async function loadSessionThumbnails(sessionId) {
	const images = await listByIndex('Image', 'sessionId', sessionId);

	const firstUniqueFileIds = [
		...new Set(images.map((image) => image.fileId).filter(nonnull))
	].slice(0, 4);

	await Promise.all(
		firstUniqueFileIds.map(async (fileId) => {
			if (uiState.hasPreviewURL(fileId)) return;
			await loadPreviewImage(fileId, 'global');
		})
	);

	return firstUniqueFileIds.map((fileId) => uiState.getPreviewURL(fileId));
}

/**
 * @returns {Promise<Array<import('$lib/database').Session & {protocol: import('$lib/database').Protocol | null, thumbs: string[], counts: {observations: number, images: number}}>>}
 */
async function sortedSessions() {
	const sessions = await tables.Session.list();

	sessions.sort(compareBy('openedAt'));
	sessions.reverse();

	for (const session of sessions) {
		session.protocol = await tables.Protocol.get(session.protocol);
		session.thumbs = await loadSessionThumbnails(session.id);
		session.counts = {
			images: await listByIndex('Image', 'sessionId', session.id).then((imgs) => imgs.length)
		};
	}

	return sessions;
}
