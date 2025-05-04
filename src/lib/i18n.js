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
