import fetchProgress from 'fetch-progress';

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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('mapValues', () => {
		expect(mapValues({ a: 1, b: 2 }, (v) => v + 1)).toEqual({ a: 2, b: 3 });
		expect(mapValues({ a: 1, b: 2 }, (v) => v.toString())).toEqual({ a: '1', b: '2' });
	});
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

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;
	describe('mapValuesNoNullables', () => {
		test('without any nullables', () => {
			expect(mapValuesNoNullables({ a: 1, b: 2 }, (v) => v + 1)).toEqual({ a: 2, b: 3 });
		});
		test('with nullables', () => {
			expect(mapValuesNoNullables({ a: 1, b: null }, (v) => (v ? v + 1 : v))).toEqual({ a: 2 });
		});
		test('with only nullables', () => {
			expect(mapValuesNoNullables({ a: 1, b: 2 }, (v) => (v % 2 ? null : undefined))).toEqual({});
		});
	});
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('keys', () => {
		expect(keys({ a: 1, b: 2 })).toEqual(['a', 'b']);
		expect(keys({})).toEqual([]);
	});
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('fromEntries', () => {
		expect(
			fromEntries([
				['a', 1],
				['b', 2]
			])
		).toEqual({ a: 1, b: 2 });
		expect(fromEntries([])).toEqual({});
	});
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('entries', () => {
		expect(entries({ a: 1, b: 2 })).toEqual([
			['a', 1],
			['b', 2]
		]);
		expect(entries({})).toEqual([]);
	});
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('invertRecord', () => {
		expect(invertRecord({ a: '1', b: '2', c: 'd' })).toEqual({ 1: 'a', 2: 'b', d: 'c' });
		expect(invertRecord({})).toEqual({});
	});
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('oneOf', () => {
		expect(oneOf('a', ['a', 'b', 'c'])).toBe(true);
		expect(oneOf('d', ['a', 'b', 'c'])).toBe(false);
	});
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('hasOnce', () => {
		expect(hasOnce('a', ['a', 'b', 'c'])).toBe(true);
		// @ts-expect-error
		expect(hasOnce('d', ['a', 'b', 'c'])).toBe(false);
		expect(hasOnce('a', ['a', 'b', 'c', 'a'])).toBe(false);
	});
}

/**
 *
 * @param {...any} args
 * @returns {boolean}
 */
export function xor(...args) {
	if (args.length === 0) return false;
	const [first, ...rest] = args;
	return xor(...rest) !== Boolean(first);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('xor', () => {
		expect(xor()).toBe(false);
		expect(xor(true)).toBe(true);
		expect(xor(false)).toBe(false);
		expect(xor(true, false)).toBe(true);
		expect(xor(false, true)).toBe(true);
		expect(xor(true, true)).toBe(false);
		expect(xor(false, false)).toBe(false);
	});
}

/**
 * @param {...any} args
 * @returns {boolean}
 */
export function or(...args) {
	return args.some(Boolean);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('or', () => {
		expect(or()).toBe(false);
		expect(or(true)).toBe(true);
		expect(or(false)).toBe(false);
		expect(or(true, false)).toBe(true);
		expect(or(false, true)).toBe(true);
		expect(or(true, true)).toBe(true);
		expect(or(false, false)).toBe(false);
	});
}

/**
 * Pick only some keys from an object
 * @template {string & keyof Obj} KeysOut
 * @template {*} Obj
 * @param {Obj} subject
 * @param {...KeysOut} keys
 * @returns {Pick<Obj, KeysOut>}
 */
export function pick(subject, ...keys) {
	// We're not using fromEntries and entries with a filter, because Object.fromEntries does not return $derived or $state fields from classes
	// see https://svelte.dev/playground/32a7d1c8995f45b49f01b7ae86fef7bd?version=5.38.7

	const result = /** @type {Pick<Obj, KeysOut>} */ ({});
	for (const key of keys) {
		result[key] = subject[key];
	}
	return result;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('pick', () => {
		expect(pick({ a: 1, b: 2 }, 'a')).toEqual({ a: 1 });
		expect(pick({ a: 1, b: 2 }, 'b')).toEqual({ b: 2 });
		expect(pick({ a: 1, b: 2 }, 'a', 'b')).toEqual({ a: 1, b: 2 });
		// @ts-expect-error
		expect(pick({ a: 1, b: 2 }, 'c')).toEqual({});

		class Test {
			/** @type {number} */
			id = 0;
			/** @type {string} */
			name = '';
		}

		const testZero = new Test();
		const testOne = new Test();
		testOne.id = 1;

		expect(pick(testZero, 'id')).toEqual({ id: 0 });
		expect(pick(testOne, 'id')).toEqual({ id: 1 });
		expect(pick(testOne, 'name')).toEqual({ name: '' });
	});
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('omit', () => {
		expect(omit({ a: 1, b: 2 }, 'a')).toEqual({ b: 2 });
		expect(omit({ a: 1, b: 2 }, 'b')).toEqual({ a: 1 });
		expect(omit({ a: 1, b: 2 }, 'a', 'b')).toEqual({});
		expect(omit({ a: 1, b: 2 }, 'c')).toEqual({ a: 1, b: 2 });
	});
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('safeJSONParse', () => {
		expect(safeJSONParse('{"a":1}')).toEqual({ a: 1 });
		expect(safeJSONParse('{"a":1')).toBeUndefined();
		expect(safeJSONParse(null)).toBeUndefined();
		expect(safeJSONParse(undefined)).toBeUndefined();
	});
}

/**
 * @param {*} value
 */
export function safeJSONStringify(value) {
	try {
		return JSON.stringify(value);
	} catch {
		return undefined;
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('safeJSONStringify', () => {
		expect(safeJSONStringify({ a: 1 })).toEqual('{"a":1}');
		expect(safeJSONStringify(undefined)).toBeUndefined();
		expect(safeJSONStringify(null)).toBe('null');
		expect(safeJSONStringify(Symbol('feur'))).toBeUndefined();
	});
}

/**
 * See https://github.com/microsoft/TypeScript/issues/19954
 * @param {number} value
 * @returns {-1|0|1}
 */
export function sign(value) {
	// @ts-expect-error
	return Math.sign(value);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('sign', () => {
		expect(sign(1)).toBe(1);
		expect(sign(-1)).toBe(-1);
		expect(sign(0)).toBe(0);
		expect(sign(-0)).toBe(-0); // 💀💀💀
		expect(sign(NaN)).toBeNaN();
		expect(sign(6732)).toBe(1);
		expect(sign(-667)).toBe(-1);
		expect(sign(Infinity)).toBe(1);
		expect(sign(-Infinity)).toBe(-1);
	});
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('clamp', () => {
		expect(clamp(1, 0, 2)).toBe(1);
		expect(clamp(-1, 0, 2)).toBe(0);
		expect(clamp(3, 0, 2)).toBe(2);
		expect(clamp(0, 0, 2)).toBe(0);
		expect(clamp(-67, -5, 2)).toBe(-5);
	});
}

/**
 * @template {*} T
 * @typedef {{[K in keyof T]: Iterable<T[K]>}} ToIterables
 */

/**
 * @template {any[]} T
 * @param  {...ToIterables<T>} arrays
 * @yields {T}
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

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;
	describe('zip', () => {
		test('works with 2 iterators', () => {
			expect([...zip([1, 2], ['a', 'b'])]).toEqual([
				[1, 'a'],
				[2, 'b']
			]);
		});
		test('works with 3 iterators', () => {
			expect([...zip([1, 2], ['a', 'b'], [true, false])]).toEqual([
				[1, 'a', true],
				[2, 'b', false]
			]);
		});
		test('works with asymmetrically-sized iterators', () => {
			expect([...zip([1, 2, 3], [[], []])]).toEqual([
				[1, []],
				[2, []]
			]);
		});
	});
}

/**
 * @template {*} T
 * @param {T[]} array
 * @returns {T[]}
 */
export function unique(array) {
	return [...new Set(array)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('unique', () => {
		expect(unique([1, 2, 3, 1, 2])).toEqual([1, 2, 3]);
		expect(unique(['a', 'b', 'c', 'a', 'b'])).toEqual(['a', 'b', 'c']);
		expect(unique([])).toEqual([]);
	});
}

/**
 * @param {Uint8Array} uint8Array
 * @returns {ArrayBuffer}
 */
export function uint8ArrayToArrayBuffer(uint8Array) {
	return uint8Array.buffer.slice(
		uint8Array.byteOffset,
		uint8Array.byteOffset + uint8Array.byteLength
	);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('uint8ArrayToArrayBuffer', () => {
		const uint8Array = new Uint8Array([1, 2, 3]);
		const arrayBuffer = uint8ArrayToArrayBuffer(uint8Array);
		expect(arrayBuffer).toBeInstanceOf(ArrayBuffer);
		expect(new Uint8Array(arrayBuffer)).toEqual(uint8Array);
	});
}

/**
 * extension is all the last dotted parts: thing.tar.gz is [thing, tar.gz]
 * @param {string} filename
 * @returns [string, string] [filename without extension, extension]
 */
export function splitFilenameOnExtension(filename) {
	const match = filename.match(/^([^.]+)\.(.+)$/);
	if (!match) return [filename, ''];
	return [match[1], match[2]];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('splitFilenameOnExtension', () => {
		expect(splitFilenameOnExtension('file.txt')).toEqual(['file', 'txt']);
		expect(splitFilenameOnExtension('file')).toEqual(['file', '']);
		expect(splitFilenameOnExtension('file.tar.gz')).toEqual(['file', 'tar.gz']);
	});
}

/**
 * @template Item
 * @param {(item: Item) => string|number} key function to create the comparator function with. Should return a string (will be used with localeCompare) or a number (will be subtracted)
 */
export function compareBy(key) {
	/**
	 * @param {Item} a
	 * @param {Item} b
	 * @returns {number}
	 */
	return (a, b) => {
		const aKey = key(a);
		const bKey = key(b);

		if (aKey === bKey) return 0;
		if (typeof aKey === 'string' && typeof bKey === 'string') {
			return aKey.localeCompare(bKey);
		}

		if (typeof aKey === 'number' && typeof bKey === 'number') {
			return aKey - bKey;
		}

		return aKey.toString().localeCompare(bKey.toString());
	};
}

/**
 * Add a v= query parameter to the URL to force the browser to reload the resource, using  Date.now() as the value
 * @template {string|URL} T
 * @param {T} url
 * @returns {T}
 */
export function cachebust(url) {
	const parsedUrl = new URL(url);
	parsedUrl.searchParams.set('v', Date.now().toString());
	if (typeof url === 'string') {
		// @ts-expect-error
		return parsedUrl.toString();
	}
	// @ts-expect-error
	return parsedUrl;
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;
	describe('cachebust', () => {
		test('without any query params', () => {
			const url = 'https://example.com/resource';
			const cachebustedUrl = cachebust(url);
			expect(URL.canParse(cachebustedUrl)).toBeTruthy();
			expect([...new URL(cachebustedUrl).searchParams.entries()]).toEqual([
				['v', expect.stringMatching(/^\d+$/)]
			]);
		});
		test('with existing query params', () => {
			const url = 'https://example.com/resource?param=value';
			const cachebustedUrl = cachebust(url);
			expect(URL.canParse(cachebustedUrl)).toBeTruthy();
			expect(new URL(cachebustedUrl).searchParams.get('param')).toBe('value');
			expect(new URL(cachebustedUrl).searchParams.get('v')).toMatch(/^\d+$/);
		});
		test('with a parsed URL', () => {
			const url = new URL('https://example.com/resource?param=value');
			const cachebustedUrl = cachebust(url);
			expect(cachebustedUrl).toBeInstanceOf(URL);
			expect(cachebustedUrl.searchParams.get('param')).toBe('value');
			expect(cachebustedUrl.searchParams.get('v')).toMatch(/^\d+$/);
		});
	});
}

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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('range', () => {
		expect(range(5)).toEqual([0, 1, 2, 3, 4]);
		expect(range(2, 5)).toEqual([2, 3, 4]);
		expect(range(5, 2)).toEqual([]);
		expect(range(3, 3)).toEqual([]);
		expect(range(3, 4)).toEqual([3]);
	});
}

/**
 * @param {typeof import('$lib/schemas/common.js').HTTPRequest.infer} request
 * @param {object} options
 * @param {''|'model'} [options.cacheAs=""]
 * @param {import('fetch-progress').FetchProgressInitOptions['onProgress']} [options.onProgress]
 */
export async function fetchHttpRequest(request, { cacheAs = '', onProgress }) {
	let url = new URL(typeof request === 'string' ? request : request.url);
	const options = typeof request === 'string' ? { headers: {} } : request;
	if (cacheAs) {
		url.searchParams.set('x-cigale-cache-as', cacheAs);
	}

	// const promise = fetch(url, options);
	// if (onProgress) promise.then(fetchProgress({ onProgress }));

	// return promise;

	if (onProgress) return fetch(url, options).then(fetchProgress({ onProgress }));

	return fetch(url, options);
}

/** @param {Iterable<number>} values */
export function sum(values) {
	return values.reduce((acc, cur) => acc + cur, 0);
}

/** @param {number[]} values  */
export function avg(values) {
	return sum(values) / values.length;
}

/**
 * @template {any} T
 * @param {T} value
 * @returns {value is NonNullable<T>}
 */
export function nonnull(value) {
	return value !== null && value !== undefined;
}

/**
 * @param {number} value
 * @param {number} decimals
 * @returns {number}
 */
export function round(value, decimals = 0) {
	if (decimals < 0) throw new Error('decimals must be non-negative');
	const factor = Math.pow(10, decimals);
	return Math.round(value * factor) / factor;
}

/**
 *
 * @param {object} param0  offset coords from the given rect
 * @param {number} param0.offsetX
 * @param {number} param0.offsetY
 * @param {DOMRect} rect
 * @param {number} leeway how many pixels to consider still "inside" the rect even if it's outside
 * @returns
 */
export function insideBoundingClientRect({ offsetX, offsetY }, rect, leeway = 0) {
	return (
		offsetX >= -leeway &&
		offsetX <= rect.width + leeway &&
		offsetY >= -leeway &&
		offsetY <= rect.height + leeway
	);
}

/**
 *
 * @param {string} contentType
 * @returns {contentType is 'application/zip' | 'application/x-zip-compressed' | 'application/x-zip' }
 */
export function isZip(contentType) {
	return (
		contentType === 'application/zip' ||
		contentType === 'application/x-zip-compressed' ||
		contentType === 'application/x-zip'
	);
}

/**
 * @template T
 * @param {string} tag
 * @param {T} expr
 * @returns {T}
 */
export function logexpr(tag, expr) {
	// oxlint-disable-next-line no-console
	console.log(`{${tag}}`, expr);
	return expr;
}
