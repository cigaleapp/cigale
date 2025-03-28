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
	 * @param {object} param0
	 * @param {number} param0.x
	 * @param {number} param0.y
	 * @param {number} param0.width
	 * @param {number} param0.height
	 */
	return ({ x, y, width, height }) => ({
		x: x * xwise,
		y: y * ywise,
		width: width * xwise,
		height: height * ywise
	});
}

export const toPixelCoords = coordsScaler({ x: TARGETWIDTH, y: TARGETHEIGHT });
export const toRelativeCoords = coordsScaler({ x: 1 / TARGETWIDTH, y: 1 / TARGETHEIGHT });

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
