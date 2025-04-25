<script>
	import { tick } from 'svelte';
	import { boundingBoxIsNonZero, coordsScaler, withinBoundingBox } from './BoundingBoxes.svelte';
	import { NewBoundingBox } from './DraggableBoundingBox.svelte.js';
	import { getSettings } from './settings.svelte';

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
	 * @property {Rect} boundingBox bounding box with relative, top-left coordinates
	 * @property {HTMLImageElement} imageElement
	 * @property {(box: Rect) => void} onchange
	 * @property {boolean} transformable if true, the bounding box's sides or corners can be dragged
	 * @property {'clickanddrag'|'2point'|'4point'|'off'} createMode
	 * @property {boolean} movable if true, the bounding box can be moved by dragging in its inside
	 */

	/**  @type {Props} */
	let {
		boundingBox: boudingBoxInitial,
		imageElement,
		onchange,
		transformable,
		movable,
		createMode
	} = $props();

	let boundingBox = $state(boudingBoxInitial);
	$effect(() => {
		boundingBox = boudingBoxInitial;
	});

	let clientWidth = $state(imageElement.clientWidth);
	let clientHeight = $state(imageElement.clientHeight);
	let clientLeft = $state(imageElement.clientLeft);
	let clientTop = $state(imageElement.clientTop);
	let naturalWidth = $state(imageElement.naturalWidth);
	let naturalHeight = $state(imageElement.naturalHeight);

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

		mutationObserver.observe(imageElement, {
			attributes: true,
			attributeFilter: ['src']
		});

		return () => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	});

	const imageRect = $derived.by(() => {
		// The image has object-fit: contain, so the boundingClientRect is not the same as the actual, displayed image. We use both natural{Width,Height} and client{Width,Height} to calculate the displayed image size

		const naturalRatio = naturalWidth / naturalHeight;
		const clientRatio = clientWidth / clientHeight;

		let width = 0,
			height = 0;
		if (naturalRatio < clientRatio) {
			width = clientHeight * naturalRatio;
			height = clientHeight;
		} else {
			height = clientWidth / naturalRatio;
			width = clientWidth;
		}

		return {
			x: clientLeft + (clientWidth - width) / 2,
			y: clientTop + (clientHeight - height) / 2,
			width,
			height
		};
	});

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

	const boudingBoxPixel = $derived(toPixel(boundingBox));

	let creatingBoundingBox = $state(false);
	let newBoundingBox = $state(new NewBoundingBox());
	$effect(() => newBoundingBox.setCreateMode(createMode));

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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="change-area"
	class:debug={getSettings().showTechnicalMetadata}
	class:precise={!movable && !transformable}
	style:left="{imageRect.x}px"
	style:top="{imageRect.y}px"
	style:width="{imageRect.width}px"
	style:height="{imageRect.height}px"
	style:cursor={boundingBoxIsNonZero(boundingBox) ? 'unset' : 'crosshair'}
	onmouseup={() => {
		draggingCorner.setAll(false);
		if (creatingBoundingBox && newBoundingBox.ready) {
			boundingBox = fromPixel(newBoundingBox.rect());
			onchange?.(boundingBox);
			newBoundingBox.reset();
			creatingBoundingBox = false;
		}
		if (createMode === 'clickanddrag') {
			onchange?.(boundingBox);
			creatingBoundingBox = false;
		}
	}}
	onmousedown={({ clientX, clientY, currentTarget }) => {
		if (createMode === 'off') return;
		// Using offset{X,Y} is wrong when pointer is inside the boundingbox, see https://stackoverflow.com/a/35364901
		const { left, top } = currentTarget.getBoundingClientRect();
		const [x, y] = [clientX - left, clientY - top];
		// Don't try registering new bounding box points if we're about to move/transform the existing one
		if ((movable || transformable) && withinBoundingBox(boudingBoxPixel, { x, y })) return;
		creatingBoundingBox = true;
		newBoundingBox.register(x, y);
	}}
	onmousemove={({ movementX, movementY }) => {
		const { x: dx, y: dy } = fromPixel({ x: movementX, y: movementY });

		if (creatingBoundingBox && createMode === 'clickanddrag') {
			newBoundingBox.clickanddrag.width += movementX;
			newBoundingBox.clickanddrag.height += movementY;
			return;
		}

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
	{#if getSettings().showTechnicalMetadata}
		<code class="debug" style:color="red">
			{#snippet point(x, y)}
				{Math.round(x)} {Math.round(y)}
			{/snippet}
			{#snippet bb({ x, y, width, height })}
				({@render point(x, y)}) × [{@render point(width, height)}]
			{/snippet}
			bb {@render bb(boudingBoxPixel)}<br />
			create {newBoundingBox.ready ? 'ready ' : ''}
			{#if createMode === 'clickanddrag'}
				{@render bb(newBoundingBox.clickanddrag)}
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
	{#if boundingBoxIsNonZero(boundingBox)}
		<div
			class="boundingbox"
			class:movable
			class:precise={!movable && !transformable}
			style:left="{boudingBoxPixel.x}px"
			style:top="{boudingBoxPixel.y}px"
			style:width="{boudingBoxPixel.width}px"
			style:height="{boudingBoxPixel.height}px"
			onmousedown={() => {
				if (movable) draggingCorner.setAll(true);
			}}
		>
			{#snippet side(/** @type {'top'|'bottom'|'left'|'right'} */ position)}
				<div
					class="side {position}"
					class:draggable={transformable}
					class:dragging={draggingCorner[position]}
					onmousedown={(e) => {
						if (!transformable) return;
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
					class:dragging={draggingCorner[position]}
					onmousedown={(e) => {
						if (!transformable) return;
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
	{/if}
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
		background: color-mix(in srgb, var(--light__bg-primary-translucent) 30%, transparent);
		border: var(--thick) dashed var(--light__bg-primary);
	}

	.boundingbox:hover:not(:has(:hover)):not(:has(.dragging)) .corner.draggable,
	.boundingbox .side.draggable.left:hover:not(.dragging) ~ .corner:is(.bottomleft, .topleft),
	.boundingbox .side.draggable.right:hover:not(.dragging) ~ .corner:is(.topright, .bottomright),
	.boundingbox .side.draggable.top:hover:not(.dragging) ~ .corner:is(.topleft, .topright),
	.boundingbox .side.draggable.bottom:hover:not(.dragging) ~ .corner:is(.bottomleft, .bottomright) {
		scale: 130%;
		background: var(--light__bg-primary-translucent);
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
		position: absolute;
		width: 1.5rem;
		height: 1.5rem;
		background: white;
		border: 3px solid black;
		transition: scale 80ms;
	}

	.boundingbox-point {
		translate: -50% -50%;
		background: var(--light__bg-primary);
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
		background: var(--light__bg-primary-translucent);
		scale: 130%;
	}

	.corner.dragging {
		scale: 110%;
		background: var(--light__bg-primary);
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
