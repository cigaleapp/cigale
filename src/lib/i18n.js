/**
 * @typedef {import('#lib/database').Settings['language']} Language
 */

/**
 * Pluralizes a string based on a number and a list of candidate strings.
 * @see https://wuchale.dev/guides/plurals/#usage
 * @param {number} num
 * @param {string[]} candidates
 * @param {(n: number) => number | string} [rule]
 * @returns {string}
 */
export function plural(num, candidates, rule = (n) => (n === 1 ? 0 : 1)) {
	// Wuchale rewrites `plural(num, candidates)` to inject a locale string as the 3rd arg
	// (see wuchale's `pluralPattern` = `{ name: 'plural', args: ['other', 'message', 'locale'] }`).
	// When the 3rd arg is not a function, fall back to the default rule.
	const resolveRule = typeof rule === 'function' ? rule : (n) => (n === 1 ? 0 : 1);
	const index = resolveRule(num);
	return candidates[index]?.replace('#', Intl.NumberFormat().format(num));
}

/**
 * Converts a number between 0 and 1 to a percentage string. **Includes** the trailing percent sign
 * @param {number} value Number between 0 and 1
 * @param {number} [decimals=0] Number of decimal places to include in the output
 * @param {object} [options] Additional options
 * @param {'none'|'nbsp'|'zeros'} [options.pad=none] Whether to pad the percentage with leading non-breaking spaces
 * @param {number} [options.length] Total length of the resulting string (including % sign); if not specified, this is calculated based on decimals and the eventual padding. only relevant when pad is not 'none'.
 * @returns {`${number}%`} Percentage string
 */
export function percent(value, decimals = 0, { pad = 'none', length } = {}) {
	let result = (value * 100).toFixed(decimals);

	// Remove trailing zeros and decimal point if not needed
	if (decimals > 0) result = result.replace(/\.?0+$/, '');

	if (pad !== 'none') {
		result = result.padStart(length ?? 2 + decimals, pad === 'nbsp' ? '\u00A0' : '0');
	}

	// @ts-expect-error
	return result + '%';
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('percent', () => {
		expect.soft(percent(0.5)).toBe('50%');
		expect.soft(percent(0.123)).toBe('12%');
		expect.soft(percent(0.123, 1)).toBe('12.3%');
		expect.soft(percent(0.123, 2)).toBe('12.3%'); // trailing zeros removed
		expect.soft(percent(0.1234, 2)).toBe('12.34%');
		expect.soft(percent(1)).toBe('100%');
		expect.soft(percent(0)).toBe('0%');
		expect.soft(percent(0.05, 1, { pad: 'zeros' })).toBe('005%'); // 5.0 -> 5 -> 005
		expect.soft(percent(0.05, 0, { pad: 'nbsp' })).toBe('\u00A05%');
		expect.soft(percent(0.005, 2, { pad: 'nbsp' })).toBe('\u00A00.5%');
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

const MAX_LENGTH = 2_000;

/**
 * Truncates a message to MAX_LENGTH characters, appending an ellipsis and
 * logging a warning when truncated.
 * @param {string} result
 * @param {unknown} originalError
 * @returns {string}
 */
function truncate(result, originalError) {
	if (result.length > MAX_LENGTH) {
		result = result.slice(0, MAX_LENGTH - 2) + '…';
		console.warn('Truncated error message', {
			message: result,
			originalError,
		});
	}
	return result;
}

/**
 * Extracts a display message from a single error value, stripping any
 * leading `Error: ` prefix and truncating to MAX_LENGTH.
 * @param {unknown} value
 * @returns {string}
 */
function errorPart(value) {
	const defaultMessage = 'Erreur inattendue';

	let result = value?.toString() || defaultMessage;

	if (value instanceof Error) {
		if ('message' in value && value.message) {
			result = value.message || defaultMessage;
		}
	} else if (value && typeof value === 'object') {
		if ('message' in value) {
			result = value.message?.toString() || defaultMessage;
		}
	}

	while (result.startsWith('Error: ')) {
		result = result.slice('Error: '.length);
	}

	return truncate(result, value);
}

/**
 *
 * @param {unknown} error
 * @param {string} [prefix]
 * @returns {string}
 */
export function errorMessage(error, prefix = '') {
	let result = errorPart(error);

	// Join nested causes with ": " until there's no more cause
	let cause = error instanceof Error ? error.cause : undefined;
	while (cause) {
		result = `${result}: ${errorPart(cause)}`;
		cause = cause instanceof Error ? cause.cause : undefined;
	}

	result = prefix ? `${prefix}: ${result}` : result;

	return truncate(result, error);
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

		// Nested causes are joined with ": " until there's no more cause
		const errorWithCause = new Error('main error', { cause: new Error('cause error') });
		expect(errorMessage(errorWithCause)).toBe('main error: cause error');
		const errorWithNestedCause = new Error('main error', {
			cause: new Error('cause error', { cause: new Error('nested cause') }),
		});
		expect(errorMessage(errorWithNestedCause)).toBe('main error: cause error: nested cause');

		// Each part is truncated to MAX_LENGTH (2000) characters, and the
		// joined result is truncated again as a whole
		const longMessage = 'a'.repeat(2_500);
		expect(errorMessage(new Error(longMessage))).toBe('a'.repeat(1_998) + '…');
		const longCause = new Error('main', { cause: new Error(longMessage) });
		expect(errorMessage(longCause)).toBe(`main: ${'a'.repeat(1_992)}…`);
	});
}

/**
 *
 * @returns {Language}
 */
export function localeFromNavigator() {
	if (!navigator.language) return 'fr';
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

/**
 *
 * @param {number} bytes byte count
 * @param {Intl.NumberFormatOptions['unitDisplay']} [unitDisplay] unit display style
 * @returns {string} formatted size
 */
export function formatBytesSize(bytes, unitDisplay = 'short') {
	// SI powers (so, in terms of powers of ten and not powers of two)
	const power = bytes < 1e3 ? 0 : bytes < 1e6 ? 3 : bytes < 1e9 ? 6 : bytes < 1e12 ? 9 : 12;

	const formatter = new Intl.NumberFormat(undefined, {
		style: 'unit',
		unitDisplay,
		unit: {
			0: 'byte',
			3: 'kilobyte',
			6: 'megabyte',
			9: 'gigabyte',
			12: 'terabyte',
		}[power],
	});

	const value = bytes / 10 ** power;

	const rounding = value > 10 ? 0 : value > 1 ? 1 : 2;

	const rounded = Math.round(value * 10 ** rounding) / 10 ** rounding;

	return formatter.format(rounded);
}
