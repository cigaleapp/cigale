// @wc-ignore-file

import { Capacitor } from '@capacitor/core';
import fetchProgress from 'fetch-progress';
import JSONC from 'tiny-jsonc';
import YAML from 'yaml';

export function mapValues<K extends string, VIn, VOut>(
	subject: Record<K, VIn>,
	mapper: (value: VIn) => VOut
): Record<K, VOut> {
	// @ts-expect-error can't preserve types through Object.(from)Entries
	return Object.fromEntries(Object.entries(subject).map(([key, value]) => [key, mapper(value)]));
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('mapValues', () => {
		expect(mapValues({ a: 1, b: 2 }, (v) => v + 1)).toEqual({ a: 2, b: 3 });
		expect(mapValues({ a: 1, b: 2 }, (v) => v.toString())).toEqual({ a: '1', b: '2' });
	});
}

export function mapKeys<KIn extends string, KOut extends string, V>(
	subject: Record<KIn, V>,
	mapper: (key: KIn, value: V) => KOut
): Record<KOut, V> {
	// @ts-expect-error can't preserve types through Object.(from)Entries
	return Object.fromEntries(
		Object.entries(subject).map(([key, value]) => [mapper(key as KIn, value as V), value])
	);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('mapKeys', () => {
		expect(mapKeys({ a: 1, b: 2 }, (k) => k.toUpperCase())).toEqual({ A: 1, B: 2 });
		expect(mapKeys({ a: 1, b: 2 }, (k) => k + k)).toEqual({ aa: 1, bb: 2 });
	});
}

/**
 * Maps values of an object, and filters out entries with nullable values from the result
 */
export function mapValuesNoNullables<K extends string, VIn, VOut>(
	subject: Record<K, VIn>,
	mapper: (value: VIn) => VOut
): Record<K, NonNullable<VOut>> {
	return Object.fromEntries(
		Object.entries(subject)
			.map(([key, value]) => [key, mapper(value as VIn)])
			.filter(([, value]) => value !== null && value !== undefined)
	) as Record<K, NonNullable<VOut>>;
}

/**
 * Maps values and keys of an object, and filters out entries with nullable values from the result
 */
export function transformObject<KIn extends string, KOut extends string, VIn, VOut>(
	subject: Record<KIn, VIn>,
	mapper: (key: KIn, value: VIn) => [KOut, VOut] | undefined
): Record<KOut, VOut> {
	return fromEntries(
		entries(subject)
			.map(([key, value]) => mapper(key, value))
			.filter((entry): entry is [KOut, VOut] => entry !== undefined)
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
				a: 2,
			});
		});
		test('with only nullables', () => {
			expect(mapValuesNoNullables({ a: 1, b: 2 }, (v) => (v % 2 ? null : undefined))).toEqual(
				{}
			);
		});
	});
}

export function keys<K extends string>(subject: Record<K, unknown>): K[] {
	// @ts-expect-error can't preserve types through Object.keys
	return Object.keys(subject);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('keys', () => {
		expect(keys({ a: 1, b: 2 })).toEqual(['a', 'b']);
		expect(keys({})).toEqual([]);
	});
}

export function fromEntries<K extends string, V>(
	subject: Array<[K, V] | readonly [K, V]>
): Record<K, V> {
	// @ts-expect-error can't preserve types through Object.fromEntries
	return Object.fromEntries(subject);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('fromEntries', () => {
		expect(
			fromEntries([
				['a', 1],
				['b', 2],
			])
		).toEqual({ a: 1, b: 2 });
		expect(fromEntries([])).toEqual({});
	});
}

export function entries<K extends string, V>(subject: Record<K, V>): Array<[K, V]> {
	// @ts-expect-error can't preserve types though Object.entries
	return Object.entries(subject);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('entries', () => {
		expect(entries({ a: 1, b: 2 })).toEqual([
			['a', 1],
			['b', 2],
		]);
		expect(entries({})).toEqual([]);
	});
}

export function mapEntries<KIn extends string, VIn, KOut extends string, VOut>(
	subject: Record<KIn, VIn>,
	mapper: (key: KIn, value: VIn) => [KOut, VOut]
): Record<KOut, VOut> {
	return fromEntries(entries(subject).map(([key, value]) => mapper(key, value)));
}

export function invertRecord<K extends string, V extends string>(
	subject: Record<K, V>
): Record<V, K> {
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
 */
export function oneOf<T extends string>(value: string, values: T[]): value is T {
	// @ts-expect-error String#includes:0 is too narrow
	return values.includes(value);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('oneOf', () => {
		expect(oneOf('a', ['a', 'b', 'c'])).toBe(true);
		expect(oneOf('d', ['a', 'b', 'c'])).toBe(false);
	});
}

export function hasOnce<T extends string, U extends T>(value: U, values: T[]): boolean {
	return values.filter((v) => v === value).length === 1;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('hasOnce', () => {
		expect(hasOnce('a', ['a', 'b', 'c'])).toBe(true);
		// @ts-expect-error this is expected, we're testing for failure
		expect(hasOnce('d', ['a', 'b', 'c'])).toBe(false);
		expect(hasOnce('a', ['a', 'b', 'c', 'a'])).toBe(false);
	});
}

export function xor(...args: unknown[]): boolean {
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

export function or(...args: unknown[]): boolean {
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
 */
export function pick<Obj, KeysOut extends string & keyof Obj>(
	subject: Obj,
	...keys: KeysOut[]
): Pick<Obj, KeysOut> {
	const result = {} as Pick<Obj, KeysOut>;
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
		// @ts-expect-error this is expected, we're testing for an edge case
		expect(pick({ a: 1, b: 2 }, 'c')).toEqual({});

		class Test {
			id: number = 0;
			name: string = '';
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
 */
export function omit<KeysIn extends string, KeysOut extends KeysIn, V>(
	subject: Record<KeysIn, V>,
	...keys: KeysOut[]
): Record<Exclude<KeysIn, KeysOut>, V> {
	return fromEntries(entries(subject).filter(([key]) => !oneOf(key, keys))) as Record<
		Exclude<KeysIn, KeysOut>,
		V
	>;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('omit', () => {
		expect(omit({ a: 1, b: 2 }, 'a')).toEqual({ b: 2 });
		expect(omit({ a: 1, b: 2 }, 'b')).toEqual({ a: 1 });
		expect(omit({ a: 1, b: 2 }, 'a', 'b')).toEqual({});
		// @ts-expect-error this is expected, we're testing for an edge case
		expect(omit({ a: 1, b: 2 }, 'c')).toEqual({ a: 1, b: 2 });
	});
}

export function safeJSONParse(str: unknown): unknown {
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

export function safeJSONStringify(value: unknown): string | undefined {
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const a: any = { b: 2 };
		a.a = a;
		expect(safeJSONStringify(a)).toBeUndefined();
	});
}

/**
 * See https://github.com/microsoft/TypeScript/issues/19954
 */
export function sign(value: number) {
	return Math.sign(value) as -1 | 0 | 1;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('sign', () => {
		expect(sign(1)).toBe(1);
		expect(sign(-1)).toBe(-1);
		expect(sign(0)).toBe(0);
		expect(sign(-0)).toBe(-0);
		expect(sign(NaN)).toBeNaN();
		expect(sign(6732)).toBe(1);
		expect(sign(-667)).toBe(-1);
		expect(sign(Infinity)).toBe(1);
		expect(sign(-Infinity)).toBe(-1);
	});
}

export function clamp(value: number, min: number, max: number): number {
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

type ToIterables<T extends unknown[]> = { [K in keyof T]: Iterable<T[K]> };

export function* zip<T extends unknown[]>(...arrays: ToIterables<T>): Generator<T> {
	const iterators = arrays.map((i) => i[Symbol.iterator]());

	while (true) {
		const results = iterators.map((i) => i.next());

		if (results.some(({ done }) => done)) {
			break;
		}

		yield results.map(({ value }) => value) as T;
	}
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;
	describe('zip', () => {
		test('works with 2 iterators', () => {
			expect([...zip([1, 2], ['a', 'b'])]).toEqual([
				[1, 'a'],
				[2, 'b'],
			]);
		});
		test('works with 3 iterators', () => {
			expect([...zip([1, 2], ['a', 'b'], [true, false])]).toEqual([
				[1, 'a', true],
				[2, 'b', false],
			]);
		});
		test('works with asymmetrically-sized iterators', () => {
			expect([...zip([1, 2, 3], [[], []])]).toEqual([
				[1, []],
				[2, []],
			]);
		});
	});
}

export function unique<T>(
	array: T[],
	key: (item: T) => string | number = (x) => x as string | number
): T[] {
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
			{ id: 2 },
		]);
		expect(unique([{ id: 1 }, { id: 2 }, { id: 1 }], (o) => o.id.toString())).toEqual([
			{ id: 1 },
			{ id: 2 },
		]);
	});
}

export function uint8ArrayToArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
	// @ts-expect-error TODO fix this one
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
 */
export function splitFilenameOnExtension(filename: string): [string, string] {
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

export type Comparator<T> = (a: T, b: T) => number;

export function compareBy<Item>(
	...keys: (((item: Item) => string | number | undefined) | (string & keyof Item))[]
): Comparator<Item> {
	const _compareWith = (key: (typeof keys)[number], a: Item, b: Item): number => {
		const aKey = typeof key === 'string' ? (a as Record<string, unknown>)[key] : key(a);
		const bKey = typeof key === 'string' ? (b as Record<string, unknown>)[key] : key(b);

		if (aKey === undefined && bKey === undefined) return 0;
		if (aKey === undefined) return -1;
		if (bKey === undefined) return 1;

		if (aKey === null && bKey === null) return 0;
		if (aKey === null) return -1;
		if (bKey === null) return 1;

		if (aKey === bKey) return 0;
		if (typeof aKey === 'string' && typeof bKey === 'string') {
			return aKey.localeCompare(bKey);
		}

		if (typeof aKey === 'number' && typeof bKey === 'number') {
			return aKey - bKey;
		}

		return aKey.toString().localeCompare(bKey.toString());
	};

	return (a, b) => {
		let comparison = 0;

		for (let i = 0; i < keys.length && comparison === 0; i++) {
			comparison = _compareWith(keys[i], a, b);
		}

		return comparison;
	};
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe('compareBy', () => {
		test('.sort works', () => {
			const items = [
				{ id: 2, name: 'b' },
				{ id: 1, name: 'a' },
				{ id: 3, name: 'c' },
			];

			expect([...items].sort(compareBy((i) => i.id))).toEqual([
				{ id: 1, name: 'a' },
				{ id: 2, name: 'b' },
				{ id: 3, name: 'c' },
			]);

			expect([...items].sort(compareBy((i) => i.name))).toEqual([
				{ id: 1, name: 'a' },
				{ id: 2, name: 'b' },
				{ id: 3, name: 'c' },
			]);
		});

		test('it works', () => {
			const items = [
				{ id: 2, name: 'b' },
				{ id: 1, name: 'a' },
				{ id: 3, name: 'c' },
			];

			expect(compareBy<(typeof items)[number]>((i) => i.id)(items[0], items[1])).toBe(1);
			expect(compareBy<(typeof items)[number]>((i) => i.id)(items[1], items[0])).toBe(-1);
			expect(compareBy<(typeof items)[number]>((i) => i.id)(items[0], items[0])).toBe(0);

			expect(compareBy<(typeof items)[number]>((i) => i.name)(items[0], items[1])).toBe(1);
			expect(compareBy<(typeof items)[number]>((i) => i.name)(items[1], items[0])).toBe(-1);
			expect(compareBy<(typeof items)[number]>((i) => i.name)(items[0], items[0])).toBe(0);
		});

		test('it works with key strings', () => {
			const items = [
				{ id: 2, name: 'b' },
				{ id: 1, name: 'a' },
				{ id: 3, name: 'c' },
			];

			expect(compareBy<(typeof items)[number]>('id')(items[0], items[1])).toBe(1);
			expect(compareBy<(typeof items)[number]>('name')(items[1], items[0])).toBe(-1);
			expect(compareBy<(typeof items)[number]>('id')(items[0], items[0])).toBe(0);
		});

		test('it works with multiple keys', () => {
			const items = [
				{ id: 2, name: 'b' },
				{ id: 1, name: 'a' },
				{ id: 3, name: 'c' },
			];

			expect(compareBy<(typeof items)[number]>('id', 'name')(items[0], items[1])).toBe(1);
			expect(compareBy<(typeof items)[number]>('id', 'name')(items[1], items[0])).toBe(-1);
			expect(compareBy<(typeof items)[number]>('id', 'name')(items[0], items[0])).toBe(0);
		});
	});
}

/**
 * Returns a new comparator that takes into account a given sorting direction. Input comparator is assumed to be sorting in asc order.
 */
export function applySortDirection<T>(
	direction: 'asc' | 'desc',
	comparator: Comparator<T>
): Comparator<T> {
	const mul = direction === 'asc' ? 1 : -1;
	return (a, b) => mul * comparator(a, b);
}

/**
 * Add a v= query parameter to the URL to force the browser to reload the resource, using Date.now() as the value
 */
export function cachebust(url: string): string;
export function cachebust(url: URL): URL;
export function cachebust(url: string | URL): string | URL {
	const parsedUrl = new URL(url);
	parsedUrl.searchParams.set('v', Date.now().toString());
	if (typeof url === 'string') {
		return parsedUrl.toString();
	}
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
				['v', expect.stringMatching(/^\d+$/)],
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
 */
export function range(startOrEnd: number, end?: number): number[] {
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

export async function fetchHttpRequest(
	request:
		| string
		| {
				url: string;
				method?: string;
				headers?: Record<string, string>;
				body?: string;
				signal?: AbortSignal;
		  },
	{
		cacheAs = '' as '' | 'model',
		onProgress,
		signal,
		headers = {},
		cachebust: enableCachebusting = false,
	}: {
		cacheAs?: '' | 'model';
		onProgress?: NonNullable<Parameters<typeof fetchProgress>[0]>['onProgress'];
		signal?: AbortSignal;
		headers?: Record<string, string>;
		cachebust?: boolean;
	} = {}
): Promise<Response> {
	let url = new URL(typeof request === 'string' ? request : request.url);

	if (enableCachebusting) url = cachebust(url);

	const options: RequestInit = typeof request === 'string' ? { headers: {} } : request;

	if (cacheAs) {
		url.searchParams.set('x-cigale-cache-as', cacheAs);
	}

	if (signal) {
		options.signal = signal;
	}

	if (headers) {
		options.headers = { ...headers, ...(options.headers as Record<string, string>) };
	}

	if (onProgress) return fetch(url, options).then(fetchProgress({ onProgress }));

	return fetch(url, options);
}

/**
 * Parse a given Response into a JS value, assuming the response is either:
 * - JSONC (if the url pathname ends with .json)
 * - YAML (otherwise)
 */
export async function parseYAMLorJSON(response: Response): Promise<unknown> {
	if (new URL(response.url).pathname.endsWith('.json')) {
		return JSONC.parse(await response.text());
	}

	return YAML.parse(await response.text());
}

export function sum(values: Iterable<number>): number {
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

export function avg(values: Iterable<number>, fallback: number = NaN): number {
	let summed = 0;
	let length = 0;

	for (const value of values) {
		summed += value;
		length++;
	}

	return length === 0 ? fallback : summed / length;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('avg', () => {
		expect(avg([1, 2, 3])).toBe(2);
		expect(avg([1, 1, 1])).toBe(1);
		expect(avg([1, 3])).toBe(2);
	});
}

export function nonnull<T>(value: T): value is NonNullable<T> {
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

export function round(value: number, decimals: number = 0): number {
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

export function insideBoundingClientRect(
	{ offsetX, offsetY }: { offsetX: number; offsetY: number },
	rect: DOMRect,
	leeway: number = 0
): boolean {
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

export function isZip(
	contentType: string
): contentType is 'application/zip' | 'application/x-zip-compressed' | 'application/x-zip' {
	return (
		contentType === 'application/zip' ||
		contentType === 'application/x-zip-compressed' ||
		contentType === 'application/x-zip'
	);
}

export function logexpr<T>(tag: string, expr: T): T {
	// oxlint-disable-next-line no-console
	console.log(`{${tag}}`, expr);
	return expr;
}

/**
 * Outputs a [0, 1] progress value based on the progress of several weighted ordered parts.
 */
export function progressSplitter<PartName extends string>(
	...layout: (PartName | number)[]
): (part: PartName, progress: number) => number {
	const parts: Array<[PartName, number]> = [];

	for (let i = 0; i < layout.length; i += 2) {
		const name = layout[i] as PartName;
		const weight = (layout[i + 1] ?? 1 - sum(parts.map(([, w]) => w))) as number;

		parts.push([name, weight]);
	}

	return (part, progress) => {
		let total = 0;
		const partIndex = parts.findIndex(([name]) => name === part);
		for (const [i, [, weight]] of parts.entries()) {
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

		const expectations = [
			['download', 0, 0],
			['download', 0.5, 0.35],
			['download', 1, 0.7],
			['decompression', 0, 0.7],
			['decompression', 0.5, 0.8],
			['decompression', 1, 0.9],
			['parsing', 0, 0.9],
			['parsing', 0.5, 0.95],
			['parsing', 1, 1],
		] as const;

		for (const [phase, input, expected] of expectations) {
			expect
				.soft(splitProgress(phase, input), `with (${phase}, ${input})`)
				.toBeCloseTo(expected, 15);
		}
	});
}

/**
 * Replaces accents and punctuations with dashes, lowercases, and replaces accents with ASCII equivalents.
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
 * Throws an error with the given message.
 * Useful to throw inside expressions.
 * Example: `const value = possiblyNull ?? throws('value is null')`
 */
export function throws(message: string): never {
	throw new Error(message);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('throws', () => {
		expect(() => throws('test error')).toThrow('test error');
	});
}

export function groupBy<T, K, V = T>(
	array: Iterable<T>,
	key: (item: T) => K,
	valueMapper?: (item: T) => V
): Map<K, V[]> {
	if ('groupBy' in Map && !valueMapper) {
		// @ts-expect-error types can't be preserved through Map.groupBy
		return Map.groupBy(array, key);
	}

	const map = new Map<K, V[]>();
	for (const item of array) {
		const k = key(item);
		if (!map.has(k)) map.set(k, []);
		map.get(k)!.push(valueMapper ? valueMapper(item) : (item as unknown as V));
	}
	return map;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('groupBy', () => {
		expect(groupBy([1, 2, 3, 4, 5], (n) => (n % 2 === 0 ? 'even' : 'odd'))).toEqual(
			new Map([
				['odd', [1, 3, 5]],
				['even', [2, 4]],
			])
		);

		expect(
			groupBy(
				[
					{ id: 1, name: 'Alice' },
					{ id: 2, name: 'Bob' },
					{ id: 3, name: 'Charlie' },
					{ id: 4, name: 'David' },
				],
				(user) => (user.id % 2 === 0 ? 'even' : 'odd'),
				(user) => user.name
			)
		).toEqual(
			new Map([
				['odd', ['Alice', 'Charlie']],
				['even', ['Bob', 'David']],
			])
		);
	});
}

/**
 * Returns a LAB color-mix placing the value on the color scale made from the given color stops
 */
export function gradientedColor(value: number, ...stops: string[]): string {
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

/**
 * Fades out an element matching the given selector over the given duration, then removes it from the DOM.
 */
export function fadeOutElement(
	selector: string,
	duration: number,
	{ firstTimeDuration }: { firstTimeDuration?: number } = {}
): void {
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
 * @param color Hex of background color string, e.g. #RRGGBB
 */
export function readableOn(color: string): '#000000' | '#ffffff' {
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

export function throwError(message: string): never {
	throw new Error(message);
}

/**
 * Await to await the given promise, but throw if the given AbortSignal is aborted before the promise resolves
 */
export async function unlessAborted<T>(
	signal: AbortSignal | undefined,
	promise: Promise<T>
): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) => {
			signal?.addEventListener('abort', () => {
				reject(signal.reason);
			});
		}),
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

export function isAbortError(error: unknown): error is DOMException {
	return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * [] if predicate is falsy, [obj] if predicate is truthy.
 * Spread into an array literal to conditionally add something to it.
 */
export function orEmpty<T>(predicate: boolean | undefined | null, obj: T): [T] | [] {
	return predicate ? [obj] : [];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('orEmpty', () => {
		expect(orEmpty(true, 1)).toEqual([1]);
		expect(orEmpty(false, 1)).toEqual([]);
		expect(orEmpty(undefined, 1)).toEqual([]);
		expect(orEmpty(null, 1)).toEqual([]);
	});
}

/**
 * [] if predicate is falsy, [obj(subject)] if predicate is truthy.
 * Spread into an array literal to conditionally add something to it.
 */
export function orEmpty2<T, O>(subject: T, obj: (subject: NonNullable<T>) => O): [O] | [] {
	if (subject === null || subject === undefined) return [];
	return [obj(subject as NonNullable<T>)];
}

/**
 * {} if predicate is falsy, obj if predicate is truthy.
 * Spread into an object literal to conditionally add something to it.
 */
export function orEmptyObj<T>(predicate: boolean | undefined | null, obj: T): T | object {
	return predicate ? obj : {};
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('orEmptyObj', () => {
		expect(orEmptyObj(true, { a: 1 })).toEqual({ a: 1 });
		expect(orEmptyObj(false, { a: 1 })).toEqual({});
		expect(orEmptyObj(undefined, { a: 1 })).toEqual({});
		expect(orEmptyObj(null, { a: 1 })).toEqual({});
	});
}

/* eslint-disable @typescript-eslint/no-explicit-any  */

export function orEmptyObj2<K extends string, T, O>(
	key: K,
	subject: T,
	obj: (subject: NonNullable<T>) => O
): T extends null | undefined ? object : { [key in K]: O } {
	if (subject === null) return {} as any;
	if (subject === undefined) return {} as any;
	return { [key]: obj(subject as NonNullable<T>) } as any;
}

export function orEmptyObj3<K extends string, T>(obj: { [key in K]: T }): T extends null | undefined
	? object
	: { [key in K]: T } {
	const key = Object.keys(obj)[0] as K | undefined;
	if (key === undefined) return {} as any;
	if (obj[key] === null) return {} as any;
	if (obj[key] === undefined) return {} as any;
	return obj as any;
}

/* eslint-enable @typescript-eslint/no-explicit-any  */

export type RemovePrefix<Prefix extends string, T> = T extends `${Prefix}${infer P}` ? P : never;
export type WithPrefix<Prefix extends string, T> = Extract<T, `${Prefix}${string}`>;
export type WithoutPrefix<Prefix extends string, T> = Exclude<T, `${Prefix}${string}`>;

/**
 * Promisified setTimeout
 */
export async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('sleep', async () => {
		const start = Date.now();
		await sleep(100);
		const end = Date.now();
		expect(end - start).toBeGreaterThanOrEqual(99);
	});
}

/**
 * Syntactically clean filepaths.
 */
export function cleanFilepath(filepath: string): string {
	const segments: string[] = [];
	for (const segment of filepath.replaceAll('\\', '/').split('/')) {
		if (segment === '') continue;
		if (segment === '.') continue;
		if (segment === '..' && segments.length > 0) segments.pop();
		else segments.push(segment);
	}
	return segments.join('/');
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('cleanFilepath', () => {
		expect(cleanFilepath('foo/bar/baz')).toBe('foo/bar/baz');
		expect(cleanFilepath('foo//bar///baz')).toBe('foo/bar/baz');
		expect(cleanFilepath('/foo/bar/baz/')).toBe('foo/bar/baz');
		expect(cleanFilepath('./foo/./bar/./baz/.')).toBe('foo/bar/baz');
		expect(cleanFilepath('foo/../bar/baz')).toBe('bar/baz');
		expect(cleanFilepath('../foo/bar/baz')).toBe('../foo/bar/baz');
		expect(cleanFilepath('..')).toBe('..');
		expect(cleanFilepath('.')).toBe('');
		expect(cleanFilepath('/')).toBe('');
		expect(cleanFilepath('C:\\foo\\bar\\baz')).toBe('C:/foo/bar/baz');
	});
}

export function prefixIDBKeyRange(prefix: string): IDBKeyRange {
	return IDBKeyRange.bound(prefix, prefix + '\uffff');
}

export function ensureArray<T>(subject: T | T[]): T[] {
	return Array.isArray(subject) ? subject : [subject];
}

if (import.meta.vitest) {
	const { test, expect } = await import('vitest');
	test('ensureArray', () => {
		expect(ensureArray(1)).toEqual([1]);
		expect(ensureArray([1])).toEqual([1]);
		expect(ensureArray([[3]])).toEqual([[3]]);
	});
}

type ProfilerData = Record<string, string | number | boolean>;

export function profiler(group: string) {
	async function profile<T>(
		track: string,
		label: string,
		dataOrFn: ProfilerData | (() => Promise<T> | T),
		fnIfHasData?: () => Promise<T> | T
	): Promise<T> {
		const fn = fnIfHasData ?? (dataOrFn as () => Promise<T> | T);
		const start = performance.now();
		const result = await fn();
		performance.measure(label, {
			start,
			detail: {
				devtools: {
					dataType: 'track-entry',
					track,
					trackGroup: group,
					properties:
						typeof dataOrFn === 'function'
							? undefined
							: Object.entries(dataOrFn).map(([key, value]) => [
									key,
									value.toString(),
								]),
				},
			},
		});
		return result;
	}

	return profile;
}

export function displayKeyRange(keyRange: string | IDBKeyRange | undefined): string {
	if (!keyRange) return 'none';
	if (typeof keyRange === 'string') return `{${keyRange}}`;

	let lowerBound: string;
	let upperBound: string;

	if (keyRange.lower === undefined) {
		lowerBound = '(-∞';
	} else if (keyRange.lowerOpen) {
		lowerBound = `(${keyRange.lower}`;
	} else {
		lowerBound = `[${keyRange.lower}`;
	}

	if (keyRange.upper === undefined) {
		upperBound = '∞)';
	} else if (keyRange.upperOpen) {
		upperBound = `${keyRange.upper})`;
	} else {
		upperBound = `${keyRange.upper}]`;
	}

	return `${lowerBound}, ${upperBound}`;
}

export function switchValue<const T extends Record<string | number, unknown>, V extends keyof T>(
	value: V,
	cases: Partial<T>,
	fallback?: T[V]
): T[V] {
	return (cases[value] ?? fallback) as T[V];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('switchValue', () => {
		expect(switchValue('a', { a: 1, b: 2 })).toBe(1);
		expect(switchValue('b', { a: 1, b: 2 })).toBe(2);
		// @ts-expect-error this is expected, we're testing for an edge case
		expect(switchValue('c', { a: 1, b: 2 }, 3)).toBe(3);
		// @ts-expect-error test that it returns undefined if no fallback is provided
		expect(switchValue('c', { a: 1, b: 2 })).toBeUndefined();
	});
}

export function climbDOMUntil(
	element: HTMLElement | null,
	predicate: (element: HTMLElement) => boolean
): HTMLElement | null {
	while (element) {
		if (predicate(element)) return element;
		element = element.parentElement;
	}
	return null;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('climbDOMUntil', () => {
		document.body.innerHTML = `
			<div id="parent">
				<div id="child">
					<div id="grandchild"></div>
				</div>
			</div>
		`;

		const parent = document.getElementById('parent');
		const child = document.getElementById('child');
		const grandchild = document.getElementById('grandchild');

		expect(climbDOMUntil(grandchild, (el) => el.id === 'child')).toBe(child);
		expect(climbDOMUntil(grandchild, (el) => el.id === 'parent')).toBe(parent);
		expect(climbDOMUntil(grandchild, (el) => el.id === 'grandchild')).toBe(grandchild);
		expect(climbDOMUntil(grandchild, (el) => el.id === 'nonexistent')).toBe(null);
	});
}

/**
 * Turns an async function into a { do: starts the function synchronously, cancel: cancels the function if it's still running } object
 */
export function cancellable<Args extends unknown[], R>(
	asyncFunction: (signal: AbortSignal, ...args: Args) => Promise<R>
): (...args: Args) => { do: () => Promise<R>; cancel: () => void } {
	let controller = new AbortController();

	return (...args: Args) => {
		controller.abort();
		controller = new AbortController();

		return {
			do: () => asyncFunction(controller.signal, ...args),
			cancel: () => controller.abort(),
		};
	};
}

export function setsAreEqual<T>(setA: Set<T>, setB: Set<T>): boolean {
	if (setA.size !== setB.size) return false;
	for (const item of setA) {
		if (!setB.has(item)) return false;
	}
	return true;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('setsAreEqual', () => {
		expect(setsAreEqual(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(true);
		expect(setsAreEqual(new Set([1, 2, 3]), new Set([3, 2, 1]))).toBe(true);
		expect(setsAreEqual(new Set([1, 2, 3]), new Set([1, 2]))).toBe(false);
		expect(setsAreEqual(new Set([1, 2]), new Set([1, 2, 3]))).toBe(false);
		expect(setsAreEqual(new Set([1, 2, 3]), new Set([4, 5, 6]))).toBe(false);
	});
}

export function corsfix(url: string | URL): string {
	return 'https://cors.gwen.works/' + url.toString().replace(/^https?:\/\//, '');
}

export function corsfixIfLocalhost(src: string): string {
	if (location.hostname !== 'localhost') return src;
	return corsfix(src);
}

export function splitRecord<K1 extends string, K2 extends string, V>(
	record: Record<K1 | K2, V>,
	predicate: ((key: K1 | K2) => key is K1) | ((key: K1 | K2) => boolean)
): [Record<K1, V>, Record<K2, V>] {
	const record1 = {} as Record<K1, V>;
	const record2 = {} as Record<K2, V>;

	for (const key of keys(record)) {
		if (predicate(key as K1 | K2)) {
			(record1 as Record<string, V>)[key] = record[key as K1 | K2];
		} else {
			(record2 as Record<string, V>)[key] = record[key as K1 | K2];
		}
	}

	return [record1, record2];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('splitRecord', () => {
		const record = { a: 1, b: 2, c: 3, d: 4 };
		const [record1, record2] = splitRecord(record, (key) => key === 'a' || key === 'c');
		expect(record1).toEqual({ a: 1, c: 3 });
		expect(record2).toEqual({ b: 2, d: 4 });
	});
}

export const UTF8_BOM = '\xEF\xBB\xBF';

export function platform() {
	return Capacitor.getPlatform() as 'web' | 'android' | 'ios';
}

export type MaybeArray<T> = T | T[];
/**
 * Read contents of given {@link ArrayBuffer} as a {@link Uint8Array}
 */
export function* arrayBufferContents(buf: ArrayBuffer): Iterable<number> {
	const data = new DataView(buf);

	for (let offset = 0; offset < buf.byteLength; offset++) {
		yield data.getUint8(offset);
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('arrayBufferContents', () => {
		const buf = new Uint8Array([6, 7, 6, 7, 12, 13]).buffer;

		expect([...arrayBufferContents(buf)]).toStrictEqual([6, 7, 6, 7, 12, 13]);
	});
}
