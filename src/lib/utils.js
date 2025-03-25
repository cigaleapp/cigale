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
 * @template {any} V
 * @param {Record<K, V>} subject
 * @returns {Array<[K, V]>}
 */
export function entries(subject) {
	// @ts-expect-error
	return Object.entries(subject);
}

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
 * Checks that a value is included in a list of values
 * @template {string} T
 * @param {string} value
 * @param {T[]} values
 * @returns {value is T}
 */
export function oneOf(value, values) {
	// @ts-expect-error
	return values.includes(value);
}

/**
 *
 * @template {string} T
 * @template {T} U
 * @param {U} value
 * @param {T[]} values
 * @returns {values is [...Omit<T, U>[], U, ...Omit<T, U>[]]}
 */
export function hasOnce(value, values) {
	return values.filter((v) => v === value).length === 1;
}

/**
 *
 * @param {...any} args
 * @returns {boolean}
 */
export function xor(...args) {
	if (args.length === 0) return false;
	const [first, ...rest] = args;
	return xor(...rest) !== first;
}

/**
 * @param {...any} args
 * @returns {boolean}
 */
export function or(...args) {
	return args.some(Boolean);
}

/**
 * Pick only some keys from an object
 * @template {string} KeysIn
 * @template {KeysIn} KeysOut
 * @template {any} V
 * @param {Record<KeysIn, V>} subject
 * @param {...KeysOut} keys
 * @returns {Record<KeysOut, V>}
 */
export function pick(subject, ...keys) {
	return fromEntries(entries(subject).filter(([key]) => oneOf(key, keys)));
}

/**
 *
 * @param {*} str
 * @returns
 */
export function safeJSONParse(str) {
	try {
		return JSON.parse(str?.toString() ?? '');
	} catch {
		return undefined;
	}
}
