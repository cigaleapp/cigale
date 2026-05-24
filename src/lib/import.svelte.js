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
import { newObservation } from './observations.js';
import {
	isRawImage,
	processRawMetadata,
	RAW_IMAGE_FILE_EXTENSIONS,
	RAW_IMAGE_MEDIA_TYPES,
	transcodeRawPhotoToJPEG,
} from './raw.js';
import { ACCEPTED_SIDECAR_TYPES, processSidecars } from './sidecars.js';

export const ACCEPTED_IMPORT_TYPES = [
	'image/jpeg',
	'application/zip',
	'image/png',
	'image/tiff',
	...RAW_IMAGE_MEDIA_TYPES,
	...RAW_IMAGE_FILE_EXTENSIONS,
	// Sidecar files
	...ACCEPTED_SIDECAR_TYPES,
];

/**
 * @param {object} param0
 * @param {File} param0.file
 * @param {string} param0.id
 * @param {File[]} param0.sidecars
 */
export async function processImageFile({ file, id: fileId, sidecars }) {
	if (!uiState.currentProtocol) {
		toasts.error('Aucun protocole sélectionné');
		return;
	}

	if (!uiState.currentSession) {
		toasts.error('Aucun session active');
		return;
	}

	let originalBytes = await file.arrayBuffer();

	if (originalBytes.byteLength > imageLimits.maxMemoryUsageInMB * Math.pow(2, 20)) {
		toasts.error(errorMessageImageTooLarge());
		return;
	}

	let transcoded = file;
	/** @type {import('libraw-wasm').Metadata | undefined} */
	let rawMetadata = undefined;

	if (isRawImage(file)) {
		const transcoding = await transcodeRawPhotoToJPEG(originalBytes);
		originalBytes = transcoding.bytes;
		rawMetadata = transcoding.metadata;
		transcoded = new File([originalBytes], `${file.name}.jpeg`, {
			type: 'image/jpeg',
		});
	}

	const [[width, height], resizedBytes] = await resizeToMaxSize({ source: transcoded });

	await storeImageBytes({
		id: fileId,
		resizedBytes,
		originalBytes,
		contentType: transcoded.type,
		filename: transcoded.name,
		width,
		height,
	});

	const image = await tables.Image.set({
		id: imageId(fileId, 0),
		sessionId: uiState.currentSession.id,
		filename: transcoded.name,
		addedAt: dates.formatISO(Date.now()),
		contentType: transcoded.type,
		dimensions: { width, height },
		fileId: fileId,
		metadata: {},
	});

	await tables.Observation.add(newObservation(image, uiState.currentSession));

	// We have to remove the file from the processing files list once the Image database object has been created
	uiState.processing.removeFile(fileId);

	// Process sidecars first since they can create new images!
	// If we do EXIF extraction first, images created via sidecars processing won't get their EXIF-infered metadata
	await processSidecars({
		db: databaseHandle(),
		sessionId: uiState.currentSession.id,
		cropMetadataId: uiState.cropMetadataId,
		file,
		imageFileId: fileId,
		sidecars,
	}).catch((e) => {
		console.error(e);
		toasts.error(`Erreur lors du traitement du/des fichiers annexes associés à ${file.name}`);
	});

	if (rawMetadata) {
		await processRawMetadata(uiState.currentSession.id, fileId, rawMetadata).catch((e) => {
			console.error(e);
			toasts.error(`Erreur lors de l'extraction des métadonnées du fichier RAW ${file.name}`);
		});
	}

	await processExifData(uiState.currentSession.id, fileId, originalBytes, file).catch((error) => {
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
