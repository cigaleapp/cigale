import { error } from '@sveltejs/kit';

import type { MetadataEnumVariant } from '$lib/database.js';
import { dependencyURI, list, tables } from '$lib/idb.svelte.js';
import { metadataOptionsKeyRange } from '$lib/metadata/index.js';
import { observationMetadata } from '$lib/observations.js';
import { uiState } from '$lib/state.svelte.js';
import { compareBy } from '$lib/utils.js';

/**
 * To avoid re-fetching options of the focused metadata every time
 */
let optionsOfMetadata = {
	metadataId: undefined as string | undefined,
	options: [] as MetadataEnumVariant[]
};

export async function load({ params, depends, parent }) {
	const { currentSession, metadataDefinitions, observationsOrder } = await parent();

	const allObservations = await tables.Observation.list('sessionId', currentSession.id);
	allObservations.sort(compareBy(({ id }) => observationsOrder.get(id) ?? -1));

	const focusedMetadataId =
		currentSession?.fullscreenClassifier.focusedMetadata ?? uiState.classificationMetadataId;

	const focusedMetadata = focusedMetadataId
		? metadataDefinitions.find(({ id }) => id === focusedMetadataId)
		: undefined;

	if (
		focusedMetadata &&
		uiState.currentProtocolId &&
		optionsOfMetadata.metadataId !== focusedMetadata.id
	) {
		optionsOfMetadata = {
			metadataId: focusedMetadata.id,
			options: await list(
				'MetadataOption',
				metadataOptionsKeyRange(uiState.currentProtocolId, focusedMetadata.id)
			)
		};
	}

	const observation = await tables.Observation.get(params.observation);
	if (!observation) error(404, 'Observation introuvable');

	depends(dependencyURI('Observation', observation.id));

	const imagesOfObservation = await tables.Image.getMany(observation.images);

	// Get next observation
	const currentObsIndex = allObservations.findIndex(({ id }) => id === observation.id);

	if (currentObsIndex === -1) {
		error(500, 'Image introuvable dans la session');
	}

	const nextObsIndex = currentObsIndex + 1;
	const prevObsIndex = currentObsIndex - 1;

	const nextObs = nextObsIndex < allObservations.length ? allObservations[nextObsIndex] : null;
	const prevObs = prevObsIndex >= 0 ? allObservations[prevObsIndex] : null;

	const allImages = await tables.Image.getMany(allObservations.flatMap(({ images }) => images));
	const focusedValues = new Map(
		allObservations.map((obs) => [
			obs.id,
			observationMetadata({
				definitions: metadataDefinitions,
				observation: obs,
				images: allImages
			})[focusedMetadata?.id ?? '']
		])
	);

	// Counts
	const classifiedObservationsCount = allObservations.filter(
		({ id }) => focusedValues.get(id) !== undefined
	).length;

	const confirmedClassificationsCount = allObservations.filter(
		({ id }) => focusedValues.get(id)?.confirmed
	).length;

	const nextUnconfirmedObservation = allObservations.find(
		({ id }, index) => index > currentObsIndex && focusedValues.get(id)?.confirmed === false
	);

	return {
		observation,
		metadataDefinitions,
		images: imagesOfObservation,
		focusedMetadata,
		allOptions: optionsOfMetadata.options,
		navigation: {
			nextObservation: nextObs,
			prevObservation: prevObs,
			currentObservationIndex: currentObsIndex,
			totalObservations: allObservations.length,
			classifiedObservationsCount,
			confirmedClassificationsCount,
			nextUnconfirmedObservation
		}
	};
}
