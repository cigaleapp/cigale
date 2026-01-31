import { galleryEffectiveSorter } from '$lib/gallery.js';
import { tables } from '$lib/idb.svelte.js';
import { imageIdToFileId } from '$lib/images';
import { uiState } from '$lib/state.svelte.js';

export async function load({ params, parent }) {
	// Make sure tables are loaded, otherwise uiState.currentSession will be undefined,
	// even though uiState.currentSessionId is set.
	await parent();

	if (!uiState.currentSessionId) throw new Error('Aucune session active');

	const groupSettings =
		uiState.currentSession?.group.crop ?? uiState.currentSession?.group.global;
	const sortSettings = uiState.currentSession?.sort.crop ?? uiState.currentSession?.sort.global;

	const images = await tables.Image.list('sessionId', uiState.currentSessionId);

	if (sortSettings && groupSettings) {
		const imagesSorter = await galleryEffectiveSorter({
			sortSettings,
			groupSettings
		});

		const toGalleryItem = ({ id, filename, metadata }: (typeof images)[number]) => ({
			id,
			metadata,
			name: filename
		});

		images.sort((a, b) => imagesSorter(toGalleryItem(a), toGalleryItem(b)));
	}

	return {
		sortedFileIds: images.map((image) => image.fileId ?? imageIdToFileId(image.id))
	};
}
