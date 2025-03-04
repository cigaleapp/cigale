import { TARGETHEIGHT, TARGETWIDTH } from './inference';

/**
 *
 * @param {object} param0 coordinates in pixel values
 * @param {number} param0.x
 * @param {number} param0.y
 * @param {number} param0.width
 * @param {number} param0.height
 */
export function toRelativeCoords({ x, y, width, height }) {
	return {
		x: x / TARGETWIDTH,
		y: y / TARGETHEIGHT,
		width: width / TARGETWIDTH,
		height: height / TARGETHEIGHT
	};
}

/**
 * @param {object} param0 coordinates in relative values
 * @param {number} param0.x
 * @param {number} param0.y
 * @param {number} param0.width
 * @param {number} param0.height
 */
export function toPixelCoords({ x, y, width, height }) {
	return {
		x: x * TARGETWIDTH,
		y: y * TARGETHEIGHT,
		width: width * TARGETWIDTH,
		height: height * TARGETHEIGHT
	};
}
