/**
 * @import { DimensionsInput } from '$lib/database.js';
 */
import * as dates from 'date-fns';

import { toRelativeCoords } from '$lib/BoundingBoxes.svelte.js';
import { processExifData } from '$lib/exif.js';
import { tables } from '$lib/idb.svelte.js';
import {
	decodeRawPhoto,
	errorMessageImageTooLarge,
	imageId,
	isRawImage,
	resizeToMaxSize,
	storeImageBytes
} from '$lib/images.js';
import { uiState } from '$lib/state.svelte.js';
import { toasts } from '$lib/toasts.svelte.js';

import { imageLimits } from './inference_utils.js';
import { serializeMetadataValues } from './metadata/index.js';

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

	let originalBytes = await file.arrayBuffer();

	if (originalBytes.byteLength > imageLimits.maxMemoryUsageInMB * Math.pow(2, 20)) {
		toasts.error(errorMessageImageTooLarge());
		return;
	}

	/** @type {ArrayBuffer} */
	let resizedBytes;
	/** @type {number} */
	let width, height;
	/** @type {string} */
	let contentType;

	if (isRawImage(file)) {
		const decoded = await decodeRawPhoto(originalBytes);
		originalBytes = decoded.data.buffer;
		contentType = 'image/x-bitmap';

		[[width, height], resizedBytes] = await resizeToMaxSize({
			source: decoded,
			type: 'image/jpeg'
		});
	} else {
		contentType = file.type;
		[[width, height], resizedBytes] = await resizeToMaxSize({
			source: file,
			type: file.type
		});
	}

	await storeImageBytes({
		id,
		resizedBytes,
		originalBytes,
		contentType,
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

	if (!isRawImage(file)) {
		await processExifData(uiState.currentSession.id, id, originalBytes, file).catch(
			(error) => {
				console.error(error);
				toasts.error(`Erreur lors de l'extraction des métadonnées EXIF pour ${file.name}`);
			}
		);
	}
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
