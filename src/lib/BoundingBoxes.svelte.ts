import { type } from 'arktype';

export const centeredBoundingBox = type({
	x: 'number',
	y: 'number',
	w: 'number',
	h: 'number',
});

const topLeftBoundingBox = type({
	x: 'number',
	y: 'number',
	width: 'number',
	height: 'number',
});

const _rect = type({
	x: 'number > 0',
	y: 'number > 0',
	width: 'number > 0',
	height: 'number > 0',
});

const _anyBoundingBox = type.or(centeredBoundingBox, topLeftBoundingBox);

type AnyBoundingBox = typeof _anyBoundingBox.infer;
export type TopLeftBoundingBox = typeof topLeftBoundingBox.infer;
export type CenteredBoundingBox = typeof centeredBoundingBox.infer;
export type Rect = typeof _rect.infer;

export const FULL_IMAGE_CROPBOX = {
	w: 1,
	h: 1,
	x: 0.5,
	y: 0.5,
} as const satisfies CenteredBoundingBox;

/**
 * @returns scaled coordinates
 */
export function coordsScaler({ x: xwise, y: ywise }: { x: number; y: number }) {
	return coordsAffineTransformer({
		x: [xwise, 0],
		y: [ywise, 0],
	});
}

type CoordinatesRange = [start: number, end: number];

export type CoordinatesDomain = { x: CoordinatesRange; y: CoordinatesRange };

const NORMALIZED_DOMAIN: CoordinatesDomain = { x: [0, 1], y: [0, 1] };

export function domainFromDimensions(dimensions: {
	width: number;
	height: number;
}): CoordinatesDomain {
	return {
		x: [0, dimensions.width],
		y: [0, dimensions.height],
	};
}

export function dimensionsOfDomain(domain: CoordinatesDomain): { width: number; height: number } {
	const [start, end] = domain.x;
	const [low, high] = domain.y;

	return {
		width: end - start,
		height: high - low,
	};
}
/**
 * Given two domains, creates a function that can convert coordinates of boxes
 * from the first domain into the second.
 * Pass "null" instead to mean the normalized domain ([0, 1] on both axes)
 */
export function coordsDomainTransposer(
	from: CoordinatesDomain | null,
	to: CoordinatesDomain | null
) {
	from ??= NORMALIZED_DOMAIN;
	to ??= NORMALIZED_DOMAIN;

	const span = ([start, end]: CoordinatesRange) => end - start;
	const offset = ([start]: CoordinatesRange) => start;

	const transposeAxis = (from: CoordinatesRange, to: CoordinatesRange) =>
		[span(to) / span(from), (offset(to) - offset(from)) / span(from)] as const;

	return coordsAffineTransformer({
		x: transposeAxis(from.x, to.x),
		y: transposeAxis(from.y, to.y),
	});
}

/**
 * **Given normalized (relative) coordinates**,
 * Stretch coordinates to make them fit in given ranges
 * for both axes.
 * Ranges can be given in reversed order (second number lower than first)
 * if the range is reversed compared to top-left -> bottom-right order
 */
export function coordsFitter(domain: CoordinatesDomain) {
	return coordsDomainTransposer(null, domain);
}

/**
 * Given coordinates within the given ranges,
 * normalizes them into [0, 1]
 *
 * The reverse of coordsFitter()
 */
export function coordsNormalizer(domain: CoordinatesDomain) {
	return coordsDomainTransposer(domain, null);
}

/**
 * Define `m` & `p` for both axes.
 * The returned function will apply `f(c) = m c + p`
 * for x/y and `f(a) = m a` for width/height
 */
function coordsAffineTransformer({
	x: [m_x, p_x],
	y: [m_y, p_y],
}: {
	x: readonly [scale: number, offset: number];
	y: readonly [scale: number, offset: number];
}) {
	function transform(box: TopLeftBoundingBox): TopLeftBoundingBox;
	function transform(box: CenteredBoundingBox): CenteredBoundingBox;
	function transform(box: AnyBoundingBox): AnyBoundingBox {
		if ('width' in box) {
			return {
				x: box.x * m_x + p_x,
				y: box.y * m_y + p_y,
				width: box.width * m_x,
				height: box.height * m_y,
			};
		}

		return {
			x: box.x * m_x + p_x,
			y: box.y * m_y + p_y,
			w: box.w * m_x,
			h: box.h * m_y,
		};
	}

	return transform;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('coordsScaler', () => {
		expect(coordsScaler({ x: 2, y: 3 })({ x: 1, y: 2, w: 0, h: 0 })).toEqual({
			x: 2,
			y: 6,
			w: 0,
			h: 0,
		});
		expect(coordsScaler({ x: 2, y: 3 })({ x: 1, y: 2, width: 4, height: 5 })).toEqual({
			x: 2,
			y: 6,
			width: 8,
			height: 15,
		});
	});
}

export const toRelativeCoords = (input: undefined | { width: number; height: number }) => {
	if (!input) throw new Error('No input settings were provided');
	return coordsScaler({
		x: 1 / input.width,
		y: 1 / input.height,
	});
};

export function toCenteredCoords({
	x,
	y,
	width,
	height,
}: {
	x: number;
	y: number;
	width: number;
	height: number;
}) {
	return {
		x: x + width / 2,
		y: y + height / 2,
		w: width,
		h: height,
	};
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('toCenteredCoords', () => {
		expect(toCenteredCoords({ x: 0, y: 0, width: 10, height: 20 })).toEqual({
			x: 5,
			y: 10,
			w: 10,
			h: 20,
		});
	});
}

export function toTopLeftCoords({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
	return {
		x: Math.max(x - w / 2, 0),
		y: Math.max(y - h / 2, 0),
		width: w,
		height: h,
	};
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('toTopLeftCoords', () => {
		expect(toTopLeftCoords({ x: 5, y: 10, w: 10, h: 20 })).toEqual({
			x: 0,
			y: 0,
			width: 10,
			height: 20,
		});
	});
}

export function boundingBoxIsNonZero(boundingBox: AnyBoundingBox) {
	return type({
		x: 'number > 0',
		y: 'number > 0',
	})
		.and(
			type.or(
				{
					width: 'number > 0',
					height: 'number > 0',
				},
				{
					w: 'number > 0',
					h: 'number > 0',
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

export function withinBoundingBox(
	boundingBox: { x: number; y: number; width: number; height: number },
	{ x, y }: { x: number; y: number }
) {
	if (!boundingBoxIsNonZero(boundingBox)) return false;
	const { x: x_box, y: y_box, width, height } = boundingBox;
	return x >= x_box && x <= x_box + width && y >= y_box && y <= y_box + height;
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;
	describe('withinBoundingBox', () => {
		test('works for points inside', () => {
			expect(withinBoundingBox({ x: 1, y: 1, width: 10, height: 20 }, { x: 5, y: 10 })).toBe(
				true
			);
		});
		test('works for points outside', () => {
			expect(withinBoundingBox({ x: 1, y: 1, width: 10, height: 20 }, { x: -1, y: -1 })).toBe(
				false
			);
		});
		test('returns false on zero-sized bounding boxes', () => {
			expect(withinBoundingBox({ x: 4, y: 5, width: 0, height: 0 }, { x: 4, y: 5 })).toBe(
				false
			);
		});
	});
}

function coordsDifference(a: AnyBoundingBox, b: AnyBoundingBox) {
	let combinedDifference = 0;

	combinedDifference += Math.abs(a.x - b.x);
	combinedDifference += Math.abs(a.y - b.y);
	combinedDifference += Math.abs(('width' in a ? a.width : a.w) - ('width' in b ? b.width : b.w));
	combinedDifference += Math.abs(
		('height' in a ? a.height : a.h) - ('height' in b ? b.height : b.h)
	);

	return combinedDifference;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('coordsDifference', () => {
		expect(
			coordsDifference(
				{ x: 1, y: 1, width: 10, height: 20 },
				{ x: 5, y: 10, width: 10, height: 20 }
			)
		).toBe(13);
		expect(coordsDifference({ x: 1, y: 1, w: 10, h: 20 }, { x: 5, y: 10, w: 10, h: 20 })).toBe(
			13
		);
	});
}

export function coordsAreEqual(a: AnyBoundingBox, b: AnyBoundingBox, tolerance: number = 0) {
	return coordsDifference(a, b) <= tolerance;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('coordsAreEqual', () => {
		expect(
			coordsAreEqual(
				{ x: 1, y: 1, width: 10, height: 20 },
				{ x: 5, y: 10, width: 10, height: 20 }
			)
		).toBe(false);
		expect(coordsAreEqual({ x: 1, y: 1, w: 10, h: 20 }, { x: 5, y: 10, w: 10, h: 20 })).toBe(
			false
		);
		expect(
			coordsAreEqual(
				{ x: 1, y: 1, w: 10, h: 20 },
				{ x: 1.01, y: 1.01, w: 10.01, h: 20.01 },
				0.05
			)
		).toBe(true);
	});
}

/**
 * Return the 4 corners of a bounding box as (x, y) tuples
 */
export function toCorners(boundingBox: AnyBoundingBox): {
	topleft: [number, number];
	topright: [number, number];
	bottomleft: [number, number];
	bottomright: [number, number];
} {
	if (!('width' in boundingBox) || !('height' in boundingBox)) {
		return toCorners(toTopLeftCoords(boundingBox));
	}

	return {
		topleft: [boundingBox.x, boundingBox.y],
		topright: [boundingBox.x + boundingBox.width, boundingBox.y],
		bottomleft: [boundingBox.x, boundingBox.y + boundingBox.height],
		bottomright: [boundingBox.x + boundingBox.width, boundingBox.y + boundingBox.height],
	};
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('toCorners', () => {
		expect(toCorners({ x: 1, y: 1, width: 10, height: 20 })).toEqual({
			topleft: [1, 1],
			topright: [11, 1],
			bottomleft: [1, 21],
			bottomright: [11, 21],
		});
		expect(toCorners({ x: 5, y: 10, w: 10, h: 20 })).toEqual({
			topleft: [0, 0],
			topright: [10, 0],
			bottomleft: [0, 20],
			bottomright: [10, 20],
		});
	});
}
