import { parseISO } from 'date-fns';

/**
 * Returns a parsed date or undefined if a parse error occurs or the date is invalid
 * @param {string} maybeDatestring
 */
export function parseISOSafe(maybeDatestring) {
	try {
		const date = parseISO(maybeDatestring);
		if (isNaN(date.getTime())) {
			return undefined;
		}
		return date;
	} catch {
		return undefined;
	}
}
