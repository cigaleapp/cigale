import { error } from '@sveltejs/kit';

import { dependencyURI, listByIndex, tables } from '$lib/idb.svelte.js';
import { uiState } from '$lib/state.svelte.js';
import { compareBy } from '$lib/utils.js';

export async function load({ params, depends }) {
	if (!uiState.currentSessionId) error(400, 'Aucune session active');

	const image = await tables.Image.get(params.image);
	if (!image) error(404, 'Image introuvable');

	depends(dependencyURI('Image', image.id));

	/** Number of the image within the images that point to its ImageFile */
	const imageNo = await listByIndex('Image', 'sessionId', uiState.currentSessionId).then(
		(images) => {
			images
				.filter((i) => i.fileId === image.fileId)
				.sort(compareBy('id'))
				.findIndex((i) => i.id === image.id) + 1;
		}
	);

	return { image, imageNo };
}
