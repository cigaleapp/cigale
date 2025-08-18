/**
 * @import { DimensionsInput } from '$lib/database.js';
 */
import { toRelativeCoords } from '$lib/BoundingBoxes.svelte';
import { processExifData } from '$lib/exif';
import { tables } from '$lib/idb.svelte';
import { imageId, resizeToMaxSize, storeImageBytes } from '$lib/images';
import { m } from '$lib/paraglide/messages.js';
import { uiState } from '$lib/state.svelte.js';
import { toasts } from '$lib/toasts.svelte';
import { formatISO } from 'date-fns';

/**
 * @param {import('swarpc').SwarpcClient<typeof import('$lib/../web-worker-procedures.js').PROCEDURES>} swarpc
 * @param {File} file
 * @param {string} id
 * @param {Map<string, import("swarpc").CancelablePromise["cancel"]>} [cancellers]
 */
export async function processImageFile(swarpc, file, id, cancellers) {
	if (!uiState.currentProtocol) {
		toasts.error(m.no_protocol_selected());
		return;
	}

	const originalBytes = await file.arrayBuffer();
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

	if (uiState.cropInferenceAvailable) {
		await inferBoundingBoxes(swarpc, cancellers, {
			id,
			bytes: resizedBytes,
			filename: file.name,
			contentType: file.type,
			dimensions: { width, height }
		});
	} else {
		await tables.Image.set({
			id: imageId(id, 0),
			filename: file.name,
			addedAt: formatISO(Date.now()),
			contentType: file.type,
			dimensions: { width, height },
			fileId: id,
			metadata: {}
		});
	}

	// We have to remove the file from the processing files list once the Image database object has been created, which happens inside inferBoundingBoxes() (inference available) or directly here (inference unavailable).
	uiState.processing.removeFile(id);

	await processExifData(uiState.currentProtocol.id, id, originalBytes, file).catch((error) => {
		console.error(error);
		toasts.error(m.error_extracting_exif_metadata({ fileName: file.name }));
	});
}

/**
 * @param {import('swarpc').SwarpcClient<typeof import('$lib/../web-worker-procedures.js').PROCEDURES>} swarpc
 * @param {undefined | Map<string, import("swarpc").CancelablePromise["cancel"]>} cancellers
 * @param {object} file
 * @param {ArrayBuffer} file.bytes
 * @param {string} file.filename
 * @param {string} file.contentType
 * @param {string} file.id
 * @param {DimensionsInput} file.dimensions
 * @returns {Promise<void>}
 */
async function inferBoundingBoxes(swarpc, cancellers, file) {
	if (!uiState.currentProtocol) {
		toasts.error(m.no_protocol_selected());
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

	console.log('Inferring bounding boxes for', file.filename);

	const inference = swarpc.inferBoundingBoxes.cancelable({
		fileId: file.id,
		taskSettings: $state.snapshot(uiState.currentProtocol.crop.infer[uiState.selectedCropModel])
	});

	cancellers?.set(file.id, inference.cancel);

	const { boxes, scores } = await inference.request.catch((error) => {
		console.log('handling remote error', error);
		if (/(maxMemoryUsageInMB|maxResolutionInMP) limit exceeded/.test(error?.toString())) {
			return Promise.reject(new Error(m.image_too_large()));
		}

		return Promise.reject(error);
	});

	console.log('Bounding boxes:', boxes);

	let [firstBoundingBox] = boxes;
	let [firstScore] = scores;

	if (!firstBoundingBox || !firstScore) {
		await tables.Image.set({
			id: imageId(file.id, 0),
			filename: file.filename,
			addedAt: formatISO(Date.now()),
			contentType: file.contentType,
			dimensions: file.dimensions,
			fileId: file.id,
			metadata: {}
		});
		return;
	}

	/**
	 * @param {[number, number, number, number]} param0
	 */
	const toCropBox = ([x, y, w, h]) => toRelativeCoords(uiState.currentProtocol)({ x, y, w, h });

	for (let i = 0; i < boxes.length; i++) {
		await tables.Image.set({
			id: imageId(file.id, i),
			filename: file.filename,
			addedAt: formatISO(Date.now()),
			contentType: file.contentType,
			dimensions: file.dimensions,
			fileId: file.id,
			metadata: {
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
