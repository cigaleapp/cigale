import { type } from 'arktype';
import { TARGETHEIGHT, TARGETWIDTH } from './inference';

/**
 *
 * @param {object} param0
 * @param {number} param0.x
 * @param {number} param0.y
 * @returns scaled coordinates
 */
export function coordsScaler({ x: xwise, y: ywise }) {
	/**
	 * @template {{x: number; y: number} | ({x: number, y: number} & ({w: number; h: number} | {width: number; height: number}))} Shape
	 * @param {Shape} param0
	 * @returns {Shape}
	 */
	return ({ x, y, ...wh }) => {
		const [newx, newy] = [x * xwise, y * ywise];
		if ('width' in wh && 'height' in wh)
			return { x: newx, y: newy, width: wh.width * xwise, height: wh.height * ywise };
		if ('w' in wh && 'h' in wh) return { x: newx, y: newy, w: wh.w * xwise, h: wh.h * ywise };
		return { x: newx, y: newy, ...wh };
	};
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('coordsScaler', () => {
		expect(coordsScaler({ x: 2, y: 3 })({ x: 1, y: 2 })).toEqual({ x: 2, y: 6 });
		expect(coordsScaler({ x: 2, y: 3 })({ x: 1, y: 2, width: 4, height: 5 })).toEqual({
			x: 2,
			y: 6,
			width: 8,
			height: 15
		});
	});
}

/** @param {undefined | import('./database').Protocol} protocol  */
export const toPixelCoords = (protocol) => {
	if (!protocol) throw new Error('No protocol was provided');
	return coordsScaler({
		x: protocol.crop?.infer?.input?.width ?? TARGETWIDTH,
		y: protocol.crop?.infer?.input?.height ?? TARGETHEIGHT
	});
};

/** @param {undefined | import('./database').Protocol} protocol  */
export const toRelativeCoords = (protocol) => {
	if (!protocol) throw new Error('No protocol was provided');
	return coordsScaler({
		x: 1 / (protocol.crop?.infer?.input?.width ?? TARGETWIDTH),
		y: 1 / (protocol.crop?.infer?.input?.height ?? TARGETHEIGHT)
	});
};

/**
 * @param {object} param0
 * @param {number} param0.x
 * @param {number} param0.y
 * @param {number} param0.width
 * @param {number} param0.height
 */
export function toCenteredCoords({ x, y, width, height }) {
	return {
		x: x + width / 2,
		y: y + height / 2,
		w: width,
		h: height
	};
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('toCenteredCoords', () => {
		expect(toCenteredCoords({ x: 0, y: 0, width: 10, height: 20 })).toEqual({
			x: 5,
			y: 10,
			w: 10,
			h: 20
		});
	});
}

/**
 * @param {object} param0
 * @param {number} param0.x
 * @param {number} param0.y
 * @param {number} param0.w
 * @param {number} param0.h
 */
export function toTopLeftCoords({ x, y, w, h }) {
	return {
		x: x - w / 2,
		y: y - h / 2,
		width: w,
		height: h
	};
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('toTopLeftCoords', () => {
		expect(toTopLeftCoords({ x: 5, y: 10, w: 10, h: 20 })).toEqual({
			x: 0,
			y: 0,
			width: 10,
			height: 20
		});
	});
}

export function boundingBoxIsNonZero(boundingBox) {
	return type({
		x: 'number > 0',
		y: 'number > 0'
	})
		.and(
			type.or(
				{
					width: 'number > 0',
					height: 'number > 0'
				},
				{
					w: 'number > 0',
					h: 'number > 0'
				}
			)
		)
		.allows(boundingBox);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('boundingBoxIsNonZero', () => {
		expect(boundingBoxIsNonZero({ x: 0, y: 0, width: 10, height: 20 })).toBe(false);
		expect(boundingBoxIsNonZero({ x: 5, y: 10, width: 0, height: 20 })).toBe(false);
		expect(boundingBoxIsNonZero({ x: 5, y: 10, width: 10, height: 0 })).toBe(false);
		expect(boundingBoxIsNonZero({ x: 5, y: 10, width: -1, height: -1 })).toBe(false);
		expect(boundingBoxIsNonZero({ x: 5, y: 10, w: -1, h: -1 })).toBe(false);
		expect(boundingBoxIsNonZero({ x: 0, y: 0, w: 0, h: 0 })).toBe(false);
		expect(boundingBoxIsNonZero({ x: 5, y: 10, w: 10, h: 20 })).toBe(true);
	});
}

/**
 *
 * @param {{x: number, y: number, width: number, height: number}} boundingBox
 * @param {{x: number, y: number}} point
 * @returns
 */
export function withinBoundingBox(boundingBox, { x, y }) {
	if (!boundingBoxIsNonZero(boundingBox)) return false;
	const { x: x_box, y: y_box, width, height } = boundingBox;
	return x >= x_box && x <= x_box + width && y >= y_box && y <= y_box + height;
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;
	describe('withinBoundingBox', () => {
		test('works for points inside', () => {
			expect(withinBoundingBox({ x: 1, y: 1, width: 10, height: 20 }, { x: 5, y: 10 })).toBe(true);
		});
		test('works for points outside', () => {
			expect(withinBoundingBox({ x: 1, y: 1, width: 10, height: 20 }, { x: -1, y: -1 })).toBe(
				false
			);
		});
		test('returns false on zero-sized bounding boxes', () => {
			expect(withinBoundingBox({ x: 4, y: 5, width: 0, height: 0 }, { x: 4, y: 5 })).toBe(false);
		});
	});
}

export const rect = type({
	x: 'number > 0',
	y: 'number > 0',
	width: 'number > 0',
	height: 'number > 0'
});

/**
 * @typedef {typeof rect.infer} Rect
 */
