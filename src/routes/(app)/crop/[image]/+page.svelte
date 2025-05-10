<script>
	/**
	 * @import * as Metadata from '$lib/metadata.js';
	 * @import * as DB from '$lib/database.js';
	 * @import { Rect, CenteredBoundingBox } from '$lib/BoundingBoxes.svelte.js';
	 */
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		boundingBoxIsNonZero,
		coordsAreEqual,
		coordsScaler,
		toCenteredCoords,
		toTopLeftCoords
	} from '$lib/BoundingBoxes.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import DraggableBoundingBox from '$lib/DraggableBoundingBox.svelte';
	import {
		fittedImageRect,
		INITIAL_ZOOM_STATE,
		zoomBoxFromState
	} from '$lib/DraggableBoundingBox.svelte.js';
	import KeyboardHint from '$lib/KeyboardHint.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import SentenceJoin from '$lib/SentenceJoin.svelte';
	import Switch from '$lib/Switch.svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import * as idb from '$lib/idb.svelte.js';
	import {
		imageFileIds,
		imagesOfImageFile,
		imageId as makeImageId,
		parseImageId
	} from '$lib/images';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import { assertIs, deleteMetadataValue, storeMetadataValue } from '$lib/metadata';
	import { seo } from '$lib/seo.svelte';
	import { getSettings, setSetting, toggleSetting } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { tooltip } from '$lib/tooltips';
	import { clamp, fromEntries, mapValues, pick, range, sign } from '$lib/utils';
	import { formatISO } from 'date-fns';
	import { watch } from 'runed';
	import IconRevert from '~icons/ph/arrow-arc-left';
	import IconToolMove from '~icons/ph/arrows-out-cardinal';
	import IconPrev from '~icons/ph/caret-left';
	import IconNext from '~icons/ph/caret-right';
	import IconContinue from '~icons/ph/check';
	import IconHasCrop from '~icons/ph/crop';
	import IconFocus from '~icons/ph/crosshair-simple';
	import IconNeuralNet from '~icons/ph/graph';
	import IconToolHand from '~icons/ph/hand';
	import IconFourPointCrop from '~icons/ph/number-circle-four';
	import IconTwoPointCrop from '~icons/ph/number-circle-two';
	import IconUnconfirmedCrop from '~icons/ph/seal';
	import IconConfirmedCrop from '~icons/ph/seal-check';
	import IconToolDragCrop from '~icons/ph/selection-plus';
	import IconGallery from '~icons/ph/squares-four';
	import IconDelete from '~icons/ph/trash';

	const fileId = $derived(page.params.image);
	const images = $derived(imagesOfImageFile(fileId, idb.tables.Image.state));
	const firstImage = $derived(images.at(0));

	$effect(() => seo({ title: `Recadrer ${firstImage?.filename ?? '...'}` }));

	// Controls visibility of the checkmark little centered overlay
	let confirmedOverlayShown = $state(false);

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
			help: 'Cliquer sur les deux coins pour créer une boîte de recadrage',
			icon: IconTwoPointCrop,
			shortcut: 'z',
			transformable: false,
			createMode: '2point',
			movable: false,
			cursor: 'crosshair'
		},
		{
			name: '4 points',
			help: 'Cliquer sur les 4 coins pour créer une boîte de recadrage',
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
	 * @type {Record<string, Metadata.RuntimeValue<'boundingbox'>>}
	 */
	const boundingBoxes = $derived(
		Object.fromEntries(
			images
				.map(({ metadata, id }) => [
					id,
					assertIs('boundingbox', metadata[uiState.cropMetadataId]?.value)
				])
				.filter(([, value]) => Boolean(value))
		)
	);
	const imageSrc = $derived(uiState.previewURLs.get(fileId));
	const sortedFileIds = $derived(imageFileIds(idb.tables.Image.state).toSorted(idb.idComparator));
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

	/** @type {Record<string, undefined | { value: Metadata.RuntimeValue<'boundingbox'>, confidence: number }>} */
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
		const metadataId = uiState.currentProtocol?.crop?.confirmationMetadata;
		if (!metadataId) return false;
		return metadataId in image.metadata && image.metadata[metadataId].value;
	}

	/**
	 * @param {string} imageId
	 * @param {boolean} confirmed
	 */
	async function changeCropConfirmedStatus(imageId, confirmed) {
		const metadataId = uiState.cropConfirmationMetadataId;
		if (!metadataId) return;

		await storeMetadataValue({
			metadataId,
			subjectId: imageId,
			type: 'boolean',
			manuallyModified: true,
			value: confirmed
		});
	}

	/**
	 * @param {boolean} confirmed
	 */
	async function changeAllConfirmedStatuses(confirmed) {
		if (!uiState.cropConfirmationMetadataId) {
			toasts.error(
				'Ce protocole ne supported pas la validation des recadrages (voir crop.confirmationMetadata dans la définition du protocole)'
			);
			return;
		}

		for (const image of images) {
			await changeCropConfirmedStatus(image.id, confirmed);
		}
	}

	/**
	 * @param {string} imageId
	 */
	async function revertToInferedCrop(imageId) {
		const initialCrop = initialCrops[imageId];
		// On subsequent crops, the user's crop will be the main value and the neural network's crop will be in the alternatives.
		if (!initialCrop) {
			toasts.error(
				`L'image ${imageId} n'a pas de recadrage alternatif, impossible de revenir au recadrage d'origine`
			);
			return;
		}

		await storeMetadataValue({
			subjectId: imageId,
			metadataId: uiState.cropMetadataId,
			type: 'boundingbox',
			manuallyModified: false,
			...initialCrop
		});

		await deleteMetadataValue({
			metadataId: uiState.classificationMetadataId,
			subjectId: imageId
		});
	}

	async function revertAll() {
		for (const { id } of images) {
			await revertToInferedCrop(id);
		}
	}

	const revertableCrops = $derived(
		Object.fromEntries(
			images.map((image) => [
				image.id,
				initialCrops[image.id] &&
					!coordsAreEqual(
						initialCrops[image.id].value,
						image.metadata[uiState.cropMetadataId].value
					)
			])
		)
	);

	/**
	 * @param {string|null} imageId ID of the image we're confirming a new crop for. Null if we're creating a new cropbox.
	 * @param {Rect|undefined} newBoundingBox
	 * @param {boolean} [flashConfirmedOverlay=true] flash the confirmed overlay when appropriate
	 * @returns {Promise<string|null>} the ID of the image we just modified/created
	 */
	async function onCropChange(imageId, newBoundingBox, flashConfirmedOverlay = true) {
		if (!newBoundingBox) {
			// No bounding box, just mark the image as confirmed and move on
			if (imageId) {
				await changeCropConfirmedStatus(imageId, true);
			}

			return imageId;
		}

		// Flash if
		const willFlashConfirmedOverlay =
			// the caller asked for it,
			flashConfirmedOverlay &&
			// we can actually mark crops as confirmed given the current protocol
			Boolean(uiState.cropConfirmationMetadataId) &&
			// and this is the last image before the file is considered confirmed
			images.filter(imageHasConfirmedCrop).length === images.length - 1;

		const willAutoskip =
			// The user has auto-skip enabled
			getSettings().cropAutoNext &&
			// We aren't deleting the bounding box
			boundingBoxIsNonZero(newBoundingBox) &&
			// in click-and-drag creation mode, auto-skip occurs only when the bounding box did not exist before (since the first creation of the box is much less likely to be the final one)
			(activeTool.createMode !== 'clickanddrag' || !hasCrop(fileId));

		const image = imageId ? images.find((img) => img.id === imageId) : undefined;
		const species = image?.metadata[uiState.classificationMetadataId];
		if (species && !species.manuallyModified) {
			// Species confidence was inferred, we need to remove it so we can infer it again, since it's inferred on the _cropped_ image
			await deleteMetadataValue({
				metadataId: uiState.classificationMetadataId,
				subjectId: image.id
			});
		}

		let newImageId = '';

		if (imageId) {
			// We're modifying an existing cropbox
			await storeMetadataValue({
				metadataId: uiState.cropMetadataId,
				subjectId: imageId,
				type: 'boundingbox',
				value: toCenteredCoords(newBoundingBox),
				confidence: 1,
				// Put the neural-network-inferred (initial) value in the alternatives as a backup
				alternatives: initialCrops[imageId] ? [initialCrops[imageId]] : undefined,
				manuallyModified: true
			});
		} else if (images.length === 1 && firstImage && !firstImage.metadata[uiState.cropMetadataId]) {
			// We're creating a new cropbox, but it is the first one (and we already have an image, it just doesn't have a cropbox)
			newImageId = firstImage.id;
			await storeMetadataValue({
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
				Math.max(...images.map(({ id }) => parseImageId(id).subindex)) + 1
			);
			await idb.tables.Image.set({
				id: newImageId,
				filename: firstImage?.filename ?? '',
				addedAt: formatISO(firstImage?.addedAt ?? new Date()),
				contentType: firstImage?.contentType ?? '',
				dimensions: $state.snapshot(firstImage?.dimensions) ?? { width: 0, height: 0 },
				fileId,
				metadata: {
					[uiState.cropMetadataId]: {
						value: JSON.stringify(toCenteredCoords(newBoundingBox)),
						confidence: 1,
						manuallyModified: true,
						alternatives: {}
					},
					// Set it right now to prevent confirmed crop indicators flickering
					[uiState.cropConfirmationMetadataId]: {
						value: 'true',
						confidence: 1,
						manuallyModified: true,
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
			confirmedOverlayShown = true;
			await new Promise((resolve) => setTimeout(resolve, 500));
			confirmedOverlayShown = false;
		}

		if (willAutoskip) {
			await goto(nextUnconfirmedImageId ? `#/crop/${nextUnconfirmedImageId}` : `#/classify`, {
				invalidateAll: true
			});
		}

		return newImageId;
	}

	async function moveToNextUnconfirmed() {
		const imagesAndBoxes = images.map((img) => /** @type {const}*/ ([img, boundingBoxes[img.id]]));

		for (const [image, box] of imagesAndBoxes) {
			await onCropChange(image.id, box ? toTopLeftCoords(box) : undefined);
		}

		await goto(nextUnconfirmedImageId ? `#/crop/${nextUnconfirmedImageId}` : `#/classify`);
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

	function goToGallery() {
		uiState.imagePreviouslyOpenedInCropper = fileId;
		goto('#/crop');
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

	defineKeyboardShortcuts({
		ArrowLeft: {
			help: 'Image précédente',
			when: () => Boolean(prevFileId),
			do: () => goto(`#/crop/${prevFileId}`)
		},
		'Shift+Space': {
			help: 'Image précédente',
			when: () => Boolean(prevFileId),
			do: () => goto(`#/crop/${prevFileId}`)
		},
		ArrowRight: {
			help: 'Image suivante',
			when: () => Boolean(nextFileId),
			do: () => goto(`#/crop/${nextFileId}`)
		},
		Space: {
			help: 'Continuer',
			do: moveToNextUnconfirmed
		},
		Escape: {
			help: 'Quitter le recadrage',
			do: goToGallery
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
				await deleteMetadataValue({
					metadataId: uiState.cropMetadataId,
					subjectId: selectedBox.imageId
				});
				if (selectedBox.manual) {
					selectedBox.imageId = null;
				} else {
					// Select previous box in list
					console.log(images.toReversed(), selectedBox);
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
				revertToInferedCrop(fileId);
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
			help: `Sélectionner la boîte précédente`,
			do: () => {
				const imageIds = Object.keys(boundingBoxes);
				const currentIndex = imageIds.indexOf(selectedBox.imageId ?? '');
				const prevIndex = (currentIndex - 1 + imageIds.length) % imageIds.length;
				selectedBox.imageId = imageIds[prevIndex];
			}
		},
		';': {
			help: `Sélectionner la boîte suivante`,
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
			console.log('Chaning zoom state, of ', fileId);
			zoom = $state.snapshot(uiState.cropperZoomStates.get(newFileId)) ?? INITIAL_ZOOM_STATE;
		}
	);

	let zoom = $state({ ...INITIAL_ZOOM_STATE });

	let showBoxesListHint = $derived(
		images.every(({ metadata }) => !metadata[uiState.cropMetadataId]?.manuallyModified)
	);

	const zoomSpeed = $derived(zoom.scale * 0.1);
</script>

<div class="confirmed-overlay" aria-hidden={!confirmedOverlayShown}>
	<div class="icon">
		<IconConfirmedCrop />
	</div>
	<p>Confirmé</p>
</div>

<div class="layout">
	<aside class="toolbar">
		{#each tools as tool (tool.name)}
			<button
				aria-label="Sélectionner l'outil {tool.name}"
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
	</aside>
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
			src={imageSrc}
			alt=""
			bind:this={imageElement}
			style:scale={zoom.scale}
			style:translate="{zoom.origin.x}px {zoom.origin.y}px"
			onload={() => {
				imageIsLoading = false;
			}}
		/>
		{#if zoom.scale > 1}
			{@const imageRect = fittedImageRect(imageElement)}
			{@const zoombox = zoomBoxFromState(zoom, imageRect)}
			<aside class="zoom-window">
				<div
					class="zoombox"
					style:top="{zoombox.y * 100}%"
					style:left="{zoombox.x * 100}%"
					style:width="{zoombox.width * 100}%"
					style:height="{zoombox.height * 100}%"
				></div>
				<img src={imageSrc} alt="" aria-hidden="true" />
			</aside>
		{/if}
		{#if imageElement}
			<DraggableBoundingBox
				{...activeTool}
				{imageElement}
				{zoom}
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
	<aside class="info">
		<section class="top">
			<nav class="back">
				<ButtonInk onclick={goToGallery}>
					<IconGallery /> Toutes les photos
					<KeyboardHint shortcut="Escape" />
				</ButtonInk>
			</nav>
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
					disabled={!Object.values(revertableCrops).some(Boolean)}
				>
					<IconRevert />
					Réinit.
				</ButtonSecondary>
				{#if uiState.cropConfirmationMetadataId}
					<ButtonSecondary
						keyboard="Arrow{hasConfirmedCrop(fileId) ? 'Down' : 'Up'}"
						onclick={() => changeAllConfirmedStatuses(!hasConfirmedCrop(fileId))}
						help="Marquer le recadrage comme {hasConfirmedCrop(fileId)
							? 'non confirmé'
							: 'confirmé'}"
					>
						{#if hasConfirmedCrop(fileId)}
							<IconUnconfirmedCrop />
							Invalider
						{:else}
							<IconConfirmedCrop />
							Valider
						{/if}
					</ButtonSecondary>
				{/if}
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
						<CroppedImg
							box={toTopLeftCoords(box)}
							src={uiState.getPreviewURL(image.fileId)}
							class="thumb"
						/>
						<div class="text">
							<p class="index">Boîte #{i + 1}</p>
							<p class="dimensions">
								<code use:tooltip={"Dimensions de l'image recadrée (en pixels)"}>{w}×{h}</code>
								<!-- we have a neural-infered value only, put the confidence next to the value -->
								{#if initBox && !image.metadata[uiState.cropMetadataId].manuallyModified}
									<sup>
										<ConfidencePercentage value={initBox.confidence}>
											<IconNeuralNet />
										</ConfidencePercentage>
									</sup>
								{/if}
							</p>
						</div>
						<div class="actions">
							{#if Object.values(boundingBoxes).length > 1}
								<ButtonIcon
									help="{isFocused ? 'Réafficher' : 'Masquer'} les autres boîtes"
									keyboard="F"
									onclick={() => (focusedImageId = isFocused ? '' : image.id)}
									crossout={isFocused}
								>
									<IconFocus />
								</ButtonIcon>
							{/if}
							<ButtonIcon
								help="Revenir au recadrage d'origine ({initBox
									? `${roundedPixelDimensions(initBox.value).join(' × ')}, ${Math.round(initBox.confidence * 100)}% de confiance`
									: 'indisponible'})"
								keyboard="u"
								disabled={!revertableCrops[image.id]}
								onclick={() => revertToInferedCrop(image.id)}
							>
								<IconRevert />
							</ButtonIcon>
							<ButtonIcon
								help="Supprimer cette boîte"
								keyboard="Delete"
								onclick={async () => {
									if (images.length === 1) {
										await deleteMetadataValue({
											metadataId: uiState.cropMetadataId,
											subjectId: image.id
										});
									} else {
										await idb.tables.Image.remove(image.id);
									}
								}}
							>
								<IconDelete />
							</ButtonIcon>
						</div>
					</li>
				{/each}
				{#if showBoxesListHint}
					<li class="boxes-list-hint">
						<p>
							Pour créer une nouvelle boîte,<wbr /> utilisez les outils <SentenceJoin
								items={creationTools}
								key={(t) => t.name}
								final="ou"
							>
								{#snippet children({ icon: Icon, help, shortcut })}
									<Tooltip text={help} keyboard={shortcut}>
										<Icon />
									</Tooltip>
								{/snippet}
							</SentenceJoin>
						</p>
						<p>
							Sélectionnez une boîte avec
							<KeyboardHint shortcut="1" /> à <KeyboardHint shortcut="9" /> pour la modifier avec des
							raccourcis clavier
						</p>
					</li>
				{/if}
			</ul>
		</section>
		<section class="progress">
			{#snippet percent(/** @type {number} */ value)}
				<code>
					{Math.round((value / sortedFileIds.length) * 100)}%
				</code>
			{/snippet}

			<div class="bar">
				<p>
					<IconHasCrop />
					Images avec recadrage
					{@render percent(croppedImagesCount)}
				</p>
				<ProgressBar alwaysActive progress={croppedImagesCount / sortedFileIds.length} />
			</div>
			{#if uiState.cropConfirmationMetadataId}
				<div class="bar">
					<p>
						<IconConfirmedCrop />
						Recadrages confirmés
						{@render percent(confirmedCropsCount)}
					</p>
					<ProgressBar alwaysActive progress={confirmedCropsCount / sortedFileIds.length} />
				</div>
			{/if}
		</section>
		<nav>
			<div class="navigation">
				<ButtonIcon
					disabled={!prevFileId}
					help="Image précédente"
					keyboard="ArrowLeft"
					onclick={() => {
						goto(`#/crop/${prevFileId}`);
					}}
				>
					<IconPrev />
				</ButtonIcon>
				<code>
					{sortedFileIds.indexOf(fileId) + 1}⁄{sortedFileIds.length}
				</code>
				<ButtonIcon
					disabled={!nextFileId}
					help="Image suivante"
					keyboard="ArrowRight"
					onclick={() => {
						goto(`#/crop/${nextFileId}`);
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
							() => getSettings().cropAutoNext, (value) => setSetting('cropAutoNext', value)
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
					<IconContinue />
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

	.confirmed-overlay {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 100;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.5rem;
		padding: 2rem;
		color: var(--fg-success);
		background-color: var(--bg-neutral);
		border-radius: var(--corner-radius);
		display: flex;
		flex-direction: column;
		transition: opacity 0.2s;
		pointer-events: none;
	}

	.confirmed-overlay[aria-hidden='true'] {
		opacity: 0;
		/* https://github.com/microsoft/playwright/issues/5129#issuecomment-772746396 */
		visibility: hidden;
	}

	.confirmed-overlay .icon {
		font-size: 2.5em;
		margin-bottom: -1rem;
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
		--cell-size: calc(100% / 16 - 0.125px);
		background-size: var(--cell-size) var(--cell-size);
		background-image:
			linear-gradient(to right, var(--gray) 1px, transparent 1px),
			linear-gradient(to bottom, var(--gray) 1px, transparent 1px);
	}

	.zoom-window {
		position: absolute;
		bottom: 0;
		right: 0;
		height: 10rem;
		pointer-events: none;
		overflow: hidden;
	}

	.zoom-window img {
		filter: brightness(0.5);
	}

	.zoom-window .zoombox {
		position: absolute;
		border: 2px solid white;
		outline: 2px solid black;
		backdrop-filter: brightness(2);
		transition: all 0.1s;
		z-index: 10;
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
		align-items: center;
	}

	.boxes li:not(.boxes-list-hint) {
		padding: 0.5em 1em;
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
