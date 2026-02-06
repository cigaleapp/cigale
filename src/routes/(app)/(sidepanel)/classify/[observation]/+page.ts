import { error } from '@sveltejs/kit';

import type { MetadataEnumVariant } from '$lib/database.js';
import { galleryEffectiveSorter } from '$lib/gallery.js';
import { dependencyURI, list, listByIndex, tables } from '$lib/idb.svelte.js';
import { metadataOptionsKeyRange } from '$lib/metadata/index.js';
import { uiState } from '$lib/state.svelte.js';

let allOptions: [string | undefined, MetadataEnumVariant[]] = [undefined, []];

export async function load({ params, depends, parent }) {
	// Make sure tables are loaded, otherwise uiState.currentSession will be undefined,
	// even though uiState.currentSessionId is set.
	await parent();

	if (!uiState.currentSessionId) error(400, 'Aucune session active');

	const currentSession = await tables.Session.get(uiState.currentSessionId);
	if (!currentSession) error(404, 'Session active introuvable');

	const focusedMetadataId =
		currentSession?.fullscreenClassifier.focusedMetadata ?? uiState.classificationMetadataId;

	const focusedMetadata = focusedMetadataId
		? await tables.Metadata.get(focusedMetadataId)
		: undefined;

	if (focusedMetadata && uiState.currentProtocolId && allOptions[0] !== focusedMetadata.id) {
		allOptions = [
			focusedMetadata.id,
			await list(
				'MetadataOption',
				metadataOptionsKeyRange(uiState.currentProtocolId, focusedMetadata.id)
			)
		];
	}

	const image = await tables.Image.get(params.observation);
	if (!image) error(404, 'Image introuvable');

	depends(dependencyURI('Image', image.id));

	const images = await listByIndex('Image', 'sessionId', currentSession.id);

	const sortSettings = currentSession?.sort.classify ?? currentSession?.sort.global;
	const groupSettings = currentSession?.group.classify ?? currentSession?.group.global;

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

		console.info(`Sorted ${images.length} images for classification navigation`, images);
	}

	/** Number of the image within the images that point to its ImageFile */
	const imageNo =
		images.filter((i) => i.fileId === image.fileId).findIndex((i) => i.id === image.id) + 1;

	// Get next image
	const currentImageIndex = images.findIndex((i) => i.id === image.id);

	if (currentImageIndex === -1) {
		error(500, 'Image introuvable dans la session');
	}

	const nextImageIndex = currentImageIndex + 1;
	const prevImageIndex = currentImageIndex - 1;

	const nextImage = nextImageIndex < images.length ? images[nextImageIndex] : null;
	const prevImage = prevImageIndex >= 0 ? images[prevImageIndex] : null;

	// Counts
	const classifiedImagesCount = focusedMetadata
		? images.filter((img) => img.metadata[focusedMetadata.id]).length
		: 0;

	const confirmedClassificationsCount = focusedMetadata
		? images.filter((img) => img.metadata[focusedMetadata.id]?.confirmed).length
		: 0;

	const nextUnconfirmedImage = focusedMetadata
		? images.find(
				(img, index) =>
					index > currentImageIndex &&
					img.metadata[focusedMetadata.id] &&
					!img.metadata[focusedMetadata.id]?.confirmed
			)
		: null;

	return {
		image,
		imageNo,
		focusedMetadata,
		allOptions: allOptions[1],
		navigation: {
			nextImage,
			prevImage,
			currentImageIndex,
			totalImages: images.length,
			classifiedImagesCount,
			confirmedClassificationsCount,
			nextUnconfirmedImage
		}
	};
}
