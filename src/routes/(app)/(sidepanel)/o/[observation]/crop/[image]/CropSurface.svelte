<script lang="ts">
	import type { SelectedBox } from './+page.svelte';

	import { page } from '$app/state';
	import { toTopLeftCoords } from '$lib/BoundingBoxes.svelte.js';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import { Gestures } from '$lib/touch/gestures.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { mapValues, overrideStyle, pick } from '$lib/utils.js';

	import { focusedImage, boundingBoxes as getBoundingBoxes, zoom } from './+page.svelte';
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

	function willPanWithMouse(e: Pick<PointerEvent, 'button'>) {
		if (activeTool().name === 'Main') return true;
		if (e.button === 1) return true;
		return false;
	}

	// Disable chrome swipe-to-next/prev page
	$effect(overrideStyle('html, body', 'overscroll-behavior-x', 'none'));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="crop-surface"
	{@attach (node) => {
		new Gestures(node, {
			// TODO: disabled cuz it triggers when grabbing a cropbox to move it around
			// ondoubletap({ fingercount }) {
			// 	if (fingercount === 2) {
			// 		undo.pop();
			// 	}

			// 	if (fingercount === 3) {
			// 		undo.rewind();
			// 	}
			// },
			onpinch(event) {
				if (!imageElement) return;

				zoom.update(imageElement, { via: 'pinch', event });
			},
			onpan(event) {
				if (!imageElement) return;

				switch (event.kind) {
					case 'panstart':
						return zoom.startPanning(event.origin);
					case 'panmove':
						return zoom.pan(event.destination);
					case 'panend':
						return zoom.stopPanning();
				}
			},
		});
	}}
	// The 3 next attributes handle panning via click&drag
	onpointerdown={async (e) => {
		// Pan on mousewhell button hold or hand tool
		if (!willPanWithMouse(e)) return;

		// Hide autoscroll indicator on Firefox
		e.preventDefault();

		zoom.startPanning(e);
	}}
	onpointerup={async (e) => {
		// Pan on mousewheel button release or hand tool
		if (!willPanWithMouse(e)) return;
		zoom.stopPanning();
	}}
	onpointermove={async (e) => {
		zoom.pan(e);
	}}
	// Handles zoom via mousewheel
	onwheel={(event) => {
		event.preventDefault();
		if (!imageElement) return;

		zoom.update(imageElement, { via: 'wheel', event });
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
	{#if imageElement && fileId}
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
					selectedBox: () => selectedBox,
				})}
			oncreate={async (box) =>
				onCropChange({
					imageId: null,
					newBoundingBox: box,
					showConfirmedOverlay,
					selectedBox: () => selectedBox,
				})}
		/>
	{/if}
</div>

<style>
	.crop-surface {
		overflow: hidden;
		position: relative;
		user-select: none;
		touch-action: none;
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
