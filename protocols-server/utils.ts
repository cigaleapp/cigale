/**
 * Minimal local utilities so that `protocols-server` is self-contained and does
 * not pull in the heavy `#lib/utils.js` module (and its transitive dependencies)
 * at runtime. These are verbatim copies of the implementations in
 * `src/lib/utils.ts`.
 */

export function nonnull<T>(value: T): value is NonNullable<T> {
	return value !== null && value !== undefined;
}

export function ensureArray<T>(subject: T | T[]): T[] {
	return Array.isArray(subject) ? subject : [subject];
}

/**
 * Replaces accents and punctuations with dashes, lowercases, and replaces
 * accents with ASCII equivalents.
 */
export function slugify(text: string): string {
	const result = text
		.normalize(/* @wc-ignore */ 'NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase();

	if (!result) throw new Error(`Cannot slugify "${text}" (result is empty)`);

	return result;
}
