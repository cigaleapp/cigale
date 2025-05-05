import { match } from 'arktype';

/**
 * @template {string} K
 * @template {any} VIn
 * @template {any} VOut
 * @param {Record<K, VIn>} subject
 * @param {(value: VIn) => VOut} mapper
 * @returns {Record<K, NoInfer<VOut>>}
 */
export function mapValues(subject, mapper) {
	// @ts-expect-error
	return Object.fromEntries(Object.entries(subject).map(([key, value]) => [key, mapper(value)]));
}

/**
 * Maps values of an object, and filters out entries with nullable values from the result
 * @template {string} K
 * @template {any} VIn
 * @template {any} VOut
 * @param {Record<K, VIn>} subject
 * @param {(value: VIn) => VOut} mapper
 * @returns {Record<K, NoInfer<NonNullable<VOut>>>}
 */
export function mapValuesNoNullables(subject, mapper) {
	return Object.fromEntries(
		Object.entries(subject)
			.map(([key, value]) => [key, mapper(value)])
			.filter(([, value]) => value !== null && value !== undefined)
	);
}

/**
 * @template {string} K
 * @param {Record<K, unknown>} subject
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
 * Omit some keys from an object
 * @template {string} KeysIn
 * @template {KeysIn} KeysOut
 * @template {any} V
 * @param {Record<KeysIn, V>} subject
 * @param {...KeysOut} keys
 * @returns {Record<Exclude<KeysIn, KeysOut>, V>}
 */
export function omit(subject, ...keys) {
	return fromEntries(entries(subject).filter(([key]) => !oneOf(key, keys)));
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

export function matches(subject, pattern) {
	return match.case(pattern, () => true).default(() => false)(subject);
}

/**
 * See https://github.com/microsoft/TypeScript/issues/19954
 * @param {number} value
 * @returns {-1|0|1}
 */
export function sign(value) {
	return Math.sign(value);
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

/**
 * @template {*} T
 * @typedef {{[K in keyof T]: Iterable<T[K]>}} ToIterables
 */

/**
 * @template {any[]} T
 * @param  {...ToIterables<T>} arrays
 * @returns {Generator<T>}
 */
export function* zip(...arrays) {
	// Get iterators for all of the iterables.
	const iterators = arrays.map((i) => i[Symbol.iterator]());

	while (true) {
		// Advance all of the iterators.
		const results = iterators.map((i) => i.next());

		// If any of the iterators are done, we should stop.
		if (results.some(({ done }) => done)) {
			break;
		}

		// We can assert the yield type, since we know none
		// of the iterators are done.
		yield /**  @type {T}  */ (results.map(({ value }) => value));
	}
}

/**
 * @template {*} T
 * @param {T[]} array
 * @returns {T[]}
 */
export function unique(array) {
	return [...new Set(array)];
}

/**
 *
 * @param {[number, number]} bounds of the range - can be in any order
 * @param {number} subject number to test for
 * @returns {boolean} whether the subject is in the range
 */
export function inRange(bounds, subject) {
	const [min, max] = bounds.sort((a, b) => a - b);
	return subject >= min && subject <= max;
}

/**
 *
 * @template {string} K
 * @param {Element} element
 * @param {K} name
 * @returns {element is Element & { dataset: Record<NoInfer<K>, string> }}
 */
export function hasDatasetKey(element, name) {
	if (!(element instanceof HTMLElement)) return false;
	if (!element.dataset) return false;
	return name in element.dataset;
}
