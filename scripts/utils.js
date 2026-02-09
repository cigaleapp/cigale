/**
 * Semi-open range [start=0, end)
 * @param {number} startOrEnd
 * @param {number|undefined} [end]
 * @returns {number[]}
 */
export function range(startOrEnd, end = undefined) {
	if (end === undefined) {
		return Array.from({ length: startOrEnd }, (_, i) => i);
	}
	return Array.from({ length: end - startOrEnd }, (_, i) => i + startOrEnd);
}
