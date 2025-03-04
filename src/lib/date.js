import { parse } from 'date-fns';

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
			if (!isNaN(date.getTime())) {
				return date;
			}
		} catch {
			continue;
		}
	}
	return undefined;
}
