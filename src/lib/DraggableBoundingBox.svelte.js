import { type } from 'arktype';

export class NewBoundingBox {
	/** @type {'clickanddrag' | '2point' | '4point'|'off'} */
	createMode = $state('clickanddrag');

	/** @param {'clickanddrag' | '2point' | '4point'|'off'} mode */
	setCreateMode(mode) {
		this.createMode = mode;
	}

	/** @type {{x: number, y: number, width: number, height: number}} */
	clickanddrag = $state({
		x: 0,
		y: 0,
		width: 0,
		height: 0
	});

	/** @type {{x1: number, y1: number, x2: number, y2: number}} */
	'2point' = $state({
		x1: 0,
		y1: 0,
		x2: 0,
		y2: 0
	});

	/** @type {{topleft: {x: number, y: number}, topright: {x: number, y: number}, bottomleft: {x: number, y: number}, bottomright: {x: number, y: number}}} */
	'4point' = $state({
		topleft: { x: 0, y: 0 },
		topright: { x: 0, y: 0 },
		bottomright: { x: 0, y: 0 },
		bottomleft: { x: 0, y: 0 }
	});

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
			return type({
				x1: 'number > 0',
				y1: 'number > 0',
				x2: 'number > 0',
				y2: 'number > 0'
			}).allows(this['2point']);
		}

		if (this.createMode === '4point') {
			return type({
				topleft: { x: 'number > 0', y: 'number > 0' },
				topright: { x: 'number > 0', y: 'number > 0' },
				bottomright: { x: 'number > 0', y: 'number > 0' },
				bottomleft: { x: 'number > 0', y: 'number > 0' }
			}).allows(this['4point']);
		}

		return false;
	});

	x = $derived(
		{
			clickanddrag: this.clickanddrag.x,
			'2point': Math.min(this['2point'].x1, this['2point'].x2),
			'4point': Math.min(this['4point'].topleft.x, this['4point'].bottomleft.x),
			off: 0
		}[this.createMode]
	);

	y = $derived(
		{
			clickanddrag: this.clickanddrag.y,
			'2point': Math.min(this['2point'].y1, this['2point'].y2),
			'4point': Math.min(this['4point'].topleft.y, this['4point'].topright.y),
			off: 0
		}[this.createMode]
	);

	width = $derived(
		{
			clickanddrag: this.clickanddrag.width,
			'2point': Math.abs(this['2point'].x2 - this['2point'].x1),
			'4point': Math.max(
				Math.abs(this['4point'].topright.x - this['4point'].topleft.x),
				Math.abs(this['4point'].bottomright.x - this['4point'].bottomleft.x)
			),
			off: 0
		}[this.createMode]
	);

	height = $derived(
		{
			clickanddrag: this.clickanddrag.height,
			'2point': Math.abs(this['2point'].y2 - this['2point'].y1),
			'4point': Math.max(
				Math.abs(this['4point'].topright.y - this['4point'].bottomright.y),
				Math.abs(this['4point'].topleft.y - this['4point'].bottomleft.y)
			),
			off: 0
		}[this.createMode]
	);

	/**
	 * A new point was just clicked: register it.
	 * clickanddrag: sets x, y
	 * 2point: sets x1, y1 then x2, y2
	 * 4point: sets topleft, topright, bottomright, bottomleft
	 * @param {number} x
	 * @param {number} y
	 */
	register(x, y) {
		if (this.createMode === 'clickanddrag') {
			this.clickanddrag = { ...this.clickanddrag, x, y };
			return;
		}

		if (this.createMode === '2point') {
			const { x1, y1 } = this['2point'];

			if (x1 === 0 && y1 === 0) {
				this['2point'] = { ...this['2point'], x1: x, y1: y };
			} else {
				this['2point'] = { ...this['2point'], x2: x, y2: y };
			}
		}

		if (this.createMode === '4point') {
			const { topleft, topright, bottomright } = this['4point'];

			if (topleft.x === 0 && topleft.y === 0) {
				this['4point'] = { ...this['4point'], topleft: { x, y } };
			} else if (topright.x === 0 && topright.y === 0) {
				this['4point'] = { ...this['4point'], topright: { x, y } };
			} else if (bottomright.x === 0 && bottomright.y === 0) {
				this['4point'] = { ...this['4point'], bottomright: { x, y } };
			} else {
				this['4point'] = { ...this['4point'], bottomleft: { x, y } };
			}
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
			height: 0
		};
		this['2point'] = {
			x1: 0,
			y1: 0,
			x2: 0,
			y2: 0
		};
		this['4point'] = {
			topleft: { x: 0, y: 0 },
			topright: { x: 0, y: 0 },
			bottomleft: { x: 0, y: 0 },
			bottomright: { x: 0, y: 0 }
		};
	}

	constructor() {
		this.clickanddrag = {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		};
		this['2point'] = {
			x1: 0,
			y1: 0,
			x2: 0,
			y2: 0
		};
		this['4point'] = {
			topleft: { x: 0, y: 0 },
			topright: { x: 0, y: 0 },
			bottomright: { x: 0, y: 0 },
			bottomleft: { x: 0, y: 0 }
		};
	}
}
