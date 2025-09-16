import { m } from './paraglide/messages';

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
 *
 * @param {string} name
 * @param {number} count
 * @param {Record<string, string>} [plurals]
 */
export function countThing(name, count, plurals) {
	return countThings({ [name]: count }, plurals);
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

/**
 * Returns a human-readable name for a content type.
 * @param {string} contentType Content type, of the form type/subtype
 */
export function humanFormatName(contentType) {
	const [supertype, subtype] = contentType.split('/', 2);

	let result = subtype.replace(/^x-/, '');

	if (['image', 'video', 'audio'].includes(supertype)) {
		result = result.toUpperCase();
	}

	return result;
}

/**
 *
 * @param {unknown} error
 * @returns {string}
 */
export function errorMessage(error) {
	let defaultMessage = 'Unexpected error';
	try {
		defaultMessage = m.unexpected_error();
		// eslint-disable-next-line no-empty
	} catch {}

	let result = defaultMessage;

	if (error instanceof Error) {
		if ('message' in error && error.message) {
			result = error.message || defaultMessage;
		}
		if ('cause' in error && error.cause) {
			result = errorMessage(error.cause);
		}
	}

	result = error?.toString() || defaultMessage;

	while (result.startsWith('Error: ')) {
		result = result.slice('Error: '.length);
	}

	return result || defaultMessage;
}
