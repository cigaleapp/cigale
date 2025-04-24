<script>
	import { boundingBoxIsNonZero } from './BoundingBoxes.svelte';
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
	 */

	/**  @type {Props} */
	let { boundingBox: boudingBoxInitial, imageElement, onchange } = $props();

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

	$effect(() => {
		const resizeObserver = new ResizeObserver((_, observer) => {
			if (!imageElement) {
				observer.disconnect();
				return;
			}

			({ clientWidth, clientHeight, clientLeft, clientTop, naturalWidth, naturalHeight } =
				imageElement);
		});

		const mutationObserver = new MutationObserver((_, observer) => {
			if (!imageElement) {
				observer.disconnect();
				return;
			}

			({ clientWidth, clientHeight, clientLeft, clientTop, naturalWidth, naturalHeight } =
				imageElement);
		});

		mutationObserver.observe(imageElement, {
			attributes: true,
			attributeFilter: ['src']
		});
		resizeObserver.observe(imageElement);

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

	/**
	 * @type {(imageRect: Rect,  box: Rect) => Rect}
	 */
	const toPixel = $derived((imageRect, { x, y, width, height }) => ({
		x: imageRect.x + x * imageRect.width,
		y: imageRect.y + y * imageRect.height,
		width: width * imageRect.width,
		height: height * imageRect.height
	}));

	const boudingBoxPixel = $derived(toPixel(imageRect, boundingBox));

	let creatingBoundingBox = $state(false);

	let newBoundingBox = $state({
		x: 0,
		y: 0,
		width: 0,
		height: 0
	});

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

<div
	class="change-area"
	class:debug={getSettings().showTechnicalMetadata}
	style:left="{imageRect.x}px"
	style:top="{imageRect.y}px"
	style:width="{imageRect.width}px"
	style:height="{imageRect.height}px"
	style:cursor={boundingBoxIsNonZero(boundingBox) ? 'unset' : 'crosshair'}
	onmouseup={() => {
		if (creatingBoundingBox) {
			boundingBox = {
				x: newBoundingBox.x / imageRect.width,
				y: newBoundingBox.y / imageRect.height,
				width: newBoundingBox.width / imageRect.width,
				height: newBoundingBox.height / imageRect.height
			};
			newBoundingBox = {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};
		}
		creatingBoundingBox = false;
		draggingCorner.setAll(false);
		onchange?.(boundingBox);
	}}
	onmousedown={({ offsetX, offsetY }) => {
		if (boundingBoxIsNonZero(boundingBox)) return;
		creatingBoundingBox = true;
		newBoundingBox.x = offsetX;
		newBoundingBox.y = offsetY;
		console.log('newBoundingBox', newBoundingBox);
	}}
	onmousemove={({ movementX, movementY }) => {
		const dx = movementX / imageRect.width;
		const dy = movementY / imageRect.height;

		if (creatingBoundingBox) {
			newBoundingBox.width += movementX;
			newBoundingBox.height += movementY;
			console.log('newBoundingBox', newBoundingBox);
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
	{#if creatingBoundingBox}
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
			style:left="{boudingBoxPixel.x - imageRect.x}px"
			style:top="{boudingBoxPixel.y - imageRect.y}px"
			style:width="{boudingBoxPixel.width}px"
			style:height="{boudingBoxPixel.height}px"
			onmousedown={() => {
				draggingCorner.setAll(true);
			}}
		>
			{#snippet side(/** @type {'top'|'bottom'|'left'|'right'} */ position)}
				<div
					class="side {position}"
					class:dragging={draggingCorner[position]}
					onmousedown={(e) => {
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
					class:dragging={draggingCorner[position]}
					onmousedown={(e) => {
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
		border: 5px dashed red;
	}

	.boundingbox {
		position: absolute;
	}

	.boundingbox:not(.new) {
		cursor: move;
	}

	.boundingbox:hover:not(:has(:hover)):not(:has(.dragging)) .corner,
	.boundingbox .side.left:hover:not(.dragging) ~ .corner:is(.bottomleft, .topleft),
	.boundingbox .side.right:hover:not(.dragging) ~ .corner:is(.topright, .bottomright),
	.boundingbox .side.top:hover:not(.dragging) ~ .corner:is(.topleft, .topright),
	.boundingbox .side.bottom:hover:not(.dragging) ~ .corner:is(.bottomleft, .bottomright) {
		scale: 130%;
		background: var(--light__bg-primary-translucent);
	}

	.side {
		--thick: 5px;
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

	.corner {
		position: absolute;
		width: 1.5rem;
		height: 1.5rem;
		background: white;
		border: 3px solid black;
		transition: scale 80ms;
	}

	.corner:hover {
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
		cursor: nwse-resize;
	}

	.topright {
		top: -0.75rem;
		right: -0.75rem;
		cursor: nesw-resize;
	}

	.bottomleft {
		bottom: -0.75rem;
		left: -0.75rem;
		cursor: nesw-resize;
	}

	.bottomright {
		bottom: -0.75rem;
		right: -0.75rem;
		cursor: nwse-resize;
	}
</style>
