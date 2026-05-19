import type { MetadataEnumVariant } from '$lib/database.js';

import { error } from '@sveltejs/kit';

import { databaseHandle, dependencyURI, tables } from '$lib/idb.svelte.js';
import { metadataOptionsOf } from '$lib/metadata/index.js';
import { uiState } from '$lib/state.svelte.js';

/**
 * To avoid re-fetching options of the focused metadata every time
 */
let optionsOfMetadata = {
	metadataId: undefined as string | undefined,
	options: [] as MetadataEnumVariant[],
};

export async function load({ params, depends, parent }) {
	const { currentSession, metadataDefinitions } = await parent();

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
			options: await metadataOptionsOf(
				databaseHandle(),
				uiState.currentProtocolId,
				focusedMetadata.id
			),
		};
	}

	const observation = await tables.Observation.get(params.observation);
	if (!observation) error(404, 'Observation introuvable');

	depends(dependencyURI('Observation', observation.id));

	const imagesOfObservation = await tables.Image.getMany(observation.images);

	return {
		observation,
		metadataDefinitions,
		images: imagesOfObservation,
		focusedMetadata,
		allOptions: optionsOfMetadata.options,
	};
}
