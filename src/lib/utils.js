// @wc-ignore-file

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
			expect(mapValuesNoNullables({ a: 1, b: null }, (v) => (v ? v + 1 : v))).toEqual({
				a: 2
			});
		});
		test('with only nullables', () => {
			expect(mapValuesNoNullables({ a: 1, b: 2 }, (v) => (v % 2 ? null : undefined))).toEqual(
				{}
			);
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
 * @template {string} KIn
 * @template {any} VIn
 * @template {string} KOut
 * @template {any} VOut
 * @param {Record<KIn, VIn>} subject
 * @param {(key: KIn, value: VIn) => [KOut, VOut]} mapper
 * @returns {Record<KOut, VOut>}
 */
export function mapEntries(subject, mapper) {
	return fromEntries(entries(subject).map(([key, value]) => mapper(key, value)));
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
 * @param {(item: T) => string|number} [key]
 * @returns {T[]}
 */
// @ts-expect-error key should be non-optional if T is not string|number
export function unique(array, key = (x) => x) {
	const seen = new Set();
	return array.filter((item) => {
		const k = key(item);
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('unique', () => {
		expect(unique([1, 2, 3, 1, 2])).toEqual([1, 2, 3]);
		expect(unique(['a', 'b', 'c', 'a', 'b'])).toEqual(['a', 'b', 'c']);
		expect(unique([])).toEqual([]);
		expect(unique([{ id: 1 }, { id: 2 }, { id: 1 }], (o) => o.id)).toEqual([
			{ id: 1 },
			{ id: 2 }
		]);
		expect(unique([{ id: 1 }, { id: 2 }, { id: 1 }], (o) => o.id.toString())).toEqual([
			{ id: 1 },
			{ id: 2 }
		]);
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
 * @template T
 * @typedef {(a: T, b: T) => number} Comparator
 */

/**
 * @template Item
 * @param {((item: Item) => string|number|undefined) | (keyof Item & string) } key function to create the comparator function with. Should return a string (will be used with localeCompare) or a number (will be subtracted)
 * @returns {Comparator<Item>}
 */
export function compareBy(key) {
	if (typeof key === 'string') {
		return compareBy((item) => item[key]);
	}

	/**
	 * @param {Item} a
	 * @param {Item} b
	 * @returns {number}
	 */
	return (a, b) => {
		const aKey = key(a);
		const bKey = key(b);

		if (aKey === undefined && bKey === undefined) return 0;
		if (aKey === undefined) return -1;
		if (bKey === undefined) return 1;

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

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe('compareBy', () => {
		test('.sort works', () => {
			const items = [
				{ id: 2, name: 'b' },
				{ id: 1, name: 'a' },
				{ id: 3, name: 'c' }
			];

			expect([...items].sort(compareBy((i) => i.id))).toEqual([
				{ id: 1, name: 'a' },
				{ id: 2, name: 'b' },
				{ id: 3, name: 'c' }
			]);

			expect([...items].sort(compareBy((i) => i.name))).toEqual([
				{ id: 1, name: 'a' },
				{ id: 2, name: 'b' },
				{ id: 3, name: 'c' }
			]);
		});

		test('it works', () => {
			const items = [
				{ id: 2, name: 'b' },
				{ id: 1, name: 'a' },
				{ id: 3, name: 'c' }
			];

			expect(compareBy((i) => i.id)(items[0], items[1])).toBe(1);
			expect(compareBy((i) => i.id)(items[1], items[0])).toBe(-1);
			expect(compareBy((i) => i.id)(items[0], items[0])).toBe(0);

			expect(compareBy((i) => i.name)(items[0], items[1])).toBe(1);
			expect(compareBy((i) => i.name)(items[1], items[0])).toBe(-1);
			expect(compareBy((i) => i.name)(items[0], items[0])).toBe(0);
		});

		test('it works with key strings', () => {
			const items = [
				{ id: 2, name: 'b' },
				{ id: 1, name: 'a' },
				{ id: 3, name: 'c' }
			];

			expect(compareBy('id')(items[0], items[1])).toBe(1);
			expect(compareBy('name')(items[1], items[0])).toBe(-1);
			expect(compareBy('id')(items[0], items[0])).toBe(0);
		});
	});
}

/**
 * Returns a new comparator that takes into account a given sorting direction. Input comparator is assumed to be sorting in asc order.
 * @template T
 * @param {'asc'|'desc'} direction
 * @param {Comparator<T>} comparator
 * @returns {Comparator<T>}
 */
export function applySortDirection(direction, comparator) {
	const mul = direction === 'asc' ? 1 : -1;
	return (a, b) => mul * comparator(a, b);
}

/**
 * Add a v= query parameter to the URL to force the browser to reload the resource, using  Date.now() as the value
 * @template {string|URL} T
 * @param {T} url
 * @returns {T}
 */
export function cachebust(url) {
	const parsedUrl = new URL(url);
	// TODO use x-cigale-cache-bust instead of v
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
 * @param {object} [options]
 * @param {''|'model'} [options.cacheAs=""]
 * @param {import('fetch-progress').FetchProgressInitOptions['onProgress']} [options.onProgress]
 * @param {AbortSignal} [options.signal]
 */
export async function fetchHttpRequest(request, { cacheAs = '', onProgress, signal } = {}) {
	let url = new URL(typeof request === 'string' ? request : request.url);

	/** @type {RequestInit} */
	const options = typeof request === 'string' ? { headers: {} } : request;

	if (cacheAs) {
		url.searchParams.set('x-cigale-cache-as', cacheAs);
	}

	if (signal) {
		options.signal = signal;
	}

	if (onProgress) return fetch(url, options).then(fetchProgress({ onProgress }));

	return fetch(url, options);
}

if (import.meta.vitest) {
	const { it, describe, expect, vi } = import.meta.vitest;
	describe('fetchHttpRequest', async () => {
		it('works with a simple URL string', async () => {
			const fetchMock = vi.fn(() =>
				Promise.resolve(
					new Response(JSON.stringify({ success: true }), {
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					})
				)
			);
			vi.stubGlobal('fetch', fetchMock);

			const response = await fetchHttpRequest(
				'https://example.com/api?q=test&another=param',
				{
					cacheAs: 'model'
				}
			);
			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(fetchMock).toHaveBeenCalledWith(
				new URL('https://example.com/api?q=test&another=param&x-cigale-cache-as=model'),
				{ headers: {} }
			);
			const data = await response.json();
			expect(data).toEqual({ success: true });

			// Clean up
			vi.unstubAllGlobals();
		});
		it('works with a full request object', async () => {
			const fetchMock = vi.fn(() =>
				Promise.resolve(
					new Response(JSON.stringify({ success: true }), {
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					})
				)
			);
			vi.stubGlobal('fetch', fetchMock);

			const request = /** @type {const} */ ({
				url: 'https://example.com/api',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ key: 'value' })
			});

			const response = await fetchHttpRequest(request, { cacheAs: 'model' });
			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(fetchMock).toHaveBeenCalledWith(
				new URL('https://example.com/api?x-cigale-cache-as=model'),
				request
			);
			const data = await response.json();
			expect(data).toEqual({ success: true });

			// Clean up
			vi.unstubAllGlobals();
		});
	});
}

/** @param {Iterable<number>} values */
export function sum(values) {
	return [...values].reduce((acc, cur) => acc + cur, 0);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('sum', () => {
		expect(sum([1, 2, 3])).toBe(6);
		expect(sum([])).toBe(0);
		expect(sum([-1, 1])).toBe(0);
	});
}

/** @param {number[]} values  */
export function avg(values) {
	return sum(values) / values.length;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('avg', () => {
		expect(avg([1, 2, 3])).toBe(2);
		expect(avg([1, 1, 1])).toBe(1);
		expect(avg([1, 3])).toBe(2);
	});
}

/**
 * @template {any} T
 * @param {T} value
 * @returns {value is NonNullable<T>}
 */
export function nonnull(value) {
	return value !== null && value !== undefined;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('nonnull', () => {
		expect(nonnull(1)).toBe(true);
		expect(nonnull(0)).toBe(true);
		expect(nonnull('a')).toBe(true);
		expect(nonnull('')).toBe(true);
		expect(nonnull(true)).toBe(true);
		expect(nonnull(false)).toBe(true);
		expect(nonnull({})).toBe(true);
		expect(nonnull([])).toBe(true);
		expect(nonnull(null)).toBe(false);
		expect(nonnull(undefined)).toBe(false);
	});
}

/**
 * @param {number} value
 * @param {number} decimals if negative, rounds to tens, hundreds, etc.
 * @returns {number}
 */
export function round(value, decimals = 0) {
	const factor = Math.pow(10, Math.abs(decimals));

	if (decimals < 0) {
		return Math.round(value / factor) * factor;
	}

	return Math.round(value * factor) / factor;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('round', () => {
		expect(round(1.2345)).toBe(1);
		expect(round(1.5)).toBe(2);
		expect(round(1.4, 1)).toBe(1.4);
		expect(round(1.2345, 2)).toBe(1.23);
		expect(round(1.2355, 2)).toBe(1.24);
		expect(round(-1.2355, 2)).toBe(-1.24);
		expect(round(-1.2345, 2)).toBe(-1.23);
		expect(round(1.23456789, 5)).toBe(1.23457);
		expect(round(1.23456789, 8)).toBe(1.23456789);
		expect(round(1.23456789, 10)).toBe(1.23456789);
		expect(round(12345, -1)).toBe(12350);
		expect(round(12345, -2)).toBe(12300);
		expect(round(12555, -2)).toBe(12600);
		expect(round(-12555, -2)).toBe(-12600);
		expect(round(-12345, -2)).toBe(-12300);
	});
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('insideBoundingClientRect', () => {
		const rect = new DOMRect(0, 0, 100, 100);
		expect(insideBoundingClientRect({ offsetX: 50, offsetY: 50 }, rect)).toBe(true);
		expect(insideBoundingClientRect({ offsetX: 0, offsetY: 0 }, rect)).toBe(true);
		expect(insideBoundingClientRect({ offsetX: 100, offsetY: 100 }, rect)).toBe(true);
		expect(insideBoundingClientRect({ offsetX: -1, offsetY: 50 }, rect)).toBe(false);
		expect(insideBoundingClientRect({ offsetX: 50, offsetY: -1 }, rect)).toBe(false);
		expect(insideBoundingClientRect({ offsetX: 101, offsetY: 50 }, rect)).toBe(false);
		expect(insideBoundingClientRect({ offsetX: 50, offsetY: 101 }, rect)).toBe(false);
		expect(insideBoundingClientRect({ offsetX: -1, offsetY: 50 }, rect, 2)).toBe(true);
		expect(insideBoundingClientRect({ offsetX: 50, offsetY: -1 }, rect, 2)).toBe(true);
		expect(insideBoundingClientRect({ offsetX: 101, offsetY: 50 }, rect, 2)).toBe(true);
		expect(insideBoundingClientRect({ offsetX: 50, offsetY: 101 }, rect, 2)).toBe(true);
	});
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

/**
 * Outputs a [0, 1] progress value based on the progress of several weighted ordered parts. A value for a part assumes that all other parts defined beforehand have completed. Weights are in [0, 1], and the last part can let the weight be what sums with the rest to 1
 *
 * @example
 * ```
 * // download part represents 70% of the total time, decompression 20%, and parsing the rest
 * const splitProgress = progressSplitter('download', 0.7, 'decompression', 0.2, 'parsing');
 *
 * // Download halfway there
 * splitProgress('download', 0.5) // 0.35
 * // Download finished, decompression 10% there
 * splitProgress('decompression', 0.1) // 0.72 = 0.7 + 0.2 * 0.1
 * // Decompression finished, parsing 50% there
 * splitProgress('parsing', 0.5) // 0.85 = 0.7 + 0.2 + 0.1 * 0.5  = 0.7 + 0.2 + (0.7 + 0.2 - 1) * 0.5
 * // Parsing finished
 * splitProgress('parsing', 1) // 1 = 0.7 + 0.2 + 0.1 * 1 = 0.7 + 0.2 + (0.7 + 0.2 - 1) * 1
 * ```
 * @template {string} PartName
 * @param {...(PartName | number)} layout
 * @returns {(part: PartName, progress: number) => number}
 */
export function progressSplitter(...layout) {
	/** @type {Array<[PartName, number]>} */
	let parts = [];

	for (let i = 0; i < layout.length; i += 2) {
		const name = /** @type {PartName} */ (layout[i]);
		const weight = /** @type {number} */ (layout[i + 1] ?? 1 - sum(parts.map(([, w]) => w)));

		parts.push([name, weight]);
	}

	return (part, progress) => {
		let total = 0;
		const partIndex = parts.findIndex(([name]) => name === part);
		for (const [i, [_, weight]] of parts.entries()) {
			if (i < partIndex) total += weight;
			if (i === partIndex) total += weight * progress;
		}

		return total;
	};
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('progressSplitter', () => {
		const splitProgress = progressSplitter('download', 0.7, 'decompression', 0.2, 'parsing');

		const expectations = /** @type {const} */ ([
			['download', 0, 0],
			['download', 0.5, 0.35],
			['download', 1, 0.7],
			['decompression', 0, 0.7],
			['decompression', 0.5, 0.8],
			['decompression', 1, 0.9],
			['parsing', 0, 0.9],
			['parsing', 0.5, 0.95],
			['parsing', 1, 1]
		]);

		for (const [phase, input, expected] of expectations) {
			expect
				.soft(splitProgress(phase, input), `with (${phase}, ${input})`)
				.toBeCloseTo(expected, 15);
		}
	});
}

/**
 * Replaces accents and punctuations with dashes, lowercases, and replaces accents with ASCII equivalents.
 * Throws if the result is still not ASCII (e.g. CJK characters, we don't have transliteration tables for everything)
 * @param {string} text
 */
export function slugify(text) {
	const result = text
		.normalize(/* @wc-ignore */ 'NFD') // separate accent from letter
		.replace(/[\u0300-\u036f]/g, '') // remove all accents
		.replace(/[^\w\s-]/g, '') // remove all non-word characters (except spaces and dashes)
		.trim()
		.replace(/[\s_-]+/g, '-') // replace spaces and underscores with a single dash
		.replace(/^-+|-+$/g, '') // remove leading and trailing dashes
		.toLowerCase();

	if (!result) throw new Error(`Cannot slugify "${text}" (result is empty)`);

	return result;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('slugify', () => {
		expect(slugify('Hello World!')).toBe('hello-world');
		expect(slugify('  Leading and trailing spaces  ')).toBe('leading-and-trailing-spaces');
		expect(slugify('Multiple   spaces')).toBe('multiple-spaces');
		expect(slugify('Special #$&* Characters')).toBe('special-characters');
		expect(slugify('Accented éàüö Characters')).toBe('accented-eauo-characters');
		expect(() => slugify('')).toThrow();
		expect(() => slugify('你好')).toThrow();
	});
}

/**
 * Throws an error with the given message
 * Useful to throw inside expressions
 * Example: `const value = possiblyNull ?? throws('value is null')`
 * @param {string} message
 * @returns {never}
 */
export function throws(message) {
	throw new Error(message);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('throws', () => {
		expect(() => throws('test error')).toThrow('test error');
	});
}

/**
 * @template T
 * @template [K=string]
 * @template [V=T]
 * @param {Iterable<T>} array
 * @param {(item: T) => K} key
 * @param {(item: T) => V} [valueMapper]
 * @returns {Map<K, V[]>}
 */
export function groupBy(array, key, valueMapper) {
	if ('groupBy' in Map && !valueMapper) {
		// @ts-expect-error
		return Map.groupBy(array, key);
	}

	const map = new Map();
	for (const item of array) {
		const k = key(item);
		if (!map.has(k)) map.set(k, []);
		map.get(k).push(valueMapper ? valueMapper(item) : item);
	}
	return map;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('groupBy', () => {
		expect(groupBy([1, 2, 3, 4, 5], (n) => (n % 2 === 0 ? 'even' : 'odd'))).toEqual(
			new Map([
				['odd', [1, 3, 5]],
				['even', [2, 4]]
			])
		);

		expect(
			groupBy(
				[
					{ id: 1, name: 'Alice' },
					{ id: 2, name: 'Bob' },
					{ id: 3, name: 'Charlie' },
					{ id: 4, name: 'David' }
				],
				(user) => (user.id % 2 === 0 ? 'even' : 'odd'),
				(user) => user.name
			)
		).toEqual(
			new Map([
				['odd', ['Alice', 'Charlie']],
				['even', ['Bob', 'David']]
			])
		);
	});
}

/**
 * Returns a LAB color-mix placing the value on the color scale made from the given color stops
 * Basically, it's like making a linear gradient and picking a color on it, where the 1 is the end of the gradient and 0 is the beginning
 * @param {number} value between 0 and 1
 * @param {...string} stops CSS color variable names (without the -- in front) representing the color gradient scale
 */
export function gradientedColor(value, ...stops) {
	if (value >= 1) return `var(--${stops.at(-1)})`;
	if (value <= 0) return `var(--${stops[0]})`;

	const scale = stops.length - 1;
	const stop = Math.floor(value * scale);

	return `color-mix(
		in lab,
		var(--${stops[stop + 1]})
		${round((value * scale - stop) * 100, 2)}%,
		var(--${stops[stop]})
	)`
		.replaceAll('\n', '')
		.replaceAll(/\s+/g, ' ')
		.replaceAll('( ', '(')
		.replaceAll(' )', ')');
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;
	describe('gradientedColor', () => {
		test('two colors', () => {
			expect.soft(gradientedColor(0, 'red', 'blue')).toBe('var(--red)');
			expect.soft(gradientedColor(1, 'red', 'blue')).toBe('var(--blue)');

			const expectations = /** @type {const} */ ([
				[0.1, 'blue', '10%', 'red'],
				[0.2, 'blue', '20%', 'red'],
				[0.25, 'blue', '25%', 'red'],
				[0.3, 'blue', '30%', 'red'],
				[0.4, 'blue', '40%', 'red'],
				[0.5, 'blue', '50%', 'red'],
				[0.6, 'blue', '60%', 'red'],
				[0.7, 'blue', '70%', 'red'],
				[0.75, 'blue', '75%', 'red'],
				[0.8, 'blue', '80%', 'red'],
				[0.9, 'blue', '90%', 'red']
			]);

			for (const [input, color, percent, otherColor] of expectations) {
				expect
					.soft(gradientedColor(input, 'red', 'blue'), `with ${input}`)
					.toBe(`color-mix(in lab, var(--${color}) ${percent}, var(--${otherColor}))`);
			}
		});

		test('three colors', () => {
			expect.soft(gradientedColor(0, 'red', 'yellow', 'blue')).toBe('var(--red)');
			expect.soft(gradientedColor(1, 'red', 'yellow', 'blue')).toBe('var(--blue)');

			const expectations = /** @type {const} */ ([
				[0.1, 'yellow', '20%', 'red'],
				[0.2, 'yellow', '40%', 'red'],
				[0.25, 'yellow', '50%', 'red'],
				[0.3, 'yellow', '60%', 'red'],
				[0.4, 'yellow', '80%', 'red'],
				[0.5, 'blue', '0%', 'yellow'],
				[0.6, 'blue', '20%', 'yellow'],
				[0.7, 'blue', '40%', 'yellow'],
				[0.75, 'blue', '50%', 'yellow'],
				[0.8, 'blue', '60%', 'yellow'],
				[0.9, 'blue', '80%', 'yellow']
			]);

			for (const [input, color, percent, otherColor] of expectations) {
				expect
					.soft(gradientedColor(input, 'red', 'yellow', 'blue'), `with ${input}`)
					.toBe(`color-mix(in lab, var(--${color}) ${percent}, var(--${otherColor}))`);
			}
		});

		test('four colors', () => {
			expect.soft(gradientedColor(0, 'red', 'yellow', 'green', 'blue')).toBe('var(--red)');
			expect.soft(gradientedColor(1, 'red', 'yellow', 'green', 'blue')).toBe('var(--blue)');

			const expectations = /** @type {const} */ ([
				[0.1, 'yellow', '30%', 'red'],
				[0.2, 'yellow', '60%', 'red'],
				[0.25, 'yellow', '75%', 'red'],
				[0.3, 'yellow', '90%', 'red'],
				[0.4, 'green', '20%', 'yellow'],
				[0.5, 'green', '50%', 'yellow'],
				[0.6, 'green', '80%', 'yellow'],
				[0.7, 'blue', '10%', 'green'],
				[0.75, 'blue', '25%', 'green'],
				[0.8, 'blue', '40%', 'green'],
				[0.9, 'blue', '70%', 'green']
			]);

			for (const [input, color, percent, otherColor] of expectations) {
				expect
					.soft(gradientedColor(input, 'red', 'yellow', 'green', 'blue'), `with ${input}`)
					.toBe(`color-mix(in lab, var(--${color}) ${percent}, var(--${otherColor}))`);
			}
		});
	});
}

/**
 * Fades out an element matching the given selector over the given duration, then removes it from the DOM.
 * If it's the first time the app is started (determined by checking localStorage), uses firstTimeDuration instead of duration if provided.
 * @param {string} selector
 * @param {number} duration in milliseconds
 * @param {object} [options]
 * @param {number} [options.firstTimeDuration] in milliseconds, if provided and it's the first time the app is started, this duration will be used instead of duration
 */
export function fadeOutElement(selector, duration, { firstTimeDuration } = {}) {
	const firstStart = !localStorage.getItem('app_started_before');
	localStorage.setItem('app_started_before', 'true');

	if (firstStart) duration = firstTimeDuration ?? duration;

	const element = document.querySelector(selector);

	if (!(element instanceof HTMLElement)) {
		element?.remove();
		return;
	}

	element.style.transition = `opacity ${duration}ms linear`;
	element.style.opacity = '0';
	setTimeout(() => {
		element.remove();
	}, duration);
}

/**
 * @param {string} color Hex of background color string, e.g. #RRGGBB
 */
export function readableOn(color) {
	const rgb = color.replace(/^#/, '').match(/.{2}/g);
	if (rgb === null) throw new Error('Invalid color, use hex notation');
	const o = Math.round(
		(parseInt(rgb[0], 16) * 299 + parseInt(rgb[1], 16) * 587 + parseInt(rgb[2], 16) * 114) /
			1000
	);
	return o > 125 ? '#000000' : '#ffffff';
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('readableOn', () => {
		expect(readableOn('#ffffff')).toBe('#000000');
		expect(readableOn('#000000')).toBe('#ffffff');
		expect(readableOn('#ff0000')).toBe('#ffffff');
		expect(readableOn('#00ff00')).toBe('#000000');
		expect(readableOn('#0000ff')).toBe('#ffffff');
		expect(readableOn('#808080')).toBe('#000000');
		expect(readableOn('#c0ffee')).toBe('#000000');
	});
}

/**
 * @param {string} message
 * @returns {never}
 */
export function throwError(message) {
	throw new Error(message);
}

/**
 * Await to await the given promise, but throw if the given AbortSignal is aborted before the promise resolves
 * @template T
 * @param {AbortSignal | undefined} signal
 * @param {Promise<T>} promise
 * @returns {Promise<T>}
 */
export async function unlessAborted(signal, promise) {
	return Promise.race([
		promise,
		new Promise((_, reject) => {
			signal?.addEventListener('abort', () => {
				reject(signal.reason);
			});
		})
	]);
}

export const LOREM_IPSUM = `Lorem ipsum dolor sit amet. A impedit beatae sed nostrum voluptatem
ut omnis aliquid et galisum quaerat. Est sunt voluptatem aut porro iste et tempora voluptatem
aut pariatur minima sed omnis cumque est iusto fugit vel rerum magni. 33 ducimus nesciunt ut
consequuntur esse nam necessitatibus tempore sit suscipit voluptatibus qui rerum earum non autem
doloribus. Rem itaque esse est nostrum optio id repellat recusandae et ipsa quis.

Aut odio ipsa sed autem esse ut autem error qui voluptates perspiciatis aut officiis consequuntur
sit amet nihil. Eos delectus consequatur sit natus iure qui omnis omnis ea illum distinctio et
quos quidem. Et nisi autem est rerum eius ut dolorum commodi et temporibus expedita ea dolorem 
error ad asperiores facilis ad numquam libero. Aut suscipit maxime sit explicabo dolorem est
accusantium enim et repudiandae omnis cum dolorem nemo id quia facilis.

Et dolorem perferendis et rerum suscipit qui voluptatibus quia et nihil nostrum 33 omnis soluta. 
Nam minus minima et perspiciatis velit et eveniet rerum et nihil voluptates aut eaque ipsa et 
ratione facere!`;

/**
 *
 * @param {any} error
 * @returns {error is DOMException}
 */
export function isAbortError(error) {
	return error instanceof DOMException && error.name === 'AbortError';
}
/**
 * Spread into an array literal to conditionally add something to it
 * @template T
 * @param {boolean | undefined | null} predicate
 * @param {T} obj
 * @returns { [T] | [] }
 */
export function orEmpty(predicate, obj) {
	return predicate ? [obj] : [];
}
