/**
 * @typedef {import('$lib/database').Settings['language']} Language
 */

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
	const defaultMessage = 'Erreur inattendue';

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
		expect(errorMessage(new Error('test error'))).toBe('test error');
		expect(errorMessage(new Error(/* @wc-ignore */ 'Error: test error'))).toBe('test error');
		expect(errorMessage('string error')).toBe('string error');
		expect(errorMessage(null)).toBe('Erreur inattendue');
		expect(errorMessage(undefined)).toBe('Erreur inattendue');
		expect(errorMessage(new Error('test'), 'prefix')).toBe('prefix: test');

		// The current implementation overwrites with toString(), so cause isn't used
		const errorWithCause = new Error('main error');
		errorWithCause.cause = new Error('cause error');
		expect(errorMessage(errorWithCause)).toBe('main error');
	});
}

/**
 *
 * @returns {Language}
 */
export function localeFromNavigator() {
	const locale = navigator.language.split('-')[0];
	return locale === 'fr' ? 'fr' : 'en';
}

/**
 * Uppercase the first letter of a string
 * @param {string} str
 * @returns {string}
 */
export function uppercaseFirst(str) {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('uppercaseFirst', () => {
		expect(uppercaseFirst('hello')).toBe('Hello');
		expect(uppercaseFirst('Hello')).toBe('Hello');
		expect(uppercaseFirst('')).toBe('');
		expect(uppercaseFirst('a')).toBe('A');
		expect(uppercaseFirst('école')).toBe('École');
	});
}
