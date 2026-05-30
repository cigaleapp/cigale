import { RequestCancelledError } from 'swarpc';

import { databaseHandle, tables } from './idb.svelte.js';
import { inferenceModelId } from './inference.js';
import { storeMetadataErrors } from './metadata/storage.js';
import { uiState } from './state.svelte.js';
import { safeJSONStringify } from './utils.js';

/**
 * Classifies an image using the current protocol with all configured classification models.
 * @param {import('swarpc').SwarpcClient<typeof import('$worker/procedures.js').PROCEDURES>} swarpc
 * @param {string} id
 * @param {Map<string, import("swarpc").CancelablePromise["cancel"]>} [cancellers]
 */
export async function classifyImage(swarpc, id, cancellers) {
	if (!uiState.currentProtocol) {
		throw new Error('Aucun protocole sélectionné');
	}

	// Get all classification metadata for the current protocol
	const allClassificationMetadata = uiState.enabledClassificationMetadata;
	if (allClassificationMetadata.length === 0) {
		console.warn(
			'No metadata with neural inference defined, not analyzing image. Configure neural inference on enum metadata (set metadata.<your metadata id>.infer.neural) if this was not intentional.'
		);
		return;
	}

	// Classify with all metadata
	const promises = allClassificationMetadata.map(async (metadata) => {
		const modelIndex = uiState.selectedClassificationModels[metadata.id] ?? 0;
		const allModels = uiState.allClassificationModels[metadata.id];

		if (!allModels || !allModels[modelIndex]) {
			console.warn(
				`No model found for metadata ${metadata.id} at index ${modelIndex}, skipping`
			);
			return;
		}

		const settings = allModels[modelIndex];
		const taskSettings = $state.snapshot(settings);

		// Generate the inference session ID based on the protocol and model
		const inferenceSessionId = inferenceModelId(
			uiState.currentProtocol.id,
			settings.model
		);

		const { cancel, request: done } = swarpc.classify.cancelable({
			imageId: id,
			taskSettings,
			inferenceSessionId,
			metadataIds: {
				cropbox: uiState.cropMetadataId,
				target: metadata.id,
			},
		});

		cancellers?.set(`${id}:${metadata.id}`, cancel);

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
					metadataId: metadata.id,
				},
				{
					kind: 'inference',
					message: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? (error.stack ?? '') : '',
					ignored: false,
					details: {
						taskSettings,
						image: await tables.Image.get(id),
						fullError: safeJSONStringify(error),
					},
				}
			);
		}
	});

	await Promise.all(promises);
	await tables.Image.refresh(uiState.currentSessionId);
}
