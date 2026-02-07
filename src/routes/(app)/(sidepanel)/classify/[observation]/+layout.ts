import { error } from '@sveltejs/kit';

import { galleryEffectiveSorter } from '$lib/gallery.js';
import { listByIndex, tables } from '$lib/idb.svelte.js';
import { observationMetadata } from '$lib/observations.js';
import { uiState } from '$lib/state.svelte.js';
import { unique } from '$lib/utils.js';

// Some stuff is loaded here to prevent loading it on every navigation within the fullscreen classifier
// For instance, we wanna avoid re-sorting observations on every navigation, both for performance (it's one of the longest operations) and UX (otherwise changes in observations' metadata could re-order the observations while the user is inside the fullscreen classifier, which would be disruptive (imagine being on the 5/16 observation, correcting its species metadata, and finding yourself on the 16/16 instead of 6/16 after clicking "Next"))

export async function load({ parent }) {
	// Make sure tables are loaded, otherwise uiState.currentSession will be undefined,
	// even though uiState.currentSessionId is set.
	await parent();

	const metadataDefinitions = await tables.Metadata.list();

	if (!uiState.currentSessionId) error(400, 'Aucune session active');

	const currentSession = await tables.Session.get(uiState.currentSessionId);
	if (!currentSession) error(404, 'Session active introuvable');

	const allObservations = await listByIndex('Observation', 'sessionId', currentSession.id);

	const sortSettings = currentSession?.sort.classify ?? currentSession?.sort.global;
	const groupSettings = currentSession?.group.classify ?? currentSession?.group.global;

	if (sortSettings && groupSettings) {
		console.time('sort');
		console.time('sort: make sorter');
		const imagesSorter = await galleryEffectiveSorter({
			sortSettings,
			groupSettings
		});
		console.timeEnd('sort: make sorter');

		console.time('sort: get all images');
		const imagesOfAllObservations = await tables.Image.getMany(
			unique(allObservations.flatMap(({ images }) => images))
		);
		console.timeEnd('sort: get all images');

		const toGalleryItem = (observation: (typeof allObservations)[number]) => ({
			id: observation.id,
			name: observation.label,
			metadata: observationMetadata({
				definitions: metadataDefinitions,
				observation,
				images: imagesOfAllObservations
			})
		});

		console.time('sort: sort array');
		allObservations.sort((a, b) => imagesSorter(toGalleryItem(a), toGalleryItem(b)));
		console.timeEnd('sort: sort array');
		console.timeEnd('sort');

		console.info(
			`Sorted ${allObservations.length} observations for classification navigation`,
			allObservations.map((obs) => obs.label)
		);
	}

	return {
		currentSession,
		metadataDefinitions,
		observationsOrder: new Map(allObservations.map(({ id }, i) => [id, i]))
	};
}
