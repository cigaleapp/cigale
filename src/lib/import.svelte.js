/**
 * @import { DimensionsInput } from '$lib/database.js';
 */
import * as dates from 'date-fns';

import { toRelativeCoords } from '$lib/BoundingBoxes.svelte.js';
import { processExifData } from '$lib/exif.js';
import { databaseHandle, tables } from '$lib/idb.svelte.js';
import {
	errorMessageImageTooLarge,
	imageId,
	resizeToMaxSize,
	storeImageBytes,
} from '$lib/images.js';
import { uiState } from '$lib/state.svelte.js';
import { toasts } from '$lib/toasts.svelte.js';

import { imageLimits } from './inference_utils.js';
import { serializeMetadataValues } from './metadata/index.js';
import { ACCEPTED_SIDECAR_TYPES, processSidecars } from './sidecars.js';

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
	'.cr3',
	// Sidecar files
	...ACCEPTED_SIDECAR_TYPES,
];

/**
 * @param {object} param0
 * @param {File} param0.file
 * @param {string} param0.id
 * @param {File[]} param0.sidecars
 */
export async function processImageFile({ file, id, sidecars }) {
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
		height,
	});

	await tables.Image.set({
		id: imageId(id, 0),
		sessionId: uiState.currentSessionId,
		filename: file.name,
		addedAt: dates.formatISO(Date.now()),
		contentType: file.type,
		dimensions: { width, height },
		fileId: id,
		metadata: {},
	});

	// We have to remove the file from the processing files list once the Image database object has been created
	uiState.processing.removeFile(id);

	if (!uiState.currentSessionId) {
		toasts.error('Aucun session active');
		return;
	}

	// Process sidecars first since they can create new images!
	// If we do EXIF extraction first, images created via sidecars processing won't get their EXIF-infered metadata
	await processSidecars({
		db: databaseHandle(),
		sessionId: uiState.currentSessionId,
		cropMetadataId: uiState.cropMetadataId,
		file,
		imageFileId: id,
		sidecars,
	}).catch((e) => {
		console.error(e);
		toasts.error(`Erreur lors du traitement du/des fichiers annexes associés à ${file.name}`);
	});

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

	const inferenceSettings = $state.snapshot(uiState.cropModels.at(uiState.selectedCropModel));

	if (!inferenceSettings) {
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
		taskSettings: inferenceSettings,
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
	const toCropBox = ([x, y, w, h]) => toRelativeCoords(inferenceSettings.input)({ x, y, w, h });

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
					manuallyModified: false,
				},
			},
		});
	}
}
