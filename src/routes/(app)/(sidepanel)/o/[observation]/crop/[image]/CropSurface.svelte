<script lang="ts">
	import type { SelectedBox } from './+page.svelte';

	import { page } from '$app/state';
	import { toTopLeftCoords } from '$lib/BoundingBoxes.svelte.js';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { clamp, mapValues, overrideStyle, pick, sign } from '$lib/utils.js';

	import {
		focusedImage,
		boundingBoxes as getBoundingBoxes,
		zoom,
		zoomSpeed,
	} from './+page.svelte';
	import { onCropChange } from './actions.svelte.js';
	import DraggableBoundingBox from './DraggableBoundingBox.svelte';
	import { activeTool } from './Toolbar.svelte';

	interface Props {
		imageIsLoading: boolean;
		selectedBox: SelectedBox;
		showConfirmedOverlay: () => Promise<void>;
	}

	let { imageIsLoading = $bindable(true), selectedBox, showConfirmedOverlay }: Props = $props();

	const fileId = $derived(page.params.image);
	const imageSrc = $derived(uiState.getPreviewURL(fileId));
	const boundingBoxes = $derived(getBoundingBoxes());
	const focusedImageId = $derived(focusedImage()?.id);

	let imageElement = $state<HTMLImageElement>();

	// Disable chrome swipe-to-next/prev page
	$effect(overrideStyle('html, body', 'overscroll-behavior-x', 'none'));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="crop-surface"
	// The 3 next attributes handle panning only
	onpointerdown={async (e) => {
		// Pan on mousewhell button hold or hand tool
		if (activeTool().name !== 'Main' && e.button !== 1) return;

		// Hide autoscroll indicator on Firefox
		e.preventDefault();

		zoom.panning = true;
		zoom.panStart = {
			x: e.clientX,
			y: e.clientY,
			zoomOrigin: $state.snapshot(zoom.origin),
		};
	}}
	onpointerup={async ({ button }) => {
		// Pan on mousewheel button release or hand tool
		if (activeTool().name !== 'Main' && button !== 1) return;
		zoom.panning = false;
	}}
	onpointermove={async ({ clientX, clientY }) => {
		if (!zoom.panning) return;

		zoom.origin.x = zoom.panStart.zoomOrigin.x + (clientX - zoom.panStart.x);
		zoom.origin.y = zoom.panStart.zoomOrigin.y + (clientY - zoom.panStart.y);
	}}
	// Handles zoom
	onwheel={async (e) => {
		e.preventDefault();
		if (!imageElement) return;

		// Most logic is thanks to https://stackoverflow.com/a/70251437
		let imageBounds = imageElement.getBoundingClientRect();
		let x = (e.clientX - imageBounds.x) / zoom.scale;
		let y = (e.clientY - imageBounds.y) / zoom.scale;

		zoom.scale = clamp(1, zoom.scale - sign(e.deltaY) * 2 * zoomSpeed(), 10);

		if (zoom.scale > 1) {
			zoom.origin.x += sign(e.deltaY) * zoomSpeed() * (x * 2 - imageElement.offsetWidth);
			zoom.origin.y += sign(e.deltaY) * zoomSpeed() * (y * 2 - imageElement.offsetHeight);
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
		pw-testid="crop-subject-image"
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
			{...activeTool()}
			{imageElement}
			{zoom}
			imageFileID={fileId}
			boundingBoxes={mapValues(
				focusedImageId && focusedImageId in boundingBoxes
					? pick(boundingBoxes, focusedImageId)
					: boundingBoxes,
				toTopLeftCoords
			)}
			disabled={zoom.panning}
			cursor={zoom.panning
				? activeTool().name === 'Main'
					? 'grabbing'
					: 'move'
				: activeTool().cursor}
			onchange={async (imageId, box) =>
				onCropChange({
					imageId: imageId,
					newBoundingBox: box,
					showConfirmedOverlay,
					selectedBox,
				})}
			oncreate={async (box) =>
				onCropChange({
					imageId: null,
					newBoundingBox: box,
					showConfirmedOverlay,
					selectedBox,
				})}
		/>
	{/if}
</div>

<style>
	.crop-surface {
		overflow: hidden;
		position: relative;
		user-select: none;
		width: 100%;
		height: 100%;
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

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>
