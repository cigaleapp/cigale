<script lang="ts" module>
	import type { PageData } from './$types.js';

	import * as idb from '$lib/idb.svelte.js';

	export interface SelectedBox {
		imageId: string | null;
		manual: boolean;
	}

	export const zoom = new Zoom();

	const { sortedFileIds } = $derived(page.data as PageData);
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
		if (!fileId) return;
		const idx = sortedFileIds.indexOf(fileId) - 1;
		if (idx < 0) return;
		return sortedFileIds.at(idx);
	});
	const nextFileId = $derived.by(() => {
		if (!fileId) return;
		const idx = sortedFileIds.indexOf(fileId) + 1;
		if (idx >= sortedFileIds.length) return;
		return sortedFileIds.at(idx);
	});

	const nextUnconfirmedImageId = $derived.by(() => {
		if (!fileId) return;
		const forward = sortedFileIds
			.slice(sortedFileIds.indexOf(fileId) + 1)
			.filter((fileId) => !hasConfirmedCrop(fileId))
			.at(0);

		if (forward) return forward;

		// Loop around.
		return sortedFileIds.find((fileId) => !hasConfirmedCrop(fileId));
	});

	export async function goToNextUnconfirmedFile({ or: fallbackRoute }: { or: Pathname }) {
		if (nextUnconfirmedImageId) {
			await goToFile(nextUnconfirmedImageId);
		} else {
			await goto(fallbackRoute);
		}
	}

	export function adjacentFileIds() {
		return { prevFileId, nextFileId };
	}
</script>

<script lang="ts">
	import type { Pathname } from '$app/types';
	import type * as DB from '$lib/database.js';

	import { watch } from 'runed';

	import IconDelete from '~icons/ri/delete-bin-line';
	import IconReset from '~icons/ri/reset-left-fill';
	import { page } from '$app/state';
	import BottomDrawer from '$lib/BottomDrawer.svelte';
	import { plural } from '$lib/i18n.js';
	import { imageIdToFileId, imagesOfImageFile } from '$lib/images.js';
	import { assertIs } from '$lib/metadata/index.js';
	import { IsMobile } from '$lib/mobile.svelte.js';
	import { goto } from '$lib/paths.js';
	import { seo } from '$lib/seo.svelte';
	import { getSettings, isDebugMode, toggleSetting } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';

	import TopbarExtras from '../../TopbarExtras.svelte';
	import {
		changeAllConfirmedStatuses,
		deleteImageFileAndGotoNext,
		revertAll,
		setupUndoActions,
	} from './actions.svelte.js';
	import Boxes from './Boxes.svelte';
	import CropSurface from './CropSurface.svelte';
	import { setupKeyboardShortcuts } from './keyboard.svelte.js';
	import Toolbar from './Toolbar.svelte';
	import { Zoom } from './zoom.svelte.js';

	const mobile = new IsMobile();

	const firstImage = $derived(images.at(0));

	// Controls visibility of the checkmark little centered overlay
	let showConfirmedOverlay = $state(async () => {});

	let selectedBox = $state<SelectedBox>({
		imageId: null,
		manual: false,
	});

	const boxesCount = $derived(Object.keys(boundingBoxes()).length);

	seo({ title: `Recadrer ${firstImage?.filename ?? '...'}` });

	setupUndoActions({
		selectedBox: () => selectedBox,
		showConfirmedOverlay: async () => showConfirmedOverlay(),
	});

	setupKeyboardShortcuts({
		selectedBox: () => selectedBox,
		showConfirmedOverlay: async () => showConfirmedOverlay(),
	});

	// TODO: remove, see #1827
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
			if (oldFileId) uiState.cropperZoomStates.set(oldFileId, zoom.capture());

			const newState = newFileId && uiState.cropperZoomStates.get(newFileId);
			if (newState) {
				zoom.restore(newState);
			} else {
				zoom.reset();
			}
		}
	);
</script>

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
		current: sortedFileIds.indexOf(fileId ?? '') + 1,
		total: sortedFileIds.length,
		async previous() {
			await goToFile(prevFileId);
		},
		async next() {
			await goToFile(nextFileId);
		},
		async nextUnconfirmed() {
			await goToNextUnconfirmedFile({ or: '/classify/' });
		},
	}}
	moreMenu={[
		{
			label: '',
			items: [
				{
					type: 'clickable',
					label: "Boîtes d'origine",
					icon: IconReset,
					data: {},
					async onclick() {
						await revertAll();
					},
				},
				{
					type: 'clickable',
					label: "Supprimer l'image",
					data: {},
					danger: true,
					icon: IconDelete,
					async onclick() {
						await deleteImageFileAndGotoNext();
					},
				},
				{
					type: 'selectable',
					key: 'debugmode',
					label: 'Mode debug',
					data: {},
					selected: isDebugMode(),
					closeOnSelect: false,
					async onclick() {
						await toggleSetting('debugMode');
					},
				},
			],
		},
	]}
/>

<div class="layout">
	<main class="crop-surface">
		<!-- TODO: make CropSurface handle its image element resize instead -->
		{#key getSettings().cropperSidebarCollapsed}
			<CropSurface bind:imageIsLoading {showConfirmedOverlay} {selectedBox} />
		{/key}
	</main>

	<aside class="toolbar">
		<Toolbar />
	</aside>

	{#if !mobile.current}
		<aside class="info" class:collapsed={getSettings().cropperSidebarCollapsed}>
			<Boxes bind:selectedBox />
		</aside>
	{:else}
		<BottomDrawer
			--drawer-outer-padding="0"
			trigger-from-bottombar={plural(boxesCount, [
				'# boîte de recadrage',
				'# boîtes de recadrages',
			])}
		>
			<Boxes bind:selectedBox />
		</BottomDrawer>
	{/if}
</div>

<style>
	.layout {
		display: flex;
		height: 100%;
		width: 100lvw;
		overflow: hidden;

		@media (max-width: 600px) {
			flex-direction: column;
		}
	}

	.crop-surface {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.info {
		transition: all 150ms ease;
		width: 33vw;
		max-width: 600px;
		min-width: 450px;
		overflow: hidden;

		&.collapsed {
			min-width: 0;
			max-width: 0;
		}
	}
</style>
