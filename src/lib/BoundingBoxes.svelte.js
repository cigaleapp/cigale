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
	 * @template {{x: number; y: number} & ({w: number; h: number} | {width: number; height: number})} Shape
	 * @param {Shape} param0
	 * @returns {Shape}
	 */
	return ({ x, y, ...wh }) => ({
		x: x * xwise,
		y: y * ywise,
		['width' in wh ? 'width' : 'w']: (wh.width ?? wh.w) * xwise,
		['height' in wh ? 'height' : 'h']: (wh.height ?? wh.h) * ywise
	});
}

/** @param {undefined | import('./database').Protocol} protocol  */
export const toPixelCoords = (protocol) => {
	if (!protocol) throw new Error('No protocol was provided');
	return coordsScaler({
		x: protocol.inference?.detection?.input?.width ?? TARGETWIDTH,
		y: protocol.inference?.detection?.input?.height ?? TARGETHEIGHT
	});
};

/** @param {undefined | import('./database').Protocol} protocol  */
export const toRelativeCoords = (protocol) => {
	if (!protocol) throw new Error('No protocol was provided');
	return coordsScaler({
		x: 1 / (protocol.inference?.detection?.input?.width ?? TARGETWIDTH),
		y: 1 / (protocol.inference?.detection?.input?.height ?? TARGETHEIGHT)
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
