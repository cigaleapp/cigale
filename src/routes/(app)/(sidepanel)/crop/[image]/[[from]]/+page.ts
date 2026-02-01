import { galleryEffectiveSorter } from '$lib/gallery.js';
import { tables } from '$lib/idb.svelte.js';
import { imageIdToFileId } from '$lib/images';
import { uiState } from '$lib/state.svelte.js';

// Note: we make sure not to depend on the route parameters or the image data here.
// This is because the gallery's ordering might change mid-cropping
// For example:
// - the crop gallery is groupped by "Confidence in crop metadata",
// - we manually change a 20%-confidence crop, making it 100%
//
// This will change the gallery ordering, bumping the current image to the first group.
// If this function re-runs, the navigation order will change when we move to the next/previous image,
// which would be kinda confusing.
//
// If we go back to the gallery view though, we quit this route, so going back to the full screen cropper
// will sort the images again, taking the navigation order change into account once we've seen it in the gallery.

export async function load({ parent }) {
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

		console.info(`Sorted ${images.length} images for crop gallery navigation`);
	}

	return {
		sortedFileIds: images.map((image) => image.fileId ?? imageIdToFileId(image.id))
	};
}
