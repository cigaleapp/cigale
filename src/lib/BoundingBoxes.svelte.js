import { type } from 'arktype';
import { TARGETHEIGHT, TARGETWIDTH } from './inference';

export const anyBoundingBox = type({
	x: 'number',
	y: 'number'
}).and(type.or({ width: 'number', height: 'number' }, { w: 'number', h: 'number' }));

/**
 * @typedef {typeof anyBoundingBox.infer} AnyBoundingBox
 */

/**
 *
 * @param {object} param0
 * @param {number} param0.x
 * @param {number} param0.y
 * @returns scaled coordinates
 */
export function coordsScaler({ x: xwise, y: ywise }) {
	/**
	 * @template {AnyBoundingBox} BoundingBox
	 * @param {BoundingBox} param0
	 * @returns {BoundingBox}
	 */
	return ({ x, y, ...wh }) => {
		const [newx, newy] = [x * xwise, y * ywise];
		if ('width' in wh && 'height' in wh)
			return { x: newx, y: newy, width: wh.width * xwise, height: wh.height * ywise };
		if ('w' in wh && 'h' in wh) return { x: newx, y: newy, w: wh.w * xwise, h: wh.h * ywise };
		return { x: newx, y: newy, ...wh };
	};
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

export const rect = type({
	x: 'number > 0',
	y: 'number > 0',
	width: 'number > 0',
	height: 'number > 0'
});

/**
 * @typedef {typeof rect.infer} Rect
 */

/**
 *
 * @param {AnyBoundingBox} a
 * @param {AnyBoundingBox} b
 */
export function coordsDifference(a, b) {
	let combinedDifference = 0;

	combinedDifference += Math.abs(a.x - b.x);
	combinedDifference += Math.abs(a.y - b.y);
	combinedDifference += Math.abs(('width' in a ? a.width : a.w) - ('width' in b ? b.width : b.w));
	combinedDifference += Math.abs(
		('height' in a ? a.height : a.h) - ('height' in b ? b.height : b.h)
	);

	return combinedDifference;
}

/**
 *
 * @param {AnyBoundingBox} a
 * @param {AnyBoundingBox} b
 * @param {number} tolerance
 */
export function coordsAreEqual(a, b, tolerance = 0) {
	return coordsDifference(a, b) <= tolerance;
}

/**
 * Return the 4 corners of a bounding box as (x, y) tuples
 * @param {AnyBoundingBox} boundingBox
 * @returns {{ topleft: [number, number], topright: [number, number], bottomleft: [number, number], bottomright: [number, number] }}
 */
export function toCorners(boundingBox) {
	if (!('width' in boundingBox) || !('height' in boundingBox)) {
		return toCorners(toTopLeftCoords(boundingBox));
	}

	return {
		topleft: [boundingBox.x, boundingBox.y],
		topright: [boundingBox.x + boundingBox.width, boundingBox.y],
		bottomleft: [boundingBox.x, boundingBox.y + boundingBox.height],
		bottomright: [boundingBox.x + boundingBox.width, boundingBox.y + boundingBox.height]
	};
}
