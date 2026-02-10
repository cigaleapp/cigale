import { match, type } from 'arktype';
import { RequestCancelledError } from 'swarpc';

import { databaseHandle, tables } from './idb.svelte.js';
import { defaultClassificationMetadata } from './protocols.js';
import { storeMetadataErrors } from './metadata/storage.js';
import { MetadataInferOptionsNeural } from './schemas/metadata.js';
import { uiState } from './state.svelte.js';
import { safeJSONStringify } from './utils.js';

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

	const taskSettings = classificationInferenceSettings(
		uiState.currentProtocol,
		uiState.selectedClassificationModel
	);

	const { cancel, request: done } = swarpc.classify.cancelable({
		imageId: id,
		taskSettings,
		metadataIds: {
			cropbox: uiState.cropMetadataId,
			target: uiState.classificationMetadataId
		}
	});

	cancellers?.set(id, cancel);

	try {
		await done;
	} catch (error) {
		if (error instanceof RequestCancelledError) throw error;
		if (!uiState.currentSessionId) throw error;

		await storeMetadataErrors(
			{
				db: databaseHandle(),
				subjectId: id,
				sessionId: uiState.currentSessionId,
				metadataId: uiState.classificationMetadataId
			},
			{
				kind: 'inference',
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? (error.stack ?? '') : '',
				ignored: false,
				details: {
					taskSettings,
					image: await tables.Image.get(id),
					fullError: safeJSONStringify(error)
				}
			}
		);
	}

	await tables.Image.refresh(uiState.currentSessionId);
}

/**
 *
 * @param {import('$lib/database.js').Protocol} protocol
 * @param {number} modelIndex index du modèle à utiliser dans la liste des modèles pour le protocole actuel
 */
export function classificationInferenceSettings(protocol, modelIndex) {
	const inference = defaultClassificationMetadata(protocol, tables.Metadata.state)?.infer;

	if (!inference)
		throw new Error(`Current protocol ${protocol.id} has no metadata with inference settings`);
	if (!('neural' in inference))
		throw new Error(
			`Current protocol ${protocol.id} has no metadata with neural inference settings`
		);

	return inference.neural[modelIndex];
}
