import { isValid, parse } from 'date-fns';

/**
 * Returns a parsed date or undefined if a parse error occurs or the date is invalid
 * @param {string} maybeDatestring a date string in the following formats:
 * - YYYY-MM-DD
 * - YYYY-MM-DDTHH:mm:ss
 * - YYYY-MM-DDTHH:mm:ssZ
 * - YYYY-MM-DDTHH:mm:ss±HH:mm
 *
 * We don't accept any other [valid, but insane ISO datestring](https://bsky.app/profile/gwen.works/post/3ljvdiur2lc2s)
 */
export function parseISOSafe(maybeDatestring) {
	return tryParse(
		maybeDatestring,
		'yyyy-MM-dd',
		"yyyy-MM-dd'T'HH:mm:ss",
		"yyyy-MM-dd'T'HH:mm:ssXXX"
	);
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe('parseISOSafe', () => {
		test('works on sane ISO 8601 datestrings', () => {
			expect(parseISOSafe('2023-10-01')).toBeInstanceOf(Date);
			expect(parseISOSafe('2023-10-01T12:00:00')).toBeInstanceOf(Date);
			expect(parseISOSafe('2023-10-01T12:00:00Z')).toBeInstanceOf(Date);
			expect(parseISOSafe('2023-10-01T12:00:00+02:00')).toBeInstanceOf(Date);
		});
		test('does not parse "61"', () => {
			// Crazy right??
			expect(parseISOSafe('61')).toBeUndefined();
		});
	});
}

/**
 * Returns a parsed date or undefined if a parse error occurs or the date is invalid,
 * trying the given formats in order
 * @param {string} maybeDatestring
 * @param  {...string} formats
 * @returns {Date|undefined}
 */
function tryParse(maybeDatestring, ...formats) {
	for (const format of formats) {
		try {
			const date = parse(maybeDatestring, format, new Date());
			if (isValid(date)) return date;
		} catch {
			continue;
		}
	}
	return undefined;
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe('tryParse', () => {
		test('works on valid datestrings', () => {
			expect(tryParse('2023-10-01', 'yyyy-MM-dd')).toBeInstanceOf(Date);
			expect(tryParse('2023-10-01T12:00:00', "yyyy-MM-dd'T'HH:mm:ss")).toBeInstanceOf(Date);
			expect(tryParse('2023-10-01T12:00:00Z', "yyyy-MM-dd'T'HH:mm:ssXXX")).toBeInstanceOf(
				Date
			);
		});
		test('returns undefined for Invalid Date datestrings', () => {
			expect(tryParse('2019-05-09T08:25:22+0000')).toBeUndefined();
		});
		test('returns undefined for malformed datestrings', () => {
			expect(tryParse('2023_10-01', 'yyyy-MM-dd')).toBeUndefined();
			expect(tryParse('chicken jockey')).toBeUndefined();
		});
	});
}
