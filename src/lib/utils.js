/**
 * @template {string} K
 * @template {string} VIn
 * @template {string} VOut
 * @param {Record<K, VIn>} subject
 * @param {(value: VIn) => VOut} mapper
 * @returns {Record<K, NoInfer<VOut>>}
 */
export function mapValues(subject, mapper) {
	// @ts-expect-error
	return Object.fromEntries(Object.entries(subject).map(([key, value]) => [key, mapper(value)]));
}

/**
 * @template {string} K
 * @param {Record<K, string>} subject
 * @returns {K[]}
 */
export function keys(subject) {
	// @ts-expect-error
	return Object.keys(subject);
}

/**
 * @template {string} K
 * @template {any} V
 * @param {Array<[K, V]>} subject
 * @returns {Record<K, V>}
 */
export function fromEntries(subject) {
	// @ts-expect-error
	return Object.fromEntries(subject);
}

/**
 * @template {string} K
 * @template {string} V
 * @param {Record<K, V>} subject
 * @returns {Array<[K, V]>}
 */
export function entries(subject) {
	// @ts-expect-error
	return Object.entries(subject);
}

// Reverse keys and values
/**
 * @template {string} K
 * @template {string} V
 * @param {Record<K, V>} subject
 * @returns {Record<V, K>}
 */
export function invertRecord(subject) {
	return fromEntries(entries(subject).map(([key, value]) => [value, key]));
}

/**
 *
 * @param {string} str
 * @returns
 */
export function safeJSONParse(str) {
	try {
		return JSON.parse(str);
	} catch {
		return undefined;
	}
}
