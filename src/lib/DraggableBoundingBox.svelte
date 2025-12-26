<script>
	import { watch } from 'runed';
	import { tick } from 'svelte';

	import { coordsScaler, withinBoundingBox } from './BoundingBoxes.svelte.js';
	import { fittedImageRect, NewBoundingBox } from './DraggableBoundingBox.svelte.js';
	import { imageIdToFileId } from './images.js';
	import { isDebugMode } from './settings.svelte.js';
	import { mapValues } from './utils.js';

	/**
	 * @import { ZoomState } from './DraggableBoundingBox.svelte.js';
	 */

	/**
	 * @typedef Rect
	 * @type {object}
	 * @property {number} x
	 * @property {number} y
	 * @property {number} width
	 * @property {number} height
	 */

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Record<string, Rect>} boundingBoxes maps image IDs to bounding boxes with relative, top-left coordinates
	 * @property {HTMLImageElement} imageElement
	 * @property {(imageId: string, box: Rect) => void} onchange - called when a bounding box is changed. The imageId is the ID of the associated Image
	 * @property {(box: Rect) => Promise<string|null> | string|null} oncreate - called when a new bounding box is created. Must return the ID of the new associated Image
	 * @property {boolean} transformable if true, the bounding boxes' sides or corners can be dragged
	 * @property {string} [cursor=unset] - CSS cursor to use when hovering over the change area
	 * @property {'clickanddrag'|'2point'|'4point'|'off'} createMode
	 * @property {boolean} movable if true, the bounding boxes can be moved by dragging in its inside
	 * @property {boolean} [disabled=false] - if true, the bounding boxes are inert. Useful while panning
	 * @property {ZoomState} zoom - current zoom&pan state
	 * @property {string} [imageFileID] only keep bounding boxes tied to images from this ImageFile
	 */

	/**  @type {Props} */
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
		imageFileID
	} = $props();

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
	 * @type {HTMLDivElement}
	 */
	let changeAreaRef = $state();

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
			attributeFilter: ['src']
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
			y: imageRect.height
		})
	);

	const fromPixel = $derived(
		coordsScaler({
			x: 1 / imageRect.width,
			y: 1 / imageRect.height
		})
	);

	const boundingBoxesPixels = $derived(mapValues(boundingBoxes, toPixel));

	let creatingBoundingBox = $state(false);
	let newBoundingBox = $derived(
		new NewBoundingBox({
			limits: { x: 0, y: 0, width: imageRect.width, height: imageRect.height }
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
		/** @param {boolean} value */
		setAll(value) {
			this.topleft = value;
			this.topright = value;
			this.bottomleft = value;
			this.bottomright = value;
		},
		/** @param {boolean} value  */
		isAll(value) {
			return (
				this.topleft === value &&
				this.topright === value &&
				this.bottomleft === value &&
				this.bottomright === value
			);
		}
	});
</script>

<svelte:window
	onmousemove={({ target }) => {
		if (!(target instanceof Element)) return;
		if (!creatingBoundingBox) return;
		if (createMode !== 'clickanddrag') return;

		if (target.closest('.change-area') !== changeAreaRef) {
			// Bail out if we were dragging a new bounding box, but we left the image (change area)
			console.warn('Dragging has gone outside change area, bailing out. Target is', target);
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
	onmouseup={async ({ button }) => {
		if (disabled) return;
		// React to left mouse button only
		if (button !== 0) return;

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
	onmousedown={({ clientX, clientY, currentTarget, button }) => {
		if (disabled) return;
		// React to left mouse button only
		if (button !== 0) return;

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
	onmousemove={({ movementX, movementY, button }) => {
		if (disabled) return;
		// React to left mouse button only
		if (button !== 0) return;

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
			{#snippet point(x, y)}
				{Math.round(x)} {Math.round(y)}
			{/snippet}
			{#snippet bb({ x, y, width, height })}
				({@render point(x, y)}) × [{@render point(width, height)}]
			{/snippet}
			bbs <br />
			{#each Object.entries(boundingBoxesPixels) as [imageId, box] (imageId)}
				@{imageId} {@render bb(box)}<br />
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
			onmousedown={({ button }) => {
				if (button !== 0) return;
				if (disabled) return;
				draggingImageId = imageId;
				if (movable) draggingCorner.setAll(true);
			}}
		>
			{#snippet side(/** @type {'top'|'bottom'|'left'|'right'} */ position)}
				<div
					class="side {position}"
					class:draggable={transformable}
					class:dragging={draggingCorner[position] && draggingImageId === imageId}
					onmousedown={(e) => {
						if (e.button !== 0) return;
						if (disabled) return;
						if (!transformable) return;
						draggingImageId = imageId;
						draggingCorner[position] = true;
						e.stopPropagation();
					}}
				></div>
			{/snippet}
			{@render side('top')}
			{@render side('bottom')}
			{@render side('left')}
			{@render side('right')}

			{#snippet corner(/** @type {`${'top'|'bottom'}${'left'|'right'}`} */ position)}
				<div
					class="corner {position}"
					class:draggable={transformable}
					class:dragging={draggingCorner[position] && draggingImageId === imageId}
					onmousedown={(e) => {
						if (e.button !== 0) return;
						if (disabled) return;
						if (!transformable) return;
						draggingImageId = imageId;
						draggingCorner[position] = true;
						e.stopPropagation();
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
	}

	.change-area.debug {
		outline: 5px dashed red;
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
