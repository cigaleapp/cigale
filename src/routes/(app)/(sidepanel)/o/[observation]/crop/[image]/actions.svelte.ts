import type { SelectedBox } from './+page.svelte';
import type { Rect } from '$lib/BoundingBoxes.svelte.js';
import type * as DB from '$lib/database.js';
import type { TypedMetadataValue } from '$lib/metadata/types.js';
import type { RuntimeValue } from '$lib/schemas/metadata.js';

import * as dates from 'date-fns';

import { page } from '$app/state';
import {
	boundingBoxIsNonZero,
	coordsAreEqual,
	FULL_IMAGE_CROPBOX,
	toCenteredCoords,
	toTopLeftCoords,
} from '$lib/BoundingBoxes.svelte.js';
import * as idb from '$lib/idb.svelte.js';
import {
	deleteImageFile,
	imageIdToFileId,
	imageId as makeImageId,
	parseImageId,
} from '$lib/images.js';
import { deleteMetadataValue, storeMetadataValue } from '$lib/metadata/storage.js';
import { hasRuntimeType } from '$lib/metadata/types.js';
import { ensureNoEmptyObservations } from '$lib/observations.js';
import { goto } from '$lib/paths.js';
import { getSettings } from '$lib/settings.svelte.js';
import { uiState } from '$lib/state.svelte.js';
import { toasts } from '$lib/toasts.svelte.js';
import { undo } from '$lib/undo.svelte.js';
import { nonnull } from '$lib/utils.js';

import {
	adjacentFileIds,
	currentImages,
	boundingBoxes as getBoundingBoxes,
	goToFile,
	goToNextUnconfirmedFile,
	hasCrop,
	imageHasConfirmedCrop,
} from './+page.svelte';
import { setBoxesListHintShown } from './Boxes.svelte';
import { activeTool } from './Toolbar.svelte';

const boundingBoxes = $derived(getBoundingBoxes());
const firstImage = $derived(currentImages().at(0));

const fileId = $derived(page.params.image);

export function getInitialCrops() {
	return Object.fromEntries(
		currentImages().map((image) => {
			if (!image.metadata[uiState.cropMetadataId]) {
				return [image.id, undefined];
			}

			const { confidences, alternatives, value, confidence, manuallyModified } = image
				.metadata[uiState.cropMetadataId] as TypedMetadataValue<'boundingbox'>;

			const neuralConfidence = confidences[JSON.stringify(alternatives.at(0))];

			// On subsequent crops, the user's crop will be the main value and the neural network's crop will be in the alternatives.
			if (neuralConfidence) {
				return [
					image.id,
					{
						value: alternatives[0] as RuntimeValue<'boundingbox'>,
						confidence: neuralConfidence,
					},
				];
			}

			// If the main value is manuallyModified, and we have no alternatives,
			// it means that the box never had a neural network-inferred value (or it was lost somehow)
			if (manuallyModified) {
				return [image.id, undefined];
			}

			// If this is the first time the user is re-cropping the box, this value will be the main values.
			return [image.id, { value, confidence }];
		})
	);
}

const initialCrops = $derived(getInitialCrops());

/**
 * @param  imageId ID of the image we're confirming a new crop for. Null if we're creating a new cropbox.
 * @param  newBoundingBox
 * @param  flashConfirmedOverlay flash the confirmed overlay when appropriate
 * @param  pushToUndoStack whether to push this change to the undo stack
 * @returns  the ID of the image we just modified/created
 */
export async function onCropChange({
	imageId,
	newBoundingBox,
	selectedBox,
	showConfirmedOverlay,
	flashConfirmedOverlay = true,
	pushToUndoStack = true,
}: {
	imageId: string | null;
	newBoundingBox: Rect | undefined;
	showConfirmedOverlay: () => Promise<void>;
	selectedBox: SelectedBox;
	flashConfirmedOverlay?: boolean;
	pushToUndoStack?: boolean;
}): Promise<string | null> {
	if (!uiState.currentSessionId) return null;
	if (!fileId) return null;

	const image = imageId ? currentImages().find((img) => img.id === imageId) : undefined;
	if (imageId && !image) {
		toasts.error(`Impossible de trouver l'image ${imageId} pour la confirmer`);
		return null;
	}

	if (!newBoundingBox) {
		// No bounding box, just mark the image as confirmed and move on
		if (image) {
			await changeCropConfirmedStatus(image, true);
		}

		return imageId;
	}

	// Flash if
	const willFlashConfirmedOverlay =
		// the caller asked for it,
		flashConfirmedOverlay &&
		// and this is the last image before the file is considered confirmed
		currentImages().filter(imageHasConfirmedCrop).length === currentImages().length - 1;

	const willAutoskip =
		// The user has auto-skip enabled
		getSettings().cropAutoNext &&
		// We aren't deleting the bounding box
		boundingBoxIsNonZero(newBoundingBox) &&
		// in click-and-drag creation mode, auto-skip occurs only when the bounding box did not exist before (since the first creation of the box is much less likely to be the final one)
		(activeTool().createMode !== 'clickanddrag' || !hasCrop(fileId));

	if (uiState.classificationMetadataId) {
		const species = image?.metadata[uiState.classificationMetadataId];
		if (species && !species.manuallyModified) {
			// Species confidence was inferred, we need to remove it so we can infer it again, since it's inferred on the _cropped_ image
			await deleteMetadataValue({
				db: idb.databaseHandle(),
				sessionId: uiState.currentSessionId,
				metadataId: uiState.classificationMetadataId,
				subjectId: image.id,
			});
		}
	}

	let newImageId = '';

	if (imageId) {
		if (pushToUndoStack) {
			undo.push('crop/box/edit', {
				imageId,
				before: boundingBoxes[imageId],
				after: toCenteredCoords(newBoundingBox),
			});
		}

		// We're modifying an existing cropbox
		await storeMetadataValue({
			db: idb.databaseHandle(),
			sessionId: uiState.currentSessionId,
			metadataId: uiState.cropMetadataId,
			subjectId: imageId,
			type: 'boundingbox',
			value: toCenteredCoords(newBoundingBox),
			confidence: 1,
			// Put the neural-network-inferred (initial) value in the alternatives as a backup
			confidences: initialCrops[imageId] ? [initialCrops[imageId]] : [],
			manuallyModified: true,
		});
	} else if (
		currentImages().length === 1 &&
		firstImage &&
		!firstImage.metadata[uiState.cropMetadataId]
	) {
		// We're creating a new cropbox, but it is the first one (and we already have an image, it just doesn't have a cropbox)
		newImageId = firstImage.id;

		if (pushToUndoStack) {
			undo.push('crop/box/create', {
				imageId: newImageId,
				box: toCenteredCoords(newBoundingBox),
			});
		}

		await storeMetadataValue({
			db: idb.databaseHandle(),
			sessionId: uiState.currentSessionId,
			metadataId: uiState.cropMetadataId,
			subjectId: newImageId,
			type: 'boundingbox',
			value: toCenteredCoords(newBoundingBox),
			confidence: 1,
			manuallyModified: true,
			confidences: [],
		});
	} else {
		// We're creating a >1st cropbox
		newImageId = makeImageId(
			fileId,
			Math.max(
				...currentImages()
					.map(({ id }) => parseImageId(id).subindex)
					.filter(nonnull)
			) + 1
		);

		if (pushToUndoStack) {
			undo.push('crop/box/create', {
				imageId: newImageId,
				box: toCenteredCoords(newBoundingBox),
			});
		}

		await idb.tables.Image.set({
			id: newImageId,
			sessionId: uiState.currentSessionId,
			filename: firstImage?.filename ?? '',
			addedAt: dates.formatISO(firstImage?.addedAt ?? new Date()),
			contentType: firstImage?.contentType ?? '',
			dimensions: $state.snapshot(firstImage?.dimensions) ?? { width: 0, height: 0 },
			fileId,
			metadata: {
				[uiState.cropMetadataId]: {
					value: JSON.stringify(toCenteredCoords(newBoundingBox)),
					confidence: 1,
					manuallyModified: true,
					confirmed: true,
					alternatives: [],
					confidences: {},
				},
			},
		});
	}

	setBoxesListHintShown(false);
	await changeAllConfirmedStatuses(true);

	// Select cropbox
	if (!selectedBox.manual) {
		selectedBox.imageId = newImageId || imageId;
	}

	if (willFlashConfirmedOverlay) {
		await showConfirmedOverlay();
	}

	if (willAutoskip) {
		(await goToNextUnconfirmedFile()) || (await goto('/(app)/(sidepanel)/classify'));
	}

	return newImageId;
}

export async function deleteImageFileAndGotoNext() {
	if (!fileId) return;

	const nextFileIdBeforeDelete = $state.snapshot(adjacentFileIds().nextFileId);
	await deleteImageFile(fileId);

	if (nextFileIdBeforeDelete) {
		await goToFile(nextFileIdBeforeDelete);
	} else {
		// If nextFileId (and not nextFileIdBeforeDelete) is undefined,
		// it means we just deleted the last image; so we go back to the import tab
		await goto('/(app)/(sidepanel)/import');
	}
}

/**
 * @param options
 * @param options.skipUndo whether to skip pushing this operation to the undo stack
 */
export async function deleteBoundingBox(
	imageId: string,
	{ skipUndo = false }: { skipUndo?: boolean } = {}
) {
	if (!skipUndo) {
		undo.push('crop/box/delete', {
			imageId,
			box: boundingBoxes[imageId],
		});
	}

	if (currentImages().length === 1) {
		await deleteMetadataValue({
			db: idb.databaseHandle(),
			sessionId: uiState.currentSession?.id,
			metadataId: uiState.cropMetadataId,
			subjectId: imageId,
		});
	} else {
		await idb.tables.Image.remove(imageId);
	}

	await ensureNoEmptyObservations();
}

export function setupUndoActions(cropChangeDeps: {
	showConfirmedOverlay: () => Promise<void>;
	selectedBox: SelectedBox;
}) {
	undo.on('crop/box/create', async ({ imageId }) => {
		if (imageIdToFileId(imageId) !== fileId) return;
		await deleteBoundingBox(imageId, { skipUndo: true });
	});

	undo.on('crop/box/edit', async ({ imageId, before }) => {
		if (imageIdToFileId(imageId) !== fileId) return;
		await onCropChange({
			...cropChangeDeps,
			imageId: imageId,
			newBoundingBox: toTopLeftCoords(before),
			flashConfirmedOverlay: false,
			pushToUndoStack: false,
		});
	});

	undo.on('crop/box/delete', async ({ imageId, box }) => {
		if (imageIdToFileId(imageId) !== fileId) return;
		await onCropChange({
			...cropChangeDeps,
			imageId: null,
			newBoundingBox: toTopLeftCoords(box),
			flashConfirmedOverlay: false,
			pushToUndoStack: false,
		});
	});
}

async function changeCropConfirmedStatus(image: DB.Image, confirmed: boolean) {
	if (!uiState.currentSessionId) return;
	if (!uiState.cropMetadataId) return;

	const value = uiState.cropMetadataValueOf(image) ?? {
		confidence: 1,
		manuallyModified: true,
		value: FULL_IMAGE_CROPBOX,
		confidences: {},
		confirmed: true,
	};

	await storeMetadataValue({
		db: idb.databaseHandle(),
		sessionId: uiState.currentSessionId,
		metadataId: uiState.cropMetadataId,
		subjectId: image.id,
		type: 'boundingbox',
		...value,
		confirmed,
	});
}

export async function changeAllConfirmedStatuses(confirmed: boolean) {
	for (const image of currentImages()) {
		await changeCropConfirmedStatus(image, confirmed);
	}
}

export async function revertToInferredCrop(imageId: string) {
	const initialCrop = initialCrops[imageId];
	// On subsequent crops, the user's crop will be the main value and the neural network's crop will be in the alternatives.
	if (!initialCrop) {
		toasts.error(
			`L'image ${imageId} n'a pas de recadrage alternatif, impossible de revenir au recadrage d'origine`
		);
		return;
	}

	if (!uiState.currentSessionId) return;

	await storeMetadataValue({
		db: idb.databaseHandle(),
		sessionId: uiState.currentSessionId,
		subjectId: imageId,
		metadataId: uiState.cropMetadataId,
		type: 'boundingbox',
		manuallyModified: false,
		...initialCrop,
	});

	if (uiState.classificationMetadataId) {
		await deleteMetadataValue({
			db: idb.databaseHandle(),
			sessionId: uiState.currentSessionId,
			metadataId: uiState.classificationMetadataId,
			subjectId: imageId,
		});
	}
}

const revertableCrops = $derived(
	Object.fromEntries(
		currentImages().map((image) => {
			const initial = initialCrops[image.id]?.value;
			const current = image.metadata[uiState.cropMetadataId]?.value;
			return [
				image.id,
				Boolean(
					initial &&
					hasRuntimeType('boundingbox', current) &&
					!coordsAreEqual(initial, current)
				),
			];
		})
	)
);

export function canRevertCrop(imageId: string | undefined | null): imageId is string {
	if (!imageId) return false;
	return revertableCrops[imageId];
}

// We can revertAll() if either we have no initial crops at all, or at least some of them are revertable
export function canRevertAll() {
	return (
		Object.values(initialCrops).every((c) => !c) || Object.values(revertableCrops).some(Boolean)
	);
}

export async function revertAll() {
	// Either we have no initial crop: reverting means removing all boxes
	if (Object.values(initialCrops).every((c) => !c)) {
		for (const { id } of currentImages()) {
			await deleteBoundingBox(id);
		}
	} else {
		// Or we have at least one: revert all boxes to their initial positions
		for (const { id } of currentImages()) {
			await revertToInferredCrop(id);
		}
	}
}
