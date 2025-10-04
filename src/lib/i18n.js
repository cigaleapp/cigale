/**
 * @typedef {import('$lib/database').Settings['language']} Language
 */

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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('countThing', () => {
		expect(countThing('item', 1)).toBe('1 item');
		expect(countThing('item', 2)).toBe('2 items');
		expect(countThing('item', 0)).toBe('');
		expect(countThing('child', 3, { child: 'children' })).toBe('3 children');
		expect(countThing('person', 1, { person: 'people' })).toBe('1 person');
	});
}

/**
 * Pluralizes a string based on a number and a list of candidate strings.
 * @see https://wuchale.dev/guides/plurals/#usage
 * @param {number} num
 * @param {string[]} candidates
 * @param {(n: number) => number} [rule]
 * @returns {string}
 */
export function plural(num, candidates, rule = (n) => (n === 1 ? 0 : 1)) {
	const index = rule(num);
	return candidates[index].replace('#', Intl.NumberFormat().format(num));
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('percent', () => {
		expect(percent(0.5)).toBe('50%');
		expect(percent(0.123)).toBe('12%');
		expect(percent(0.123, 1)).toBe('12.3%');
		expect(percent(0.123, 2)).toBe('12.3%'); // trailing zeros removed
		expect(percent(0.1234, 2)).toBe('12.34%');
		expect(percent(1)).toBe('100%');
		expect(percent(0)).toBe('0%');
		expect(percent(0.05, 1, { pad: 'zeros' })).toBe('005%'); // 5.0 -> 5 -> 005
		expect(percent(0.05, 0, { pad: 'nbsp' })).toBe('\u00A05%');
	});
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('humanFormatName', () => {
		expect(humanFormatName('image/jpeg')).toBe('JPEG');
		expect(humanFormatName('image/png')).toBe('PNG');
		expect(humanFormatName('video/mp4')).toBe('MP4');
		expect(humanFormatName('audio/mpeg')).toBe('MPEG');
		expect(humanFormatName('application/json')).toBe('json');
		expect(humanFormatName('text/plain')).toBe('plain');
		expect(humanFormatName('image/x-icon')).toBe('ICON');
		expect(humanFormatName('application/x-zip-compressed')).toBe('zip-compressed');
	});
}

/**
 *
 * @param {unknown} error
 * @param {string} [prefix]
 * @returns {string}
 */
export function errorMessage(error, prefix = '') {
	let defaultMessage = 'Unexpected error';
	try {
		defaultMessage = 'Erreur inattendue';
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

	result ||= defaultMessage;

	return prefix ? `${prefix}: ${result}` : result;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('errorMessage', async () => {
		await import('../locales/loader.js');
		const { loadLocale } = await import('wuchale/load-utils');
		await loadLocale('en');
		expect(errorMessage(new Error('Test error'))).toBe('Test error');
		expect(errorMessage(new Error('Error: Test error'))).toBe('Test error');
		expect(errorMessage('string error')).toBe('string error');
		expect(errorMessage(null)).toBe('Unexpected error');
		expect(errorMessage(undefined)).toBe('Unexpected error');
		expect(errorMessage(new Error('Test'), 'Prefix')).toBe('Prefix: Test');

		// The current implementation overwrites with toString(), so cause isn't used
		const errorWithCause = new Error('Main error');
		errorWithCause.cause = new Error('Cause error');
		expect(errorMessage(errorWithCause)).toBe('Main error');
	});
}
