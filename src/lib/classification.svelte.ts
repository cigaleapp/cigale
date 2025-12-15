import { match, type } from 'arktype';

import { tables } from './idb.svelte.js';
import { MetadataInferOptionsNeural } from './schemas/metadata.js';
import { uiState } from './state.svelte.js';

/**
 * Classifies an image using the current protocol and selected model.
 * @param {import('swarpc').SwarpcClient<typeof import('$worker/procedures.js').PROCEDURES>} swarpc
 * @param {string} id
 * @param {Map<string, import("swarpc").CancelablePromise["cancel"]>} [cancellers]
 */
export async function classifyImage(swarpc, id, cancellers) {
	if (!uiState.currentProtocol) {
		throw new Error('Aucun protocole sélectionné');
	}

	if (!uiState.classificationMetadataId) {
		console.warn(
			'No metadata with neural inference defined, not analyzing image. Configure neural inference on a enum metadata (set metadata.<your metadata id>.infer.neural) if this was not intentional.'
		);
		return;
	}

	const { cancel, request: done } = swarpc.classify.cancelable({
		imageId: id,
		metadataIds: {
			cropbox: uiState.cropMetadataId,
			target: uiState.classificationMetadataId
		},
		taskSettings: classificationInferenceSettings(
			uiState.currentProtocol,
			uiState.selectedClassificationModel
		)
	});

	cancellers?.set(id, cancel);

	await done;

	await tables.Image.refresh(uiState.currentSessionId);
}

/**
 *
 * @param {import('$lib/database.js').Protocol} protocol
 * @param {number} modelIndex index du modèle à utiliser dans la liste des modèles pour le protocole actuel
 */
export function classificationInferenceSettings(protocol, modelIndex) {
	const matcher = match
		.case(
			{
				id: type.string.narrow((id) => protocol.metadata.includes(id)),
				type: '"enum"',
				infer: MetadataInferOptionsNeural
			},
			(m) => m.infer.neural[modelIndex]
		)
		.default(() => undefined);

	return tables.Metadata.state
		.map((m) => matcher(m))
		.filter(Boolean)
		.at(0);
}
