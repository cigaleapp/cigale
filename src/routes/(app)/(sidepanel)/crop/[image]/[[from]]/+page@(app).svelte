<script>
	/**
	 * @import * as Metadata from '$lib/metadata/index.js';
	 * @import * as DB from '$lib/database.js';
	 * @import { Rect, CenteredBoundingBox } from '$lib/BoundingBoxes.svelte.js';
	 */
	import * as dates from 'date-fns';
	import { watch } from 'runed';

	import IconFourPointCrop from '~icons/ri/apps-2-add-line';
	import IconUndo from '~icons/ri/arrow-go-back-fill';
	import IconUnconfirmedCrop from '~icons/ri/arrow-go-back-line';
	import IconRedo from '~icons/ri/arrow-go-forward-fill';
	import IconBack from '~icons/ri/arrow-left-line';
	import IconPrev from '~icons/ri/arrow-left-s-line';
	import IconNext from '~icons/ri/arrow-right-s-line';
	import IconConfirmedCrop from '~icons/ri/check-double-line';
	import IconHasCrop from '~icons/ri/crop-line';
	import IconTwoPointCrop from '~icons/ri/crosshair-2-line';
	import IconFocus from '~icons/ri/crosshair-line';
	import IconDelete from '~icons/ri/delete-bin-line';
	import IconToolMove from '~icons/ri/drag-move-2-fill';
	import IconGallery from '~icons/ri/function-line';
	import IconToolHand from '~icons/ri/hand';
	import IconRevert from '~icons/ri/reset-left-fill';
	import IconToolDragCrop from '~icons/ri/shape-2-line';
	import IconNeuralNet from '~icons/ri/sparkling-line';
	import { page } from '$app/state';
	import {
		boundingBoxIsNonZero,
		coordsAreEqual,
		coordsScaler,
		FULL_IMAGE_CROPBOX,
		toCenteredCoords,
		toTopLeftCoords
	} from '$lib/BoundingBoxes.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import ConfirmedOverlay from '$lib/ConfirmedOverlay.svelte';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import { idComparator } from '$lib/database.js';
	import DraggableBoundingBox from '$lib/DraggableBoundingBox.svelte';
	import { INITIAL_ZOOM_STATE } from '$lib/DraggableBoundingBox.svelte.js';
	import { percent } from '$lib/i18n';
	import * as idb from '$lib/idb.svelte.js';
	import {
		deleteImageFile,
		imageFileIds,
		imageId,
		imageIdToFileId,
		imagesOfImageFile,
		imageId as makeImageId,
		parseImageId
	} from '$lib/images.js';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import KeyboardHint from '$lib/KeyboardHint.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import {
		assertIs,
		deleteMetadataValue,
		hasRuntimeType,
		storeMetadataValue
	} from '$lib/metadata/index.js';
	import { goto } from '$lib/paths.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import SentenceJoin from '$lib/SentenceJoin.svelte';
	import { seo } from '$lib/seo.svelte';
	import { getSettings, setSetting, toggleSetting } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte';
	import Switch from '$lib/Switch.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import { tooltip } from '$lib/tooltips';
	import { undo } from '$lib/undo.svelte';
	import { clamp, fromEntries, mapValues, nonnull, pick, range, sign } from '$lib/utils';
	import { navbarAppearance } from '$routes/(app)/+layout.svelte';

	/**
	 * @import { RuntimeValue } from '$lib/schemas/metadata';
	 */

	navbarAppearance('hidden');

	const { data } = $props();
	const { sortedFileIds } = $derived(data);

	// TODO figure out why the [image] route param is nullable
	const fileId = $derived(page.params.image || '');
	const openedFromImage = $derived(
		page.params.from ? imageId(fileId, Number(page.params.from)) : undefined
	);

	const images = $derived(
		imagesOfImageFile(
			fileId,
			idb.tables.Image.state.filter((img) => img.sessionId === uiState.currentSessionId)
		)
	);
	const firstImage = $derived(images.at(0));

	seo({ title: `Recadrer ${firstImage?.filename ?? '...'}` });

	// Controls visibility of the checkmark little centered overlay
	let showConfirmedOverlay = $state(async () => {});

	/** @type {typeof tools[number]['name']} */
	let activeToolName = $state('Glisser-recadrer');
	/**
	 * @typedef {object} Tool
	 * @property {string} name
	 * @property {string} help
	 * @property {import('svelte').Component} icon
	 * @property {string} shortcut
	 * @property {boolean} transformable if true, the bounding box's sides or corners can be dragged
	 * @property {'clickanddrag'|'2point'|'4point'|'off'} createMode
	 * @property {boolean} movable if true, the bounding box can be moved by dragging in its inside
	 * @property {string} [cursor]
	 */
	const tools = /** @type {const} @satisfies {Tool[]} */ ([
		{
			name: 'Glisser-recadrer',
			help: 'Cliquer et glisser pour créer une boîte de recadrage',
			icon: IconToolDragCrop,
			shortcut: 'r',
			transformable: true,
			createMode: 'clickanddrag',
			movable: true,
			cursor: 'crosshair'
		},
		{
			name: '2 points',
			help: 'Cliquer sur les 2 coins pour créer une boîte de recadrage',
			icon: IconTwoPointCrop,
			shortcut: 'z',
			transformable: false,
			createMode: '2point',
			movable: false,
			cursor: 'crosshair'
		},
		{
			name: '4 points',
			help: 'Cliquer sur les 4 extrémités pour créer une boîte de recadrage',
			icon: IconFourPointCrop,
			shortcut: 'Shift+z',
			transformable: false,
			createMode: '4point',
			movable: false,
			cursor: 'crosshair'
		},
		{
			name: 'Déplacer',
			help: 'Cliquer et glisser pour déplacer la boîte de recadrage',
			icon: IconToolMove,
			shortcut: 'v',
			transformable: false,
			createMode: 'off',
			movable: true,
			cursor: 'pointer'
		},
		{
			name: 'Main',
			help: "Cliquer et glisser pour se déplacer dans l'image",
			icon: IconToolHand,
			shortcut: 'h',
			transformable: false,
			createMode: 'off',
			movable: false,
			cursor: 'grab'
		}
	]);

	const creationTools = $derived(tools.filter(({ createMode }) => createMode !== 'off'));

	let activeTool = $derived(tools.find(({ name }) => name === activeToolName) || tools[0]);

	let focusedImageId = $state('');

	/**
	 * @type {Record<string, RuntimeValue<'boundingbox'>>}
	 */
	const boundingBoxes = $derived(
		Object.fromEntries(
			images
				.map(({ id, metadata }) => [id, metadata[uiState.cropMetadataId]?.value])
				.filter(([, box]) => box !== undefined)
				.map(([id, box]) => [id, assertIs('boundingbox', box)])
		)
	);

	const imageSrc = $derived(uiState.getPreviewURL(fileId));
	const prevFileId = $derived.by(() => {
		const idx = sortedFileIds.indexOf(fileId) - 1;
		if (idx < 0) return undefined;
		return sortedFileIds.at(idx);
	});
	const nextFileId = $derived.by(() => {
		const idx = sortedFileIds.indexOf(fileId) + 1;
		if (idx >= sortedFileIds.length) return undefined;
		return sortedFileIds.at(idx);
	});
	const nextUnconfirmedImageId = $derived.by(() => {
		const forward = sortedFileIds
			.slice(sortedFileIds.indexOf(fileId) + 1)
			.filter((fileId) => !hasConfirmedCrop(fileId))
			.at(0);

		if (forward) return forward;

		// Loop around.
		return sortedFileIds.find((fileId) => !hasConfirmedCrop(fileId));
	});
	const croppedImagesCount = $derived(sortedFileIds.filter(hasCrop).length);
	const confirmedCropsCount = $derived(sortedFileIds.filter(hasConfirmedCrop).length);

	/** @type {Record<string, undefined | { value: RuntimeValue<'boundingbox'>, confidence: number }>} */
	const initialCrops = $derived(
		Object.fromEntries(
			images.map((image) => {
				if (!image.metadata[uiState.cropMetadataId]) {
					return [image.id, undefined];
				}

				const { alternatives, value, confidence, manuallyModified } =
					image.metadata[uiState.cropMetadataId];

				// On subsequent crops, the user's crop will be the main value and the neural network's crop will be in the alternatives.
				if (alternatives && Object.entries(alternatives).length > 0) {
					const [[stringValue, confidence]] = Object.entries(alternatives);
					return [
						image.id,
						{
							value: JSON.parse(stringValue),
							confidence
						}
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
		)
	);

	/**
	 * @param {string} imageFileId
	 */
	function hasCrop(imageFileId) {
		return imagesOfImageFile(imageFileId).every(
			(image) => uiState.cropMetadataId in image.metadata
		);
	}

	/**
	 * @param {string|undefined} imageFileId
	 */
	function hasConfirmedCrop(imageFileId) {
		if (!imageFileId) return false;
		return imagesOfImageFile(imageFileId).every(imageHasConfirmedCrop);
	}

	/**
	 * @param {DB.Image} image
	 */
	function imageHasConfirmedCrop(image) {
		const value = uiState.cropMetadataValueOf(image);
		return value?.confirmed;
	}

	/**
	 * @param {DB.Image} image
	 * @param {boolean} confirmed
	 */
	async function changeCropConfirmedStatus(image, confirmed) {
		if (!uiState.currentSessionId) return;
		if (!uiState.cropMetadataId) return;

		let value = uiState.cropMetadataValueOf(image);
		if (!value) {
			value = {
				confidence: 1,
				manuallyModified: true,
				value: FULL_IMAGE_CROPBOX,
				alternatives: {},
				confirmed: true
			};
		}

		await storeMetadataValue({
			db: idb.databaseHandle(),
			sessionId: uiState.currentSessionId,
			metadataId: uiState.cropMetadataId,
			subjectId: image.id,
			type: 'boundingbox',
			...value,
			confirmed
		});
	}

	/**
	 * @param {boolean} confirmed
	 */
	async function changeAllConfirmedStatuses(confirmed) {
		for (const image of images) {
			await changeCropConfirmedStatus(image, confirmed);
		}
	}

	/**
	 * @param {string} imageId
	 */
	async function revertToInferredCrop(imageId) {
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
			...initialCrop
		});

		if (uiState.classificationMetadataId) {
			await deleteMetadataValue({
				db: idb.databaseHandle(),
				sessionId: uiState.currentSessionId,
				metadataId: uiState.classificationMetadataId,
				subjectId: imageId
			});
		}
	}

	const revertableCrops = $derived(
		Object.fromEntries(
			images.map((image) => {
				const initial = initialCrops[image.id]?.value;
				const current = image.metadata[uiState.cropMetadataId]?.value;
				return [
					image.id,
					initial &&
						hasRuntimeType('boundingbox', current) &&
						!coordsAreEqual(initial, current)
				];
			})
		)
	);

	// We can revertAll() if either we have no initial crops at all, or at least some of them are revertable
	const canRevertAll = $derived(
		Object.values(initialCrops).every((c) => !c) || Object.values(revertableCrops).some(Boolean)
	);

	async function revertAll() {
		// Either we have no initial crop: reverting means removing all boxes
		if (Object.values(initialCrops).every((c) => !c)) {
			for (const { id } of images) {
				await deleteBoundingBox(id);
			}
		} else {
			// Or we have at least one: revert all boxes to their initial positions
			for (const { id } of images) {
				await revertToInferredCrop(id);
			}
		}
	}

	undo.on('crop/box/create', async ({ imageId }) => {
		if (imageIdToFileId(imageId) !== fileId) return;
		await deleteBoundingBox(imageId, { skipUndo: true });
	});

	undo.on('crop/box/edit', async ({ imageId, before }) => {
		if (imageIdToFileId(imageId) !== fileId) return;
		await onCropChange(imageId, toTopLeftCoords(before), false, false);
	});

	undo.on('crop/box/delete', async ({ imageId, box }) => {
		if (imageIdToFileId(imageId) !== fileId) return;
		await onCropChange(null, toTopLeftCoords(box), false, false);
	});

	/**
	 * @param {string} imageId
	 * @param {object} [options]
	 * @param {boolean} [options.skipUndo] whether to skip pushing this operation to the undo stack
	 */
	async function deleteBoundingBox(imageId, { skipUndo = false } = {}) {
		if (!skipUndo) {
			undo.push('crop/box/delete', {
				imageId,
				box: boundingBoxes[imageId]
			});
		}

		if (images.length === 1) {
			await deleteMetadataValue({
				db: idb.databaseHandle(),
				sessionId: uiState.currentSession?.id,
				metadataId: uiState.cropMetadataId,
				subjectId: imageId
			});
		} else {
			await idb.tables.Image.remove(imageId);
		}
	}

	/**
	 * @param {string|null} imageId ID of the image we're confirming a new crop for. Null if we're creating a new cropbox.
	 * @param {Rect|undefined} newBoundingBox
	 * @param {boolean} [flashConfirmedOverlay=true] flash the confirmed overlay when appropriate
	 * @param {boolean} [pushToUndoStack=true] whether to push this change to the undo stack
	 * @returns {Promise<string|null>} the ID of the image we just modified/created
	 */
	async function onCropChange(
		imageId,
		newBoundingBox,
		flashConfirmedOverlay = true,
		pushToUndoStack = true
	) {
		if (!uiState.currentSessionId) return null;

		const image = imageId ? images.find((img) => img.id === imageId) : undefined;
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
			images.filter(imageHasConfirmedCrop).length === images.length - 1;

		const willAutoskip =
			// The user has auto-skip enabled
			getSettings().cropAutoNext &&
			// We aren't deleting the bounding box
			boundingBoxIsNonZero(newBoundingBox) &&
			// in click-and-drag creation mode, auto-skip occurs only when the bounding box did not exist before (since the first creation of the box is much less likely to be the final one)
			(activeTool.createMode !== 'clickanddrag' || !hasCrop(fileId));

		if (uiState.classificationMetadataId) {
			const species = image?.metadata[uiState.classificationMetadataId];
			if (species && !species.manuallyModified) {
				// Species confidence was inferred, we need to remove it so we can infer it again, since it's inferred on the _cropped_ image
				await deleteMetadataValue({
					db: idb.databaseHandle(),
					sessionId: uiState.currentSessionId,
					metadataId: uiState.classificationMetadataId,
					subjectId: image.id
				});
			}
		}

		let newImageId = '';

		if (imageId) {
			if (pushToUndoStack) {
				undo.push('crop/box/edit', {
					imageId,
					before: boundingBoxes[imageId],
					after: toCenteredCoords(newBoundingBox)
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
				alternatives: initialCrops[imageId] ? [initialCrops[imageId]] : [],
				manuallyModified: true
			});
		} else if (
			images.length === 1 &&
			firstImage &&
			!firstImage.metadata[uiState.cropMetadataId]
		) {
			// We're creating a new cropbox, but it is the first one (and we already have an image, it just doesn't have a cropbox)
			newImageId = firstImage.id;

			if (pushToUndoStack) {
				undo.push('crop/box/create', {
					imageId: newImageId,
					box: toCenteredCoords(newBoundingBox)
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
				alternatives: []
			});
		} else {
			// We're creating a >1st cropbox
			newImageId = makeImageId(
				fileId,
				Math.max(...images.map(({ id }) => parseImageId(id).subindex).filter(nonnull)) + 1
			);

			if (pushToUndoStack) {
				undo.push('crop/box/create', {
					imageId: newImageId,
					box: toCenteredCoords(newBoundingBox)
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
						alternatives: {}
					}
				}
			});
		}

		showBoxesListHint = false;

		await changeAllConfirmedStatuses(true);

		// Select cropbox
		if (!selectedBox.manual) {
			selectedBox.imageId = newImageId || imageId;
		}

		if (willFlashConfirmedOverlay) {
			await showConfirmedOverlay();
		}

		if (willAutoskip) {
			if (nextUnconfirmedImageId) {
				await goto('/(app)/(sidepanel)/crop/[image]', { image: nextUnconfirmedImageId });
			} else {
				await goto('/(app)/(sidepanel)/classify');
			}
		}

		return newImageId;
	}

	async function moveToNextUnconfirmed() {
		const imagesAndBoxes = images.map(
			(img) => /** @type {const}*/ ([img, boundingBoxes[img.id]])
		);

		for (const [image, box] of imagesAndBoxes) {
			await onCropChange(image.id, box ? toTopLeftCoords(box) : undefined);
		}

		if (nextUnconfirmedImageId) {
			await goto('/(app)/(sidepanel)/crop/[image]', { image: nextUnconfirmedImageId });
		} else {
			await goto('/(app)/(sidepanel)/classify');
		}
	}

	async function deleteImageFileAndGotoNext() {
		const nextFileIdBeforeDelete = $state.snapshot(nextFileId);
		await deleteImageFile(fileId);

		if (nextFileIdBeforeDelete) {
			await goto('/(app)/(sidepanel)/crop/[image]', { image: nextFileIdBeforeDelete });
		} else {
			// If nextFileId (and not nextFileIdBeforeDelete) is undefined,
			// it means we just deleted the last image; so we go back to the import tab
			await goto('/(app)/(sidepanel)/import');
		}
	}

	/**
	 * @param {CenteredBoundingBox} box
	 * @returns {[number, number]} pixel dimensions of the box
	 */
	function roundedPixelDimensions(box) {
		if (!firstImage) return [0, 0];
		const scaler = coordsScaler({
			x: firstImage.dimensions.width,
			y: firstImage.dimensions.height
		});

		const { w, h } = mapValues(scaler(box), Math.round);
		return [w, h];
	}

	function exit() {
		uiState.imagePreviouslyOpenedInCropper = fileId;
		if (openedFromImage) {
			goto('/(app)/(sidepanel)/classify/[image]', { image: openedFromImage });
		} else {
			goto('/crop');
		}
	}

	$effect(() => {
		uiState.imageOpenedInCropper = fileId;
	});

	/**
	 * @typedef {object} SelectedBox
	 * @property {string|null} imageId
	 * @property {boolean} manual was selected manually instead of by modifying/creating a new box
	 */
	/** The imageID of the currently selected bounding box.
	 * @type {SelectedBox}
	 */
	let selectedBox = $state({
		imageId: null,
		manual: false
	});

	defineKeyboardShortcuts('cropping', {
		ArrowLeft: {
			help: 'Image précédente',
			when: () => Boolean(prevFileId),
			do: () => goto('/(app)/(sidepanel)/crop/[image]', { image: prevFileId })
		},
		'Shift+Space': {
			help: 'Image précédente',
			when: () => Boolean(prevFileId),
			do: () => goto('/(app)/(sidepanel)/crop/[image]', { image: prevFileId })
		},
		ArrowRight: {
			help: 'Image suivante',
			when: () => Boolean(nextFileId),
			do: () => goto('/(app)/(sidepanel)/crop/[image]', { image: nextFileId })
		},
		Space: {
			help: 'Continuer',
			do: moveToNextUnconfirmed
		},
		'$mod+Delete': {
			help: 'Supprimer l’image',
			do: deleteImageFileAndGotoNext
		},
		Escape: {
			help: 'Quitter le mode recadrage',
			do: exit
		},
		a: {
			help: 'Activer/désactiver la continuation automatique',
			do: async () => toggleSetting('cropAutoNext')
		},
		Delete: {
			help: 'Supprimer la boîte sélectionnée',
			when: () => Boolean(selectedBox.imageId),
			async do() {
				if (!selectedBox.imageId) return;
				await deleteBoundingBox(selectedBox.imageId);

				if (selectedBox.manual) {
					selectedBox.imageId = null;
				} else {
					// Select previous box in list
					selectedBox.imageId =
						images.toReversed().find((image) => image.id in boundingBoxes)?.id ?? null;
				}
			}
		},
		f: {
			help: 'Cacher les boîtes non sélectionnées',
			when: () => Boolean(selectedBox),
			do() {
				if (!selectedBox) return;
				if (selectedBox.imageId === focusedImageId) {
					focusedImageId = '';
				} else if (selectedBox.imageId) {
					focusedImageId = selectedBox.imageId;
				}
			}
		},
		u: {
			help: "Revenir au recadrage d'origine",
			when: () => Boolean(revertableCrops[fileId]),
			do: () => {
				if (!revertableCrops[fileId]) return;
				revertToInferredCrop(fileId);
			}
		},
		'$mod+u': {
			help: "Revenir au recadrage d'origine pour toutes les boîtes",
			when: () => Object.keys(boundingBoxes).length > 0,
			do: revertAll
		},
		ArrowUp: {
			help: 'Marquer le recadrage comme confirmé',
			when: () => !hasConfirmedCrop(fileId),
			do: () => changeAllConfirmedStatuses(true)
		},
		ArrowDown: {
			help: 'Marquer le recadrage comme non confirmé',
			when: () => hasConfirmedCrop(fileId),
			do: () => changeAllConfirmedStatuses(false)
		},
		'+': {
			help: 'Zoomer',
			do: () => {
				zoom.scale = clamp(1, zoom.scale + 4 * zoomSpeed, 10);
			}
		},
		'-': {
			help: 'Dézoomer',
			do: () => {
				zoom.scale = clamp(1, zoom.scale - 4 * zoomSpeed, 10);
			}
		},
		Digit0: {
			help: 'Réinitialiser le zoom',
			do: () => {
				zoom.origin = { x: 0, y: 0 };
				zoom.scale = 1;
			}
		},
		...fromEntries(
			tools.map((tool) => [
				tool.shortcut,
				{
					help: `Choisir l'outil ${tool.name}`,
					do: () => {
						activeToolName = tool.name;
					}
				}
			])
		),
		',': {
			help: 'Sélectionner la boîte précédente',
			do: () => {
				const imageIds = Object.keys(boundingBoxes);
				const currentIndex = imageIds.indexOf(selectedBox.imageId ?? '');
				const prevIndex = (currentIndex - 1 + imageIds.length) % imageIds.length;
				selectedBox.imageId = imageIds[prevIndex];
			}
		},
		';': {
			help: 'Sélectionner la boîte suivante',
			do: () => {
				const imageIds = Object.keys(boundingBoxes);
				const currentIndex = imageIds.indexOf(selectedBox.imageId ?? '');
				const nextIndex = (currentIndex + 1) % imageIds.length;
				selectedBox.imageId = imageIds[nextIndex];
			}
		},
		...fromEntries(
			range(1, 10).map((i) => [
				`Digit${i}`,
				{
					help: `Sélectionner la boîte #${i}`,
					when: () => Object.keys(boundingBoxes).length >= i,
					do: () => {
						const imageId = Object.keys(boundingBoxes)[i - 1];
						if (selectedBox.imageId === imageId) {
							selectedBox.imageId = null;
							selectedBox.manual = false;
						} else {
							selectedBox.imageId = imageId;
							selectedBox.manual = true;
						}
					}
				}
			])
		)
	});

	// Scroll to selected box
	$effect(() => {
		if (!selectedBox.imageId) return;
		document.querySelector(`.boxes li.selected`)?.scrollIntoView({
			behavior: 'smooth',
			block: 'nearest',
			inline: 'nearest'
		});
	});

	let imageElement = $state();
	let imageIsLoading = $state(true);

	watch(
		() => fileId,
		(newFileId, oldFileId) => {
			if (oldFileId) uiState.cropperZoomStates.set(oldFileId, $state.snapshot(zoom));

			zoom = $state.snapshot(uiState.cropperZoomStates.get(newFileId)) ?? INITIAL_ZOOM_STATE;
		}
	);

	let zoom = $state({ ...INITIAL_ZOOM_STATE });

	let showBoxesListHint = $derived(
		images.every(({ metadata }) => !metadata[uiState.cropMetadataId]?.manuallyModified)
	);

	const zoomSpeed = $derived(zoom.scale * 0.1);
</script>

<ConfirmedOverlay bind:show={showConfirmedOverlay} />

<div class="layout">
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<main
		class="crop-surface"
		onmousedown={async (e) => {
			// Pan on mousewhell button hold or hand tool
			if (activeTool.name !== 'Main' && e.button !== 1) return;

			// Hide autoscroll indicator on Firefox
			e.preventDefault();

			zoom.panning = true;
			zoom.panStart = {
				x: e.clientX,
				y: e.clientY,
				zoomOrigin: $state.snapshot(zoom.origin)
			};
		}}
		onmouseup={async ({ button }) => {
			// Pan on mousewheel button release or hand tool
			if (activeTool.name !== 'Main' && button !== 1) return;
			zoom.panning = false;
		}}
		onmousemove={async ({ clientX, clientY }) => {
			if (!zoom.panning) return;

			zoom.origin.x = zoom.panStart.zoomOrigin.x + (clientX - zoom.panStart.x);
			zoom.origin.y = zoom.panStart.zoomOrigin.y + (clientY - zoom.panStart.y);
		}}
		onwheel={async (e) => {
			e.preventDefault();
			// Most logic is thanks to https://stackoverflow.com/a/70251437
			let imageBounds = imageElement.getBoundingClientRect();
			let x = (e.clientX - imageBounds.x) / zoom.scale;
			let y = (e.clientY - imageBounds.y) / zoom.scale;

			zoom.scale = clamp(1, zoom.scale - sign(e.deltaY) * 2 * zoomSpeed, 10);

			if (zoom.scale > 1) {
				zoom.origin.x += sign(e.deltaY) * zoomSpeed * (x * 2 - imageElement.offsetWidth);
				zoom.origin.y += sign(e.deltaY) * zoomSpeed * (y * 2 - imageElement.offsetHeight);
			} else {
				zoom.origin = { x: 0, y: 0 };
			}
		}}
	>
		<div class="behind-image">
			{#if imageIsLoading}
				<LoadingSpinner --size="2em" />
				<p class="loading">Chargement de l'image…</p>
			{:else}
				<p class="coucou" aria-hidden="true">
					coucou toi :)
					<br />
					passes une bonne journée ! 💖💖
				</p>
			{/if}
		</div>
		<img
			data-testid="crop-subject-image"
			src={imageSrc}
			alt=""
			bind:this={imageElement}
			style:scale={zoom.scale}
			style:translate="{zoom.origin.x}px {zoom.origin.y}px"
			onload={() => {
				imageIsLoading = false;
			}}
		/>
		{#if imageElement}
			<DraggableBoundingBox
				{...activeTool}
				{imageElement}
				{zoom}
				imageFileID={fileId}
				boundingBoxes={mapValues(
					focusedImageId ? pick(boundingBoxes, focusedImageId) : boundingBoxes,
					toTopLeftCoords
				)}
				disabled={zoom.panning}
				cursor={zoom.panning
					? activeTool.name === 'Main'
						? 'grabbing'
						: 'move'
					: activeTool.cursor}
				onchange={(imageId, box) => onCropChange(imageId, box)}
				oncreate={(box) => onCropChange(null, box)}
			/>
		{/if}
	</main>
	<aside class="toolbar">
		{#each tools as tool (tool.name)}
			<button
				aria-label="Choisir l'outil {tool.name}"
				class:active={tool.name === activeToolName}
				use:tooltip={{
					text: `${tool.name}: ${tool.help}`,
					keyboard: tool.shortcut,
					placement: 'right'
				}}
				onclick={() => {
					activeToolName = tool.name;
				}}
			>
				<tool.icon />
			</button>
		{/each}
		<button
			aria-label="Annuler"
			use:tooltip={{ text: 'Annuler', keyboard: '$mod+z', placement: 'right' }}
			onclick={() => undo.pop()}
		>
			<IconUndo />
		</button>
		<button
			aria-label="Rétablir"
			use:tooltip={{ text: 'Rétablir', keyboard: '$mod+Shift+z', placement: 'right' }}
			onclick={() => undo.rewind()}
		>
			<IconRedo />
		</button>
	</aside>
	<aside class="info">
		<section class="top">
			<section class="preactions">
				{#if openedFromImage}
					<ButtonInk
						inline
						onclick={exit}
						help="Retourner à la classification de l'image"
					>
						<IconBack />
						Retour
						<KeyboardHint shortcut="Escape" />
					</ButtonInk>
				{:else}
					<ButtonInk inline onclick={exit}>
						<IconGallery />
						Autres photos
						<KeyboardHint shortcut="Escape" />
					</ButtonInk>
				{/if}
				<ButtonInk
					dangerous
					onclick={deleteImageFileAndGotoNext}
					help={{
						text: 'Supprimer cette image et passer à la suivante',
						keyboard: '$mod+Delete'
					}}
				>
					<IconDelete />
					Supprimer
				</ButtonInk>
			</section>
			<section class="filename">
				{#if firstImage}
					<h1>
						{firstImage.filename}
						{#if hasConfirmedCrop(fileId)}
							<div class="status" use:tooltip={'Recadrage confirmé'}>
								<IconConfirmedCrop />
							</div>
						{/if}
					</h1>
				{:else}
					<h1>
						<code>Image introuvable</code>
					</h1>
				{/if}
			</section>
			<section class="actions">
				<ButtonSecondary
					keyboard="$mod+U"
					help="Revenir au recadrage d'origine pour toutes les boîtes"
					onclick={revertAll}
					disabled={!canRevertAll}
				>
					<IconRevert />
					Réinit.
				</ButtonSecondary>
				<ButtonSecondary
					keyboard={hasConfirmedCrop(fileId) ? 'ArrowDown' : 'ArrowUp'}
					onclick={() => changeAllConfirmedStatuses(!hasConfirmedCrop(fileId))}
					help={hasConfirmedCrop(fileId)
						? 'Marquer le recadrage comme non confirmé'
						: 'Marquer le recadrage comme confirmé'}
				>
					{#if hasConfirmedCrop(fileId)}
						<IconUnconfirmedCrop />
						Invalider
					{:else}
						<IconConfirmedCrop />
						Valider
					{/if}
				</ButtonSecondary>
			</section>
		</section>
		<section class="boxes">
			<ul>
				{#each images.filter(({ id }) => id in boundingBoxes) as image, i (image.id)}
					{@const box = boundingBoxes[image.id]}
					{@const initBox = initialCrops[image.id]}
					{@const [w, h] = roundedPixelDimensions(box)}
					{@const isFocused = focusedImageId === image.id}
					<li
						class:unfocused={focusedImageId && focusedImageId !== image.id}
						class:selected={selectedBox.imageId === image.id}
					>
						{#if image.fileId && firstImage}
							<CroppedImg
								dimensions={firstImage.dimensions}
								box={toTopLeftCoords(box)}
								src={uiState.getPreviewURL(image.fileId)}
								class="thumb"
							/>
						{/if}
						<div class="text">
							<p class="index">Boîte #{i + 1}</p>
							<p class="dimensions">
								<code use:tooltip={"Dimensions de l'image recadrée (en pixels)"}
									>{w}×{h}</code
								>
								<!-- we have a neural-infered value only, put the confidence next to the value -->
								{#if initBox && !image.metadata[uiState.cropMetadataId].manuallyModified}
									<span class="sep">&middot;</span>
									<ConfidencePercentage value={initBox.confidence}>
										<div class="confidence-icon">
											<IconNeuralNet />
										</div>
									</ConfidencePercentage>
								{/if}
							</p>
						</div>
						<div class="actions">
							{#if Object.values(boundingBoxes).length > 1}
								<ButtonIcon
									help={isFocused
										? 'Réafficher les autres boîtes'
										: 'Masquer les autres boîtes'}
									keyboard="F"
									onclick={() => (focusedImageId = isFocused ? '' : image.id)}
									crossout={isFocused}
								>
									<IconFocus />
								</ButtonIcon>
							{/if}
							<ButtonIcon
								help={initBox
									? `Revenir au recadrage d'origine 
									(${roundedPixelDimensions(initBox.value).join(' × ')}, ${percent(initBox.confidence)} de confiance)`
									: "Recadrage d'origine indisponible"}
								keyboard="u"
								disabled={!revertableCrops[image.id]}
								onclick={() => revertToInferredCrop(image.id)}
							>
								<IconRevert />
							</ButtonIcon>
							<ButtonIcon
								help="Supprimer la boîte sélectionnée"
								keyboard="Delete"
								onclick={async () => deleteBoundingBox(image.id)}
							>
								<IconDelete />
							</ButtonIcon>
						</div>
					</li>
				{/each}
				{#if showBoxesListHint}
					<li class="boxes-list-hint">
						<p>
							{@html 'Pour créer une nouvelle boîte,<wbr /> utilisez les outils'}
							<SentenceJoin items={creationTools} key={(t) => t.name} final="ou">
								{#snippet children({ icon: Icon, help, shortcut })}
									<Tooltip text={help} keyboard={shortcut}>
										<Icon />
									</Tooltip>
								{/snippet}
							</SentenceJoin>
						</p>
						<p>
							Sélectionnez une boîte avec 1 à 9 pour la modifier avec des raccourcis
							clavier
						</p>
					</li>
				{/if}
			</ul>
		</section>
		<section class="progress">
			{#snippet percentage(/** @type {number} */ value)}
				<code>
					{percent(value / sortedFileIds.length)}
				</code>
			{/snippet}

			<div class="bar">
				<p>
					<IconHasCrop />
					Images avec recadrage
					{@render percentage(croppedImagesCount)}
				</p>
				<ProgressBar alwaysActive progress={croppedImagesCount / sortedFileIds.length} />
			</div>
			<div class="bar">
				<p>
					<IconConfirmedCrop />
					Recadrages confirmés
					{@render percentage(confirmedCropsCount)}
				</p>
				<ProgressBar alwaysActive progress={confirmedCropsCount / sortedFileIds.length} />
			</div>
		</section>
		<nav>
			<div class="navigation">
				<ButtonIcon
					disabled={!prevFileId}
					help="Image précédente"
					keyboard="ArrowLeft"
					onclick={() => {
						if (!prevFileId) return;
						goto('/(app)/(sidepanel)/crop/[image]', { image: prevFileId });
					}}
				>
					<IconPrev />
				</ButtonIcon>
				<code class="numbers">
					{sortedFileIds.indexOf(fileId) + 1}
					<div class="separator">⁄</div>
					{sortedFileIds.length}
				</code>
				<ButtonIcon
					disabled={!nextFileId}
					help="Image suivante"
					keyboard="ArrowRight"
					onclick={() => {
						if (!nextFileId) return;
						goto('/(app)/(sidepanel)/crop/[image]', { image: nextFileId });
					}}
				>
					<IconNext />
				</ButtonIcon>
			</div>
			<div class="continue">
				<span
					class="auto"
					use:tooltip={{
						text: "Passer automatiquement à l'image suivante quand celle-ci est recadrée",
						keyboard: 'A'
					}}
				>
					<Switch
						bind:value={
							() => getSettings().cropAutoNext,
							(value) => setSetting('cropAutoNext', value)
						}
						label="Auto"
					/>
					Auto
				</span>
				<ButtonSecondary
					onclick={moveToNextUnconfirmed}
					keyboard="Space"
					help="Marquer le recadrage comme confirmé et passer à la prochaine image non confirmée"
				>
					Continuer
				</ButtonSecondary>
			</div>
		</nav>
	</aside>
</div>

<style>
	.layout {
		display: flex;
		height: 100%;
		overflow: hidden;
	}

	.toolbar {
		--width: 2.5em;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.25em;
	}

	.toolbar button {
		font-size: 1.2em;
		width: var(--width);
		height: var(--width);
		display: flex;
		justify-content: center;
		align-items: center;
		border: none;
		background: none;
		cursor: pointer;
		position: relative;
		border-radius: var(--corner-radius);
	}

	.toolbar button.active {
		color: var(--fg-primary);
	}

	.toolbar button::after {
		content: '';
		position: absolute;
		bottom: 5px;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 3px;
		border-radius: 1000000px;
		background: var(--bg-primary);
		transition: width 0.1s;
	}

	.toolbar button.active::after {
		width: 40%;
	}

	.toolbar button:is(:hover, :focus-visible) {
		color: var(--fg-primary);
		background: var(--bg-primary-translucent);
	}

	.crop-surface {
		overflow: hidden;
		position: relative;
		user-select: none;
		width: 100%;
		border-right: 1px solid var(--gray);
		border-left: 1px solid var(--gray);
	}

	.behind-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.behind-image .loading {
		margin-top: 1em;
		font-size: 1.2em;
	}

	.behind-image .coucou {
		text-align: center;
		font-size: 0.9em;
		color: var(--fg-primary);
	}

	.info {
		padding: 1em 1.5em;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2.5em;
		min-width: 450px;
		resize: horizontal;
		/* to make resize work */
		overflow: hidden;
	}

	.info .top {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.info .top .preactions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
	}

	.info h1 {
		font-size: 1.5em;
		display: flex;
		align-items: center;
		gap: 0.25em;
	}

	.info h1 .status {
		display: flex;
		font-size: 0.7em;
		color: var(--fg-success);
	}

	.info section.actions {
		--width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75em;
		width: 100%;
		margin-top: 0.5em;
	}

	.boxes {
		overflow-y: auto;
		height: 100%;
	}

	.boxes ul {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		list-style: none;
		padding-left: 0;
	}

	.boxes li {
		display: flex;
		gap: 1em;
	}

	.boxes li:not(.boxes-list-hint) {
		padding: 0.5em 1em;
		align-items: center;
	}

	.boxes li.unfocused {
		opacity: 0.5;
	}

	.boxes li.selected {
		background: var(--bg-primary-translucent);
	}

	.boxes li.boxes-list-hint {
		margin-top: 1em;
		color: var(--gay);
		flex-direction: column;
	}

	.boxes li.boxes-list-hint p,
	.boxes li.boxes-list-hint p :global(.icon) {
		vertical-align: middle;
	}

	.boxes li :global(.thumb) {
		--size: 4rem;
		width: var(--size);
		height: var(--size);
		border-radius: var(--corner-radius);
		background: color-mix(in srgb, var(--gray) 35%, transparent);
	}

	.boxes li .dimensions {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.boxes li .confidence-icon {
		font-size: 0.8rem;
		margin-right: 0.5em;
		display: flex;
		align-items: center;
	}

	.boxes li .actions {
		margin-left: auto;
	}

	.info .progress {
		display: flex;
		flex-direction: column;
		--inactive-bg: var(--gray);
		gap: 1.25em;
	}

	.info .progress .bar p {
		margin-bottom: 0.25em;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.info .progress .bar p code {
		color: var(--gay);
		font-size: 0.9em;
		margin-left: auto;
	}

	.info nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info nav :is(div, span) {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.info nav .navigation {
		gap: 0.25em;
	}

	.info nav .navigation .numbers {
		display: flex;
		align-self: center;
		white-space: nowrap;
	}

	.info nav .continue {
		gap: 1.5em;
	}

	.info nav .auto {
		gap: 0.25em;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>
