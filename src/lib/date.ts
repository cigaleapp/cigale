// TODO(#1522): remove when Intl.DurationFormat is Baseline Widely Available (in Sep 2027)
import type { Interval } from 'date-fns';

import { DurationFormat } from '@formatjs/intl-durationformat';
import { intervalToDuration, isValid, parse } from 'date-fns';

export const SANE_ISO_DATE_FORMATS = [
	'yyyy-MM-dd',
	"yyyy-MM-dd'T'HH:mm:ss",
	"yyyy-MM-dd'T'HH:mm:ss.SSS",
	"yyyy-MM-dd'T'HH:mm:ssXXX",
	"yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
] as const;

/**
 * Returns a parsed date or undefined if a parse error occurs or the date is invalid
 * @param maybeDatestring a date string in the following formats:
 * - YYYY-MM-DD
 * - YYYY-MM-DDTHH:mm:ss
 * - YYYY-MM-DDTHH:mm:ssZ
 * - YYYY-MM-DDTHH:mm:ss±HH:mm
 *
 * We don't accept any other [valid, but insane ISO datestring](https://bsky.app/profile/gwen.works/post/3ljvdiur2lc2s)
 */
export function parseISOSafe(maybeDatestring: string) {
	return tryParseDate(maybeDatestring, ...SANE_ISO_DATE_FORMATS);
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe('parseISOSafe', () => {
		test('works on sane ISO 8601 datestrings', () => {
			expect(parseISOSafe('2023-10-01')).toBeInstanceOf(Date);
			expect(parseISOSafe('2023-10-01T12:00:00')).toBeInstanceOf(Date);
			expect(parseISOSafe('2023-10-01T12:00:00Z')).toBeInstanceOf(Date);
			expect(parseISOSafe('2023-10-01T12:00:00+02:00')).toBeInstanceOf(Date);
			expect(parseISOSafe('2025-04-25T12:38:36.000Z')).toBeInstanceOf(Date);
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
 */
export function tryParseDate(maybeDatestring: string, ...formats: string[]): Date | undefined {
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
			expect(tryParseDate('2023-10-01', 'yyyy-MM-dd')).toBeInstanceOf(Date);
			expect(tryParseDate('2023-10-01T12:00:00', "yyyy-MM-dd'T'HH:mm:ss")).toBeInstanceOf(
				Date
			);
			expect(tryParseDate('2023-10-01T12:00:00Z', "yyyy-MM-dd'T'HH:mm:ssXXX")).toBeInstanceOf(
				Date
			);
		});
		test('returns undefined for Invalid Date datestrings', () => {
			expect(tryParseDate('2019-05-09T08:25:22+0000')).toBeUndefined();
		});
		test('returns undefined for malformed datestrings', () => {
			expect(tryParseDate('2023_10-01', 'yyyy-MM-dd')).toBeUndefined();
			expect(tryParseDate('chicken jockey')).toBeUndefined();
		});
	});
}

/**
 * Formats a duration, in a stopwatch / scoreboard format (XX:XX'XX")
 */
export function formatDurationStopwatch(durationMs: number): `${number}:${number}'${number}"` {
	const { hours, minutes, seconds } = intervalToDuration({
		start: Date.now(),
		end: Date.now() + durationMs,
	});

	const [h, m, s] = [hours, minutes, seconds].map(
		(val) => (val ?? 0).toString().padStart(2, '0') as `${number}`
	);

	return `${h}:${m}'${s}"` as const;
}

export function formatDurationShort(locale: string, durationMs: number) {
	return formatDistanceToNowShortParts(locale, {
		start: 0,
		end: durationMs,
	}).join('');
}

/**
 * Formats a date as a distance to now, but in a short format (e.g. "5m" instead of "5 minutes ago")
 * Uses Intl.DurationFormat#formatToParts under the hood
 * @returns array of non-whitespace-only parts. In practice, this is a alternating array of numbers and unit strings, in descending order of magnitude (e.g. ["1", "d", "5", "hr"] for "1 day and 5 hours ago"). Useful if you have not much space and wanna cut it to e.g. only "1d" instead of "1d 5hr".
 */
export function formatDistanceToNowShortParts(
	locale: string,
	date: Interval | Date | number
): string[] {
	return new DurationFormat(locale, { style: 'narrow' })
		.formatToParts(
			intervalToDuration(
				date instanceof Date || typeof date === 'number'
					? {
							start: Date.now(),
							end: date,
						}
					: date
			)
		)
		.map((part) => part.value)
		.filter((value) => value.trim());
}

if (import.meta.vitest) {
	const { test, expect, describe, vi } = import.meta.vitest;

	describe('formatDistanceToNowShortParts', () => {
		test('formats distance to now in short parts', () => {
			const now = Date.now();
			vi.useFakeTimers().setSystemTime(now);
			expect(
				formatDistanceToNowShortParts('en-US', new Date(now - 1000 * 60 * 60 * 24))
			).toEqual(['-', '1', 'd']);
			expect(formatDistanceToNowShortParts('en-US', new Date(now + 1000 * 60 * 5))).toEqual([
				'5',
				'm',
			]);
			expect(
				formatDistanceToNowShortParts('en-US', new Date(now + 1000 * 60 * 60 * 26))
			).toEqual(['1', 'd', '2', 'h']);
		});
	});
}
