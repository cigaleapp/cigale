import { lcm, range } from '$lib/utils.js';

export type Layout = (string | null)[][];

/**
 * Ensures that all rows of the given layout are of same width
 */
export function homogenizeLayout(layout: Layout): Layout {
	const width = lcm(...layout.map((row) => row.length));

	return layout.map((row) => {
		const repeat = width / row.length;

		const repeated = [];
		for (const element of row) {
			for (const _ of range(repeat)) {
				repeated.push(element);
			}
		}

		return repeated;
	});
}

/**
 * Create a layout where each given cell has its own row
 */
export function verticalAutoLayout(cells: string[]): Layout {
	return cells.map((cell) => [cell]);
}

export function cssGridAreas(layout: Layout) {
	return layout
		.map((row) => `"${row.map((cell, i) => (cell === null ? `_${i}` : cell)).join(' ')}"`)
		.join(' ');
}
