/**
 * @import { DimensionsInput } from '$lib/database.js';
 */
import { toRelativeCoords } from '$lib/BoundingBoxes.svelte';
import { processExifData } from '$lib/exif';
import { errorMessage } from '$lib/i18n.js';
import { tables } from '$lib/idb.svelte';
import { imageFileId, imageId, resizeToMaxSize, storeImageBytes } from '$lib/images';
import { m } from '$lib/paraglide/messages.js';
import { importResultsZip } from '$lib/results.svelte';
import { uiState } from '$lib/state.svelte.js';
import { toasts } from '$lib/toasts.svelte';
import { formatISO } from 'date-fns';

/**
 * Import new files and process  them
 * @param {import('swarpc').SwarpcClient<typeof import('../../../../web-worker-procedures.js').PROCEDURES>} swarpc
 * @param {Map<string, import("swarpc").CancelablePromise["cancel"]>} [cancellers]
 * @param {File[]} files
 */
export async function importMore(swarpc, files, cancellers) {
	uiState.processing.files = files.map(({ name }, i) => ({ name, id: `loading_${i}` }));
	uiState.processing.total = files.length;
	for (const [i, file] of files.entries()) {
		console.log(file);
		if (['application/zip', 'application/x-zip-compressed'].includes(file.type)) {
			console.log(`imorting ${file.name} as zip`);
			try {
				await importResultsZip(file, uiState.currentProtocolId);
			} catch {
				uiState.processing.files.splice(i, 1);
				uiState.erroredImages.set(file.name, 'Export invalide');
			}
		} else {
			const currentLength = tables.Image.state.length;
			const id = imageFileId(currentLength);
			try {
				uiState.loadingImages.add(id);
				await processImageFile(swarpc, file, id, `loading_${i}`, cancellers);
			} catch (error) {
				console.error(error);

				if (tables.Image.state.some((img) => img.fileId === id)) {
					// ImageFile was created (so setting erroredImages makes sense)
					uiState.erroredImages.set(id, error?.toString() ?? m.unexpected_error());
				} else {
					// no ImageFile was created (the CardObservation's id is still loading_n), so erroredImages is useless.
					// We just remove the file from the processing list, and surface the error with a toast.
					uiState.processing.files.splice(i, 1);
					toasts.error(
						m.error_importing_file({
							filename: file.name,
							error: errorMessage(error)
						})
					);
				}
			} finally {
				uiState.loadingImages.delete(id);
			}
		}
	}
}

/**
 * @param {import('swarpc').SwarpcClient<typeof import('../../../../web-worker-procedures.js').PROCEDURES>} swarpc
 * @param {File} file
 * @param {string} id
 * @param {`loading_${number}`} [temporaryId] ID of the form `loading_n`, used to identify the file in the UI while it is being processed, and set cancellers for it
 * @param {Map<string, import("swarpc").CancelablePromise["cancel"]>} [cancellers]
 */
async function processImageFile(swarpc, file, id, temporaryId, cancellers) {
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
			temporaryId,
			bytes: resizedBytes,
			filename: file.name,
			contentType: file.type,
			dimensions: { width, height }
		}).finally(() => {
			uiState.processing.files.shift();
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

	await processExifData(uiState.currentProtocol.id, id, originalBytes, file).catch((error) => {
		console.error(error);
		toasts.error(m.error_extracting_exif_metadata({ fileName: file.name }));
	});
}

/**
 * @param {import('swarpc').SwarpcClient<typeof import('../../../../web-worker-procedures.js').PROCEDURES>} swarp
 * @param {undefined | Map<string, import("swarpc").CancelablePromise["cancel"]>} cancellers
 * @param {object} file
 * @param {ArrayBuffer} file.bytes
 * @param {string} file.filename
 * @param {string} file.contentType
 * @param {string} file.id
 * @param {DimensionsInput} file.dimensions
 * @param {`loading_${number}`} [file.temporaryId] ID of the form `loading_n`, used to identify the file in the UI while it is being processed, and set cancellers for it
 * @returns {Promise<void>}
 */
export async function inferBoundingBoxes(swarp, cancellers, file) {
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

	const inference = swarp.inferBoundingBoxes.cancelable({
		fileId: file.id,
		taskSettings: $state.snapshot(uiState.currentProtocol.crop.infer[uiState.selectedCropModel])
	});

	cancellers?.set(file.id, inference.cancel);
	if (file.temporaryId) cancellers?.set(file.temporaryId, inference.cancel);

	const { boxes, scores } = await inference.request.catch((error) => {
		if (/(maxMemoryUsageInMB|maxResolutionInMP) limit exceeded/.test(error?.toString())) {
			throw new Error(m.image_too_large());
		}

		throw error;
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
					alternatives: {}
				}
			}
		});
	}
}
