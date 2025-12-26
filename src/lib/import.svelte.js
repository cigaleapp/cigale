/**
 * @import { DimensionsInput } from '$lib/database.js';
 */
import * as dates from 'date-fns';

import { toRelativeCoords } from '$lib/BoundingBoxes.svelte.js';
import { processExifData } from '$lib/exif.js';
import { tables } from '$lib/idb.svelte.js';
import { errorMessageImageTooLarge, imageId, resizeToMaxSize, storeImageBytes } from '$lib/images.js';
import { uiState } from '$lib/state.svelte.js';
import { toasts } from '$lib/toasts.svelte.js';

import { imageLimits } from './inference_utils.js';
import { serializeMetadataValues } from './metadata.js';

export const ACCEPTED_IMPORT_TYPES = [
	'image/jpeg',
	'application/zip',
	'image/png',
	'image/tiff',
	'.cr2',
	'.rw2',
	'.dng',
	'.crw',
	'.raw',
	'.cr3'
];

/**
 * @param {File} file
 * @param {string} id
 */
export async function processImageFile(file, id) {
	if (!uiState.currentProtocol) {
		toasts.error('Aucun protocole sélectionné');
		return;
	}

	const originalBytes = await file.arrayBuffer();

	if (originalBytes.byteLength > imageLimits.maxMemoryUsageInMB * Math.pow(2, 20)) {
		toasts.error(errorMessageImageTooLarge());
		return;
	}

	const [[width, height], resizedBytes] = await resizeToMaxSize({ source: file });

	await storeImageBytes({
		id,
		resizedBytes,
		originalBytes,
		contentType: file.type,
		filename: file.name,
		width,
		height
	});

	await tables.Image.set({
		id: imageId(id, 0),
		sessionId: uiState.currentSessionId,
		filename: file.name,
		addedAt: dates.formatISO(Date.now()),
		contentType: file.type,
		dimensions: { width, height },
		fileId: id,
		metadata: {}
	});

	// We have to remove the file from the processing files list once the Image database object has been created
	uiState.processing.removeFile(id);

	await processExifData(uiState.currentSessionId, id, originalBytes, file).catch((error) => {
		console.error(error);
		toasts.error(`Erreur lors de l'extraction des métadonnées EXIF pour ${file.name}`);
	});
}

/**
 * @param {import('swarpc').SwarpcClient<typeof import('$worker/procedures.js').PROCEDURES>} swarpc
 * @param {undefined | Map<string, import("swarpc").CancelablePromise["cancel"]>} cancellers
 * @param {string} fileId
 * @returns {Promise<void>}
 */
export async function inferBoundingBoxes(swarpc, cancellers, fileId) {
	if (!uiState.currentProtocol) {
		toasts.error('Aucun protocole sélectionné');
		return;
	}

	if (!uiState.currentProtocol.crop.infer) {
		console.warn(
			'No crop inference defined, not analyzing image. Configure crop inference in the protocol (crop.infer) if this was not intentional.'
		);
		return;
	}

	if (!uiState.cropInferenceAvailable) {
		return;
	}

	const image = await tables.Image.get(imageId(fileId, 0));
	if (!image) {
		throw new Error(`Image ${fileId} not found in database`);
	}
	if (!image.fileId) {
		throw new Error(`Image ${fileId} has no associated ImageFile in database`);
	}

	const inference = swarpc.inferBoundingBoxes.cancelable({
		fileId: image.fileId,
		taskSettings: $state.snapshot(uiState.currentProtocol.crop.infer[uiState.selectedCropModel])
	});

	cancellers?.set(image.fileId, inference.cancel);

	const { boxes, scores } = await inference.request.catch((error) => {
		if (/(maxMemoryUsageInMB|maxResolutionInMP) limit exceeded/.test(error?.toString())) {
			return Promise.reject(new Error(errorMessageImageTooLarge()));
		}

		return Promise.reject(error);
	});

	let [firstBoundingBox] = boxes;
	let [firstScore] = scores;

	if (!firstBoundingBox || !firstScore) {
		await tables.Image.update(image.id, 'boundingBoxesAnalyzed', true);
		return;
	}

	/**
	 * @param {[number, number, number, number]} param0
	 */
	const toCropBox = ([x, y, w, h]) => toRelativeCoords(uiState.currentProtocol)({ x, y, w, h });

	for (let i = 0; i < boxes.length; i++) {
		await tables.Image.set({
			...image,
			id: imageId(image.fileId, i),
			addedAt: dates.formatISO(i === 0 ? image.addedAt : Date.now()),
			boundingBoxesAnalyzed: true,
			metadata: {
				...serializeMetadataValues(image.metadata),
				[uiState.cropMetadataId]: {
					value: JSON.stringify(toCropBox(boxes[i])),
					confidence: scores[i],
					alternatives: {},
					manuallyModified: false
				}
			}
		});
	}
}
