<script lang="ts" module>
	// import type {PageData} from './'
	import * as idb from '$lib/idb.svelte.js';

	export interface SelectedBox {
		imageId: string | null;
		manual: boolean;
	}

	export const zoom = $state({ ...INITIAL_ZOOM_STATE });

	export const zoomSpeed = () => zoom.scale * 0.1;

	const { sortedFileIds } = $derived<PageData>(page.data);
	const fileId = $derived(page.params.image);

	const images = $derived.by(() => {
		if (!fileId) return [];

		return imagesOfImageFile(
			fileId,
			idb.tables.Image.state.filter((img) => img.sessionId === uiState.currentSessionId)
		);
	});


	export function currentImages() {
		return images;
	}

	let focusedImageId = $derived.by(() => {
		if (!page.params.observation) return;

		const observation = idb.tables.Observation.getFromState(page.params.observation);
		return observation?.images.find((i) => imageIdToFileId(i) === fileId);
	});

	export function focusedImage() {
		if (!focusedImageId) return undefined;
		return idb.tables.Image.getFromState(focusedImageId);
	}

	export function setFocusedImage(imageId: string | null) {
		focusedImageId = imageId ?? undefined;
	}

	export function boundingBoxes() {
		return Object.fromEntries(
			images
				.map(({ id, metadata }) => [id, metadata[uiState.cropMetadataId]?.value])
				.filter(([, box]) => box !== undefined)
				.map(([id, box]) => [id, assertIs('boundingbox', box)])
		);
	}

	export function hasCrop(imageFileId: string | undefined) {
		if (!imageFileId) return false;

		return imagesOfImageFile(imageFileId).every(
			(image) => uiState.cropMetadataId in image.metadata
		);
	}

	export function hasConfirmedCrop(imageFileId: string | undefined) {
		if (!imageFileId) return false;

		return imagesOfImageFile(imageFileId).every(imageHasConfirmedCrop);
	}

	export function imageHasConfirmedCrop(image: DB.Image) {
		const value = uiState.cropMetadataValueOf(image);
		return value?.confirmed;
	}

	export async function goToFile(fileId: string | undefined) {
		if (!fileId) return;
		await goto('/(app)/(sidepanel)/o/[observation]/crop/[image]', {
			// Changing files might mean changing observations, so we can't keep the same
			observation: '_',
			image: fileId,
		});
	}

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

	export async function goToNextUnconfirmedFile() {
		if (!nextUnconfirmedImageId) return false;
		await goToFile(nextUnconfirmedImageId);
	}

	export function adjacentFileIds() {
		return { prevFileId, nextFileId };
	}
</script>

<script lang="ts">
	import type { CenteredBoundingBox } from '$lib/BoundingBoxes.svelte.js';
	import type * as DB from '$lib/database.js';
	import type { RuntimeValue } from '$lib/schemas/metadata';

	import * as dates from 'date-fns';
	import { watch } from 'runed';

	import IconFourPointCrop from '~icons/ri/apps-2-add-line';
	import IconUndo from '~icons/ri/arrow-go-back-fill';
	import IconRedo from '~icons/ri/arrow-go-forward-fill';
	import IconTwoPointCrop from '~icons/ri/crosshair-2-line';
	import IconFocus from '~icons/ri/crosshair-line';
	import IconDelete from '~icons/ri/delete-bin-line';
	import IconToolMove from '~icons/ri/drag-move-2-fill';
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
		toTopLeftCoords,
	} from '$lib/BoundingBoxes.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import DraggableBoundingBox from '$lib/DraggableBoundingBox.svelte';
	import { INITIAL_ZOOM_STATE } from '$lib/DraggableBoundingBox.svelte.js';
	import { percent } from '$lib/i18n';
	import { imageIdToFileId, imagesOfImageFile } from '$lib/images.js';
	import { assertIs } from '$lib/metadata/index.js';
	import MobileWIPOverlay from '$lib/MobileWIPOverlay.svelte';
	import { goto } from '$lib/paths.js';
	import { seo } from '$lib/seo.svelte';
	import { uiState } from '$lib/state.svelte';
	import { mapValues } from '$lib/utils';

	import TopbarExtras from '../../TopbarExtras.svelte';
	import { changeAllConfirmedStatuses, setupUndoActions } from './actions.svelte.js';
	import Boxes from './Boxes.svelte';
	import CropSurface from './CropSurface.svelte';
	import { setupKeyboardShortcuts } from './keyboard.svelte.ts';
	import Toolbar from './Toolbar.svelte';

	const { data, params } = $props();

	const firstImage = $derived(images.at(0));

	// Controls visibility of the checkmark little centered overlay
	let showConfirmedOverlay = $state(async () => {});

	let selectedBox = $state<SelectedBox>({
		imageId: null,
		manual: false,
	});

	seo({ title: `Recadrer ${firstImage?.filename ?? '...'}` });

	setupUndoActions({ selectedBox, showConfirmedOverlay });
	setupKeyboardShortcuts({ selectedBox });

	$effect(() => {
		uiState.imageOpenedInCropper = fileId;
	});

	// Scroll to selected box
	$effect(() => {
		if (!selectedBox.imageId) return;
		document.querySelector(`.boxes li.selected`)?.scrollIntoView({
			behavior: 'smooth',
			block: 'nearest',
			inline: 'nearest',
		});
	});

	let imageIsLoading = $state(true);

	watch(
		() => fileId,
		(newFileId, oldFileId) => {
			if (oldFileId) uiState.cropperZoomStates.set(oldFileId, $state.snapshot(zoom));

			const newZoom =
				$state.snapshot(uiState.cropperZoomStates.get(newFileId ?? '')) ??
				INITIAL_ZOOM_STATE;

			// We cant reassign to zoom since its an exported $state (so cannot declare it with `let` )
			for (const prop in newZoom) {
				zoom[prop] = newZoom[prop];
			}
		}
	);
</script>

<MobileWIPOverlay
	feature="Le recadrage"
	issue={1518}
	back={async () => {
		if (params.observation) {
			await goto('/(app)/(sidepanel)/o/[observation]/classify', params);
		} else {
			await goto('/crop/');
		}
	}}
/>

<TopbarExtras
	bind:flashConfirmedOverlay={showConfirmedOverlay}
	currentIsConfirmed={hasConfirmedCrop(fileId)}
	keyboardShortcutsCategory="cropping"
	labels={{
		item: 'Image',
		treated: 'Images recadrées',
		confirmed: 'Recadrages confirmés',
	}}
	progress={{
		treated: sortedFileIds.filter(hasCrop).length,
		confirmed: sortedFileIds.filter(hasConfirmedCrop).length,
		total: sortedFileIds.length,
		async mark(status) {
			await changeAllConfirmedStatuses(status === 'confirmed');
		},
	}}
	navigation={{
		current: sortedFileIds.indexOf(fileId) + 1,
		total: sortedFileIds.length,
		async previous() {
			await goToFile(prevFileId);
		},
		async next() {
			await goToFile(nextFileId);
		},
		async nextUnconfirmed() {
			(await goToNextUnconfirmedFile()) || goto('/(app)/(sidepanel)/classify');
		},
	}}
/>

<div class="layout">
	<div class="crop-surface">
		<CropSurface bind:imageIsLoading {showConfirmedOverlay} {selectedBox} />
	</div>

	<aside class="toolbar">
		<Toolbar />
	</aside>

	<aside class="info">
		<Boxes bind:selectedBox />
	</aside>
</div>

<style>
	.layout {
		display: flex;
		height: 100%;
		overflow: hidden;
	}

	.crop-surface {
		width: 100%;
		overflow: hidden;
	}
</style>
