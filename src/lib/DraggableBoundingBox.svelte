<script lang="ts">
	import type { ZoomState } from './DraggableBoundingBox.svelte.js';

	import { watch } from 'runed';
	import { tick } from 'svelte';

	import { page } from '$app/state';

	import { coordsScaler, withinBoundingBox } from './BoundingBoxes.svelte.js';
	import { fittedImageRect, NewBoundingBox } from './DraggableBoundingBox.svelte.js';
	import { imageIdToFileId } from './images.js';
	import { isDebugMode } from './settings.svelte.js';
	import { Fingers } from './touch/fingers.svelte.js';
	import { mapValues } from './utils.js';

	interface Rect {
		x: number;
		y: number;
		width: number;
		height: number;
	}

	interface Props {
		boundingBoxes: Record<string, Rect>;
		imageElement: HTMLImageElement;
		// eslint-disable-next-line no-unused-vars
		onchange: (imageId: string, box: Rect) => void;
		// eslint-disable-next-line no-unused-vars
		oncreate: (box: Rect) => Promise<string | null> | string | null;
		transformable: boolean;
		cursor?: string;
		createMode: 'clickanddrag' | '2point' | '4point' | 'off';
		movable: boolean;
		disabled?: boolean;
		zoom: ZoomState;
		imageFileID?: string;
	}

	let {
		boundingBoxes: boundingBoxesInitial,
		cursor,
		imageElement,
		onchange,
		oncreate,
		transformable,
		disabled = false,
		movable,
		createMode,
		zoom,
		imageFileID,
	}: Props = $props();

	// Using a writable $derived here causes the state to not update until onmouseup, idk why
	let boundingBoxes = $state(boundingBoxesInitial);
	watch(
		() => boundingBoxesInitial,
		(newBoxes) => {
			boundingBoxes = newBoxes;
		}
	);

	let clientWidth = $state(imageElement.clientWidth);
	let clientHeight = $state(imageElement.clientHeight);
	let clientLeft = $state(imageElement.clientLeft);
	let clientTop = $state(imageElement.clientTop);
	let naturalWidth = $state(imageElement.naturalWidth);
	let naturalHeight = $state(imageElement.naturalHeight);

	/**
	 * Number of fingers we're currently holding down.
	 * One day we'll https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent/touches
	 * on Safari, one day…
	 */
	const fingers = new Fingers();

	let changeAreaRef = $state<HTMLDivElement>();

	const refreshImageRect = async () => {
		if (!imageElement) return;
		({ clientWidth, clientHeight, clientLeft, clientTop, naturalWidth, naturalHeight } =
			imageElement);
		await tick();
	};

	$effect(() => {
		imageElement.addEventListener('load', refreshImageRect);

		const resizeObserver = new ResizeObserver(async (_, observer) => {
			if (!imageElement) {
				observer.disconnect();
				return;
			}

			await refreshImageRect();
		});

		const mutationObserver = new MutationObserver(async (_, observer) => {
			if (!imageElement) {
				observer.disconnect();
				return;
			}

			await refreshImageRect();
		});

		resizeObserver.observe(imageElement);
		mutationObserver.observe(imageElement, {
			attributes: true,
			attributeFilter: ['src'],
		});

		return () => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	});

	const imageRect = $derived(
		fittedImageRect(
			{ clientHeight, clientWidth, naturalHeight, naturalWidth, clientTop, clientLeft },
			zoom
		)
	);

	const toPixel = $derived(
		coordsScaler({
			x: imageRect.width,
			y: imageRect.height,
		})
	);

	const fromPixel = $derived(
		coordsScaler({
			x: 1 / imageRect.width,
			y: 1 / imageRect.height,
		})
	);

	// eslint-disable-next-line no-unused-vars
	const boundingBoxesPixels = $derived(mapValues(boundingBoxes, toPixel as (box: Rect) => Rect));

	let creatingBoundingBox = $state(false);
	let newBoundingBox = $derived(
		new NewBoundingBox({
			limits: { x: 0, y: 0, width: imageRect.width, height: imageRect.height },
		})
	);
	$effect(() => newBoundingBox.setCreateMode(createMode));

	let draggingImageId = $state('');
	let draggingCorner = $state({
		topleft: false,
		topright: false,
		bottomleft: false,
		bottomright: false,
		get left() {
			return this.topleft && this.bottomleft;
		},
		set left(value) {
			this.topleft = value;
			this.bottomleft = value;
		},
		get right() {
			return this.topright && this.bottomright;
		},
		set right(value) {
			this.topright = value;
			this.bottomright = value;
		},
		get top() {
			return this.topleft && this.topright;
		},
		set top(value) {
			this.topleft = value;
			this.topright = value;
		},
		get bottom() {
			return this.bottomleft && this.bottomright;
		},
		set bottom(value) {
			this.bottomleft = value;
			this.bottomright = value;
		},
		setAll(value: boolean) {
			this.topleft = value;
			this.topright = value;
			this.bottomleft = value;
			this.bottomright = value;
		},
		isAll(value: boolean) {
			return (
				this.topleft === value &&
				this.topright === value &&
				this.bottomleft === value &&
				this.bottomright === value
			);
		},
	});

	$effect(() => {
		if (!fingers.any) {
			draggingCorner.setAll(false);
			creatingBoundingBox = false;
			newBoundingBox.reset();
		}
	});
</script>

<svelte:window
	// Handles cancellation when dragging out of bounds
	onpointermove={({ target }) => {
		if (!(target instanceof Element)) return;
		if (!creatingBoundingBox) return;
		if (createMode !== 'clickanddrag') return;

		if (target.closest('.change-area') !== changeAreaRef) {
			// Bail out if we were dragging a new bounding box, but we left the image (change area)
			console.warn('Dragging has gone outside change area, bailing out. Target is', target);
			fingers.reset();
			draggingCorner.setAll(false);
			creatingBoundingBox = false;
			newBoundingBox.reset();
		}
	}}
/>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={changeAreaRef}
	class="change-area"
	class:debug={isDebugMode()}
	class:precise={!movable && !transformable}
	style:left="{imageRect.x}px"
	style:top="{imageRect.y}px"
	style:width="{imageRect.width}px"
	style:height="{imageRect.height}px"
	style:cursor
	onpointerup={async ({ button }) => {
		if (disabled) return;
		// Don't react to mousewheel clicks, those pan around
		if (button === 1) return;

		draggingCorner.setAll(false);

		if (creatingBoundingBox && newBoundingBox.ready) {
			const relativeBoundingBox = fromPixel(newBoundingBox.rect());
			const imageId = await oncreate?.(relativeBoundingBox);
			if (imageId) boundingBoxes[imageId] = relativeBoundingBox;
			newBoundingBox.reset();
			creatingBoundingBox = false;
		} else {
			onchange?.(draggingImageId, boundingBoxes[draggingImageId]);
		}
		draggingImageId = '';
	}}
	onpointerdown={({ clientX, clientY, currentTarget, button }) => {
		if (disabled) return;
		// Don't react to mousewheel clicks, those pan around
		if (button === 1) return;

		if (createMode === 'off') return;
		// Using offset{X,Y} is wrong when pointer is inside the boundingbox, see https://stackoverflow.com/a/35364901
		const { left, top } = currentTarget.getBoundingClientRect();
		const [x, y] = [clientX - left, clientY - top];
		// Don't try registering new bounding box points if we're about to move/transform the existing one
		if (
			(movable || transformable) &&
			Object.values(boundingBoxesPixels).some((box) => withinBoundingBox(box, { x, y }))
		)
			return;
		creatingBoundingBox = true;
		newBoundingBox.registerPoint(x, y);
	}}
	// Handles starting an interaction
	onpointermove={({ movementX, movementY, button }) => {
		// Multi-finger gestures are not handled here
		// but rather at CropSurface, since it's for zooming & panning around
		if (fingers.multiple) return;
		if (disabled) return;
		// Don't react to mousewheel clicks, those pan around
		if (button === 1) return;

		const { x: dx, y: dy } = fromPixel({ x: movementX, y: movementY, w: 0, h: 0 });

		if (creatingBoundingBox && createMode === 'clickanddrag') {
			newBoundingBox.registerMovement(movementX, movementY);
			return;
		}

		const boundingBox = boundingBoxes[draggingImageId];

		if (draggingCorner.isAll(true)) {
			boundingBox.x += dx;
			boundingBox.y += dy;
			return;
		}

		if (draggingCorner.left) {
			boundingBox.x += dx;
			boundingBox.width -= dx;
			return;
		}

		if (draggingCorner.right) {
			boundingBox.width += dx;
			return;
		}

		if (draggingCorner.top) {
			boundingBox.y += dy;
			boundingBox.height -= dy;
			return;
		}

		if (draggingCorner.bottom) {
			boundingBox.height += dy;
			return;
		}

		if (draggingCorner.topleft) {
			boundingBox.x += dx;
			boundingBox.y += dy;
			boundingBox.width -= dx;
			boundingBox.height -= dy;
		}

		if (draggingCorner.topright) {
			boundingBox.y += dy;
			boundingBox.width += dx;
			boundingBox.height -= dy;
		}

		if (draggingCorner.bottomleft) {
			boundingBox.x += dx;
			boundingBox.width -= dx;
			boundingBox.height += dy;
		}

		if (draggingCorner.bottomright) {
			boundingBox.width += dx;
			boundingBox.height += dy;
		}
	}}
>
	{#if isDebugMode()}
		<code class="debug" style:color="red">
			{fingers.count} fingers <br />
			{#snippet point(x: number, y: number)}
				{Math.round(x)} {Math.round(y)}
			{/snippet}
			{#snippet bb({ x, y, width, height }: Rect)}
				({@render point(x, y)}) × [{@render point(width, height)}]
			{/snippet}
			{#each Object.entries(boundingBoxesPixels) as [imageId, box] (imageId)}
				@{imageId.replace(`${page.params.image}_`, '')} {@render bb(box)}<br />
			{/each}
			create {newBoundingBox.ready ? 'ready ' : ''}
			{#if createMode === 'clickanddrag'}
				{@render bb(newBoundingBox.clickanddrag)}
				<br /> &nbsp;&nbsp;&nbsp;dir {@render point(
					newBoundingBox.clickanddrag.dragDirection.x,
					newBoundingBox.clickanddrag.dragDirection.y
				)}
			{:else if createMode === 'off'}
				off
			{:else}
				<br />
				{#each newBoundingBox.points as { x, y }, i (i)}
					#{i} {@render point(x, y)} <br />
				{/each}
			{/if}
		</code>
	{/if}
	{#if createMode === '2point' || createMode === '4point'}
		{#each newBoundingBox.points as { x, y }, i (i)}
			{#if x !== 0 && y !== 0}
				<div class="boundingbox-point new" style:left="{x}px" style:top="{y}px"></div>
			{/if}
		{/each}
	{:else if creatingBoundingBox && createMode === 'clickanddrag'}
		<div
			class="boundingbox new"
			style:left="{newBoundingBox.x}px"
			style:top="{newBoundingBox.y}px"
			style:width="{newBoundingBox.width}px"
			style:height="{newBoundingBox.height}px"
		></div>
	{/if}
	{#each Object.entries(boundingBoxesPixels).filter(([imageId]) => imageIdToFileId(imageId) === imageFileID) as [imageId, box] (imageId)}
		<div
			class="boundingbox"
			data-image={imageId}
			class:movable
			class:precise={!movable && !transformable}
			style:left="{box.x}px"
			style:top="{box.y}px"
			style:width="{box.width}px"
			style:height="{box.height}px"
			onpointerdown={() => {
				if (disabled) return;

				draggingImageId = imageId;
				if (movable) draggingCorner.setAll(true);
			}}
		>
			{#snippet side(
				/** @type {'top'|'bottom'|'left'|'right'} */ position:
					'top' | 'bottom' | 'left' | 'right'
			)}
				<div
					class="side {position}"
					class:draggable={transformable}
					class:dragging={draggingCorner[position] && draggingImageId === imageId}
					onpointerdown={(e) => {
						if (disabled) return;
						if (!transformable) return;
						// Don't react to mousewheel clicks, those pan around
						if (e.button === 1) return;

						draggingImageId = imageId;
						draggingCorner[position] = true;
						e.stopPropagation();
						fingers.register(e);
					}}
				></div>
			{/snippet}
			{@render side('top')}
			{@render side('bottom')}
			{@render side('left')}
			{@render side('right')}

			{#snippet corner(
				/** @type {`${'top'|'bottom'}${'left'|'right'}`} */ position: `${'top' | 'bottom'}${'left' | 'right'}`
			)}
				<div
					class="corner {position}"
					class:draggable={transformable}
					class:dragging={draggingCorner[position] && draggingImageId === imageId}
					onpointerdown={(e) => {
						if (disabled) return;
						if (!transformable) return;
						// Don't react to mousewheel clicks, those pan around
						if (e.button === 1) return;

						draggingImageId = imageId;
						draggingCorner[position] = true;
						e.stopPropagation();
						fingers.register(e);
					}}
				></div>
			{/snippet}
			{@render corner('topleft')}
			{@render corner('topright')}
			{@render corner('bottomleft')}
			{@render corner('bottomright')}
		</div>
	{/each}
</div>

<style>
	.change-area {
		position: absolute;
		/* After some time, dragging becomes a scroll touch-action by default */
		/* See https://stackoverflow.com/questions/70482399/pointerevent-stops-firing-after-a-short-time */
		touch-action: none;
	}

	.change-area.debug {
		outline: 5px dashed red;

		.debug {
			background: rgba(0 0 0 / 0.66);
		}
	}

	.boundingbox {
		position: absolute;
		--thick: 5px;
	}

	.boundingbox.precise :is(.side, .corner) {
		display: none;
	}

	.boundingbox.precise {
		--thick: 2px;
		border: var(--thick) solid black;
		outline: var(--thick) solid white;
	}

	.boundingbox.movable:not(.new) {
		cursor: move;
	}

	.boundingbox.new {
		background: color-mix(in srgb, var(--bg-primary-translucent) 30%, transparent);
		border: var(--thick) dashed var(--bg-primary);
	}

	.boundingbox:hover:not(:has(:hover)):not(:has(.dragging)) .corner.draggable,
	.boundingbox .side.draggable.left:hover:not(.dragging) ~ .corner:is(.bottomleft, .topleft),
	.boundingbox .side.draggable.right:hover:not(.dragging) ~ .corner:is(.topright, .bottomright),
	.boundingbox .side.draggable.top:hover:not(.dragging) ~ .corner:is(.topleft, .topright),
	.boundingbox
		.side.draggable.bottom:hover:not(.dragging)
		~ .corner:is(.bottomleft, .bottomright) {
		scale: 130%;
		background: var(--bg-primary-translucent);
	}

	.side {
		position: absolute;
		background: black;
		border-style: solid;
		border-width: 0;
		border-color: white;
	}

	.side.left,
	.side.right {
		top: 0;
		bottom: 0;
		width: calc(var(--thick) * 2);
	}

	.side.draggable:is(.left, .right) {
		cursor: ew-resize;
	}

	.side.left {
		left: calc(-1 * var(--thick));
		border-right-width: var(--thick);
	}

	.side.right {
		right: calc(-1 * var(--thick));
		border-left-width: var(--thick);
	}

	.side.top,
	.side.bottom {
		left: 0;
		right: 0;
		height: calc(var(--thick) * 2);
	}

	.side.draggable:is(.top, .bottom) {
		cursor: ns-resize;
	}

	.side.top {
		top: calc(-1 * var(--thick));
		border-bottom-width: var(--thick);
	}

	.side.bottom {
		bottom: calc(-1 * var(--thick));
		border-top-width: var(--thick);
	}

	.corner,
	.boundingbox-point {
		color-scheme: light;
		position: absolute;
		width: 1.5rem;
		height: 1.5rem;
		background: white;
		border: 3px solid black;
		transition: scale 80ms;
	}

	.boundingbox-point {
		translate: -50% -50%;
		background: var(--bg-primary);
	}

	.change-area.precise .boundingbox-point {
		border: none;
		width: 10px;
		height: 10px;
		border-radius: 10000px;
		background: white;
		mix-blend-mode: difference;
	}

	.corner.draggable:hover {
		background: var(--bg-primary-translucent);
		scale: 130%;
	}

	.corner.dragging {
		scale: 110%;
		background: var(--bg-primary);
	}

	.topleft {
		top: -0.75rem;
		left: -0.75rem;
	}
	.topleft.draggable {
		cursor: nwse-resize;
	}

	.topright {
		top: -0.75rem;
		right: -0.75rem;
	}
	.topright.draggable {
		cursor: nesw-resize;
	}

	.bottomleft {
		bottom: -0.75rem;
		left: -0.75rem;
	}
	.bottomleft.draggable {
		cursor: nesw-resize;
	}

	.bottomright {
		bottom: -0.75rem;
		right: -0.75rem;
	}
	.bottomright.draggable {
		cursor: nwse-resize;
	}
</style>
