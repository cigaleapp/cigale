import { type } from 'arktype';
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
 * Get the completion percentage of each language in the CIGALE project on Weblate.
 * Stores in localStorage, and only fetches from Weblate once the cached localStorage entry is stale, which has a stale date set according to the response's X-RateLimit-Reset header.
 * @returns {Promise<Record<string, number>>} map of language codes to number in [0, 1] indicating the completion percentage
 */
export async function languagesCompletions() {
	const { browser } = await import('$app/environment');
	if (!browser) return {};

	const cached = localStorage.getItem('languagesCompletions');
	if (cached) {
		const { data, expiresAt } = type({
			data: { '[string==2]': '0<=number<=1' },
			expiresAt: 'number.epoch'
		}).assert(JSON.parse(cached));

		if (expiresAt > Date.now()) return data;
	}

	const response = await fetch('https://weblate.gwen.works/api/projects/cigale/languages/');
	if (!response.ok) {
		throw new Error(`Failed to fetch languages completions: ${response.statusText}`);
	}

	const data = type({ code: 'string==2', translated_words_percent: '0 <= number <= 100' })
		.array()
		.assert(await response.json());

	const completions = Object.fromEntries(
		data.map(({ code, translated_words_percent }) => [code, translated_words_percent / 100])
	);

	let expiresInSeconds = parseInt(response.headers.get('X-RateLimit-Reset') ?? '0');
	if (isNaN(expiresInSeconds)) {
		expiresInSeconds = 0;
	}

	localStorage.setItem(
		'languagesCompletions',
		JSON.stringify({
			data: completions,
			expiresAt: Date.now() + expiresInSeconds * 1000
		})
	);

	return completions;
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
