import { type } from 'arktype';
import { sign } from './utils';

export class NewBoundingBox {
	/** @type {'clickanddrag' | '2point' | '4point'|'off'} */
	createMode = $state('clickanddrag');

	/** @param {'clickanddrag' | '2point' | '4point'|'off'} mode */
	setCreateMode(mode) {
		this.createMode = mode;
	}

	/** @type {{x: number, y: number, width: number, height: number, dragDirection: {x:-1|0|1, y:-1|0|1}}} */
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
		return {
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height
		};
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

	constructor() {
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
