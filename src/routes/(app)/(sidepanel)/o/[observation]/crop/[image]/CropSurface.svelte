<script lang="ts">
	import type { SelectedBox } from './+page.svelte';
	import type { Snippet } from 'svelte';

	import { toTopLeftCoords } from '$lib/BoundingBoxes.svelte.js';
	import { Gestures } from '$lib/touch/gestures.svelte.js';
	import { mapValues, overrideStyle, pick, switchValue } from '$lib/utils.js';

	import {
		focusedImage,
		boundingBoxes as getBoundingBoxes,
		getHideAll,
		zoom,
	} from './+page.svelte';
	import { onCropChange } from './actions.svelte.js';
	import DraggableBoundingBox from './DraggableBoundingBox.svelte';
	import { activeTool } from './Toolbar.svelte';
	import ZoomableMarks from './ZoomableMarks.svelte';

	interface Props {
		selectedBox: SelectedBox;
		showConfirmedOverlay: () => Promise<void>;
		imageIsLoading: boolean;
		/** Where to save bounding boxes & from which file to create new Image/Sound objects */
		fileId: string;
		/** Image source */
		imageSrc: string | undefined;
		fit: 'contain' | 'cover' | 'fill';
		/** Lock zoom along one axis, and along the other axis when doing ctrl+zoom */
		zoomlock?: 'x' | 'y';
		/** Extra content. Position elements in absolute, with percent values for top/left/bottom/right */
		extraMarks: Snippet;
		/** Invert colors for the subject image */
		invertColors?: boolean;
		/** Bindable, read-only. Current position of cursor in normalized values. Null if cursor is not hovering over the area */
		cursor?: null | { x: number; y: number };
	}

	let {
		imageIsLoading = $bindable(true),
		selectedBox,
		showConfirmedOverlay,
		fileId,
		imageSrc,
		fit: subjectFitMode,
		zoomlock: defaultZoomlock,
		extraMarks,
		invertColors,
		cursor = $bindable(null),
	}: Props = $props();

	let zoomlock = $derived(defaultZoomlock);

	$effect(() => {
		if (zoomlock) zoom.lock(zoomlock);
		return () => zoom.releaseLock();
	});

	const boundingBoxes = $derived(getBoundingBoxes());
	const focusedImageId = $derived(focusedImage()?.id);
	const hidingAll = $derived(getHideAll());

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
	style:--crop-surface-fit={subjectFitMode}
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

		if (defaultZoomlock) {
			// FIXME: switch zoomlocks is weird
			// surely because zoom.scale needs to be separated into .x and .y
			// try to do a Adobe Audition-like zoom
			zoomlock = event.ctrlKey
				? switchValue(defaultZoomlock, { x: 'y', y: 'x' })
				: defaultZoomlock;

			zoom.lock(zoomlock);
		}

		zoom.update(imageElement, { via: 'wheel', event });
	}}
>
	<img
		pw-testid="crop-subject-image"
		src={imageSrc}
		alt=""
		bind:this={imageElement}
		style:transform={zoom.cssTransforms()}
		style:filter={invertColors ? 'invert(1)' : undefined}
		onload={() => {
			imageIsLoading = false;
		}}
	/>
	{#if imageElement && fileId && !imageIsLoading}
		<ZoomableMarks
			source={imageElement}
			{zoom}
			fit={subjectFitMode}
			children={extraMarks}
		/>

		<DraggableBoundingBox
			{...activeTool()}
			{imageElement}
			{zoom}
			{subjectFitMode}
			imageFileID={fileId}
			boundingBoxes={mapValues(
				hidingAll
					? []
					: focusedImageId && focusedImageId in boundingBoxes
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
		overflow: clip;
		position: relative;
		user-select: none;
		touch-action: none;
		width: 100%;
		height: 100%;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: var(--crop-surface-fit, contain);
	}
</style>
