/**
 * Return a ", "-separated list of "{count} {thing}" strings, with thing set to plural.
 * If thing is found in plurals, use that, otherwise use "{thing}s".
 * @param {Record<string, number>} things
 * @param {Record<string, string>} [plurals]
 */
export function countThings(things, plurals) {
	return Object.entries(things)
		.filter(([, count]) => count > 0)
		.map(([thing, count]) => {
			let counted = thing;
			if (count > 1) {
				counted = plurals?.[thing] ?? `${thing}s`;
			}

			return `${count} ${counted}`;
		})
		.join(', ');
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('countThings', () => {
		expect(countThings({ a: 1, b: 2, c: 0 })).toBe('1 a, 2 bs');
		expect(countThings({ a: 1, b: 2, c: 0 }, { b: 'foo' })).toBe('1 a, 2 foo');
		expect(countThings({ a: 1, b: 2, c: 0 }, { a: 'a', b: 'b' })).toBe('1 a, 2 b');
	});
}

/**
 * Converts a number between 0 and 1 to a percentage string.
 * @param {number} value Number between 0 and 1
 * @param {number} [decimals=0] Number of decimal places to include in the output
 * @param {object} [options] Additional options
 * @param {'none'|'nbsp'|'zeros'} [options.pad=none] Whether to pad the percentage with leading non-breaking spaces
 * @returns {`${number}%`} Percentage string
 */
export function percent(value, decimals = 0, { pad = 'none' } = {}) {
	let result = (value * 100).toFixed(decimals);

	// Remove trailing zeros and decimal point if not needed
	if (decimals > 0) result = result.replace(/\.?0+$/, '');

	if (pad !== 'none') {
		result = result.padStart(2 + decimals, pad === 'nbsp' ? '\u00A0' : '0');
	}

	// @ts-expect-error
	return result + '%';
}
