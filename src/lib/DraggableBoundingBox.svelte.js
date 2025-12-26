import { type } from 'arktype';

import { clamp, sign } from './utils.js';

/**
 * Represents the zoom state of the image.
 * x & y coordinates are in pixels of the resized, post-object-fit but pre-zoom image
 * @typedef {object} ZoomState
 * @property {object} origin
 * @property {number} origin.x
 * @property {number} origin.y
 * @property {number} scale
 * @property {boolean} panning
 * @property {object} panStart
 * @property {number} panStart.x
 * @property {number} panStart.y
 * @property {object} panStart.zoomOrigin
 * @property {number} panStart.zoomOrigin.x
 * @property {number} panStart.zoomOrigin.y
 */

/**
 * @type {ZoomState}
 */
export const INITIAL_ZOOM_STATE = {
	origin: { x: 0, y: 0 },
	scale: 1,
	panning: false,
	panStart: { x: 0, y: 0, zoomOrigin: { x: 0, y: 0 } }
};

/**
 * Calculate bounding rect for an image element that has object-fit: contain. The boundingClientRect is not the same as the actual, displayed image. We use both natural{Width,Height} and client{Width,Height} to calculate the displayed image size.
 * You can also provide the zoom state to take it into account.
 * @param {Pick<HTMLImageElement, `${'natural'|'client'}${'Width'|'Height'}` | `client${'Top'|'Left'}`>} imageElement
 * @param {ZoomState} [zoomState] take into account the zoom state of the image
 */
export function fittedImageRect(
	{ naturalWidth, naturalHeight, clientWidth, clientHeight, clientTop, clientLeft },
	zoomState
) {
	const naturalRatio = naturalWidth / naturalHeight;
	const clientRatio = clientWidth / clientHeight;

	let width = 0;
	let height = 0;

	if (naturalRatio < clientRatio) {
		width = clientHeight * naturalRatio;
		height = clientHeight;
	} else {
		height = clientWidth / naturalRatio;
		width = clientWidth;
	}

	if (zoomState) {
		width *= zoomState.scale;
		height *= zoomState.scale;
	}

	return {
		width,
		height,
		x: (zoomState?.origin.x ?? 0) + clientLeft + (clientWidth - width) / 2,
		y: (zoomState?.origin.y ?? 0) + clientTop + (clientHeight - height) / 2
	};
}

export class NewBoundingBox {
	/**
	 * @type {import('./BoundingBoxes.svelte').Rect}
	 * Limits for the resulting bounding box. Coordinates will be clamped to these values.
	 */
	limits = {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};

	/** @type {'clickanddrag' | '2point' | '4point'|'off'} */
	createMode = $state('clickanddrag');

	/** @param {'clickanddrag' | '2point' | '4point'|'off'} mode */
	setCreateMode(mode) {
		this.createMode = mode;
	}

	/** @type {import('./BoundingBoxes.svelte').Rect & { dragDirection: {x:-1|0|1, y:-1|0|1} }} */
	clickanddrag = $state({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		// -1 or 1
		dragDirection: {
			x: 0,
			y: 0
		}
	});

	/** @type {Array<{x: number; y: number}>}  */
	points = $state([]);

	/**
	 * The bounding box has enough data to be created
	 */
	ready = $derived.by(() => {
		if (this.createMode === 'clickanddrag') {
			return type({
				x: 'number > 0',
				y: 'number > 0',
				width: 'number > 0',
				height: 'number > 0'
			}).allows(this.clickanddrag);
		}

		if (this.createMode == '2point') {
			return this.points.length >= 2;
		}

		if (this.createMode === '4point') {
			return this.points.length >= 4;
		}

		return false;
	});

	/**
	 *
	 * @param {import('./BoundingBoxes.svelte').Rect} rect
	 * @returns {import('./BoundingBoxes.svelte').Rect}
	 */
	clamp(rect) {
		return {
			x: clamp(rect.x, this.limits.x, this.limits.width),
			y: clamp(rect.y, this.limits.y, this.limits.height),
			width: clamp(rect.width, 0, this.limits.width - rect.x),
			height: clamp(rect.height, 0, this.limits.height - rect.y)
		};
	}

	x = $derived.by(() => {
		if (this.createMode === 'clickanddrag') return this.clickanddrag.x;
		if (this.createMode === 'off') return 0;
		return Math.min(...this.points.map((point) => point.x));
	});

	y = $derived.by(() => {
		if (this.createMode === 'clickanddrag') return this.clickanddrag.y;
		if (this.createMode === 'off') return 0;
		return Math.min(...this.points.map((point) => point.y));
	});

	width = $derived.by(() => {
		if (this.createMode === 'clickanddrag') return this.clickanddrag.width;
		if (this.createMode === 'off') return 0;
		return Math.max(...this.points.map((point) => point.x)) - this.x;
	});

	height = $derived.by(() => {
		if (this.createMode === 'clickanddrag') return this.clickanddrag.height;
		if (this.createMode === 'off') return 0;
		return Math.max(...this.points.map((point) => point.y)) - this.y;
	});

	/**
	 * A new point was just clicked: register it.
	 * clickanddrag: sets x, y
	 * 2point: sets x1, y1 then x2, y2
	 * 4point: sets topleft, topright, bottomright, bottomleft
	 * @param {number} x
	 * @param {number} y
	 */
	registerPoint(x, y) {
		if (this.createMode === 'off') {
			return;
		}

		if (this.createMode === 'clickanddrag') {
			this.clickanddrag = { ...this.clickanddrag, x, y };
			return;
		}

		this.points.push({ x, y });
	}

	/**
	 * @param {number} dx (MouseEvent).movementX
	 * @param {number} dy (MouseEvent).movementY
	 */
	registerMovement(dx, dy) {
		if (this.createMode !== 'clickanddrag') return;

		const { width, height } = this.clickanddrag;

		if (width <= 0 || height <= 0) {
			this.clickanddrag.dragDirection = {
				x: sign(dx),
				y: sign(dy)
			};
		}

		const { x: xdir, y: ydir } = this.clickanddrag.dragDirection;

		// Drag direction: topleft -> bottomright
		if (xdir > 0 && ydir > 0) {
			this.clickanddrag.width += dx;
			this.clickanddrag.height += dy;
		}
		// Drag direction: bottomright -> topleft
		if (xdir < 0 && ydir < 0) {
			this.clickanddrag.x += dx;
			this.clickanddrag.y += dy;
			this.clickanddrag.width -= dx;
			this.clickanddrag.height -= dy;
		}
		// Drag direction: topright -> bottomleft
		if (xdir < 0 && ydir > 0) {
			this.clickanddrag.x += dx;
			this.clickanddrag.height += dy;
			this.clickanddrag.width -= dx;
		}
		// Drag direction: bottomleft -> topright
		if (xdir > 0 && ydir < 0) {
			this.clickanddrag.y += dy;
			this.clickanddrag.width += dx;
			this.clickanddrag.height -= dy;
		}
	}

	rect() {
		return this.clamp({
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height
		});
	}

	reset() {
		this.clickanddrag = {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			dragDirection: {
				x: 0,
				y: 0
			}
		};
		this.points = [];
	}

	/**
	 *
	 * @param {object} options
	 * @param {typeof this.limits} options.limits
	 */
	constructor({ limits }) {
		this.limits = limits;
		this.clickanddrag = {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			dragDirection: {
				x: 0,
				y: 0
			}
		};
		this.points = [];
	}
}
