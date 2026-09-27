import type { TypedMetadataValue } from './types.js';
import type { NamespacedMetadataID } from '$lib/schemas/common.js';

import * as dates from 'date-fns';

import * as DB from '$lib/database';
import { MetadataRecordValue, MetadataRuntimeValue } from '$lib/schemas/metadata.js';
import { clamp, mapValues, transformObject } from '$lib/utils';

/**
 * Serialize a metadata value for storing in the database.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeMetadataValue(value: any): string {
	if (value instanceof Date && dates.isValid(value))
		return JSON.stringify(dates.format(value, "yyyy-MM-dd'T'HH:mm:ss"));

	if (MetadataRuntimeValue.boundingbox.allows(value))
		return JSON.stringify(mapValues(value, (coord) => clamp(coord, 0, 1)));

	return JSON.stringify(value);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('serializeMetadataValue', () => {
		expect(serializeMetadataValue('hello')).toBe('"hello"');
		expect(serializeMetadataValue(42)).toBe('42');
		expect(serializeMetadataValue(true)).toBe('true');
		expect(serializeMetadataValue(null)).toBe('null');

		const date = new Date('2023-01-01T12:30:45');
		expect(serializeMetadataValue(date)).toBe('"2023-01-01T12:30:45"');

		// Invalid date should be serialized as is
		const invalidDate = new Date('invalid');
		expect(serializeMetadataValue(invalidDate)).toBe('null'); // Invalid date becomes null when JSON stringified

		expect(serializeMetadataValue(['a', 'b'])).toBe('["a","b"]');
		expect(serializeMetadataValue({ key: 'value' })).toBe('{"key":"value"}');
	});
}

/**
 * Serialize a full metadata value (including confidence, alternatives, etc)
 */
export function serializeMetadataFullValue<T extends TypedMetadataValue>({
	value,
	alternatives,
	...rest
}: T): T & { alternatives: string[]; value: string } {
	return {
		...rest,
		alternatives: alternatives.map(serializeMetadataValue),
		value: serializeMetadataValue(value),
	};
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('serializeMetadataFullValue', () => {
		const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });
		const b = (x: number) => box(x, 0.5, 0.24, 0.89);
		const j = (x: number) => JSON.stringify(b(x));

		expect(
			serializeMetadataFullValue({
				value: b(0),
				alternatives: [b(0.25), b(0.33), b(0.75)],
				confidence: 0.78543,
				manuallyModified: false,
				confirmed: true,
				isDefault: false,
				confidences: {
					[j(0)]: 0.123,
					[j(0.25)]: 0.223,
					[j(0.33)]: 0.423,
					[j(0.75)]: 0.723,
				},
			})
		).toStrictEqual({
			value: '{"x":0,"y":0.5,"w":0.24,"h":0.89}',
			confidence: 0.78543,
			alternatives: [
				'{"x":0.25,"y":0.5,"w":0.24,"h":0.89}',
				'{"x":0.33,"y":0.5,"w":0.24,"h":0.89}',
				'{"x":0.75,"y":0.5,"w":0.24,"h":0.89}',
			],
			confidences: {
				'{"x":0,"y":0.5,"w":0.24,"h":0.89}': 0.123,
				'{"x":0.25,"y":0.5,"w":0.24,"h":0.89}': 0.223,
				'{"x":0.33,"y":0.5,"w":0.24,"h":0.89}': 0.423,
				'{"x":0.75,"y":0.5,"w":0.24,"h":0.89}': 0.723,
			},
			confirmed: true,
			isDefault: false,
			manuallyModified: false,
		});
	});
}

/**
 * Serialize a record of metadata values for storing in the database.
 */
export function serializeMetadataValues(values: DB.MetadataValues): DB.MetadataValues {
	return mapValues(values, serializeMetadataFullValue);
}

export function metadataRecordToSerialized<K extends string>(
	record: Record<K, typeof MetadataRecordValue.infer>,
	namespacer: (key: K) => NamespacedMetadataID = (key) => key
) {
	return transformObject(record, (key, value) => {
		if (value.value === null) return undefined;
		if (value.alternatives.includes(null)) return undefined;
		return [namespacer(key), serializeMetadataFullValue(value as TypedMetadataValue)];
	});
}

if (import.meta.vitest) {
	const { test, describe, expect } = import.meta.vitest;

	// Helper to build a minimal valid MetadataRecordValue-shaped object
	const makeValue = (
		value: unknown,
		alternatives: unknown[] = []
	): typeof MetadataRecordValue.infer =>
		({
			value,
			alternatives,
			confidence: 1,
			manuallyModified: false,
			confirmed: false,
			isDefault: false,
			confidences: {},
		}) as typeof MetadataRecordValue.infer;

	describe('metadataRecordToSerialized', () => {
		test('serializes values with default (identity) namespacer', () => {
			const record = {
				foo: makeValue('bar', ['baz']),
			};

			const result = metadataRecordToSerialized(record);

			expect(result).toHaveProperty('foo');
			expect(result.foo).toStrictEqual({
				value: '"bar"',
				alternatives: ['"baz"'],
				confidence: 1,
				manuallyModified: false,
				confirmed: false,
				isDefault: false,
				confidences: {},
			});
		});

		test('applies a custom namespacer to keys', () => {
			const record = {
				foo: makeValue('bar'),
			};

			const result = metadataRecordToSerialized(record, (key) => `ns__${key}`);

			expect(result).not.toHaveProperty('foo');
			expect(result).toHaveProperty('ns__foo');
			expect((result as Record<string, unknown>)['ns__foo']).toMatchObject({
				value: '"bar"',
			});
		});

		test('drops entries whose value is null', () => {
			const record = {
				a: makeValue('hello'),
				b: makeValue(null),
			};

			const result = metadataRecordToSerialized(record);

			expect(result).toHaveProperty('a');
			expect(result).not.toHaveProperty('b');
		});

		test('drops entries whose alternatives include null', () => {
			const record = {
				a: makeValue('hello', ['world']),
				b: makeValue('hi', [null]),
			};

			const result = metadataRecordToSerialized(record);

			expect(result).toHaveProperty('a');
			expect(result).not.toHaveProperty('b');
		});

		test('keeps entries with an empty alternatives array', () => {
			const record = {
				a: makeValue('hello', []),
			};

			const result = metadataRecordToSerialized(record);

			expect(result).toHaveProperty('a');
			expect(result.a.alternatives).toStrictEqual([]);
		});

		test('handles multiple keys with mixed validity', () => {
			const record = {
				valid1: makeValue('a', ['x']),
				invalidValue: makeValue(null, ['x']),
				invalidAlt: makeValue('b', [null]),
				valid2: makeValue('c', []),
			};

			const result = metadataRecordToSerialized(record);

			expect(Object.keys(result).sort()).toStrictEqual(['valid1', 'valid2']);
			expect(result.valid1.value).toBe('"a"');
			expect(result.valid2.value).toBe('"c"');
		});

		test('returns an empty object for an empty record', () => {
			const result = metadataRecordToSerialized({});
			expect(result).toStrictEqual({});
		});

		test('preserves non-serialized fields (confidence, confirmed, etc.)', () => {
			const record = {
				a: {
					value: 'x',
					alternatives: ['y'],
					confidence: 0.42,
					manuallyModified: true,
					confirmed: true,
					isDefault: true,
					confidences: { '"y"': 0.9 },
				} as typeof MetadataRecordValue.infer,
			};

			const result = metadataRecordToSerialized(record);

			expect(result.a).toMatchObject({
				confidence: 0.42,
				manuallyModified: true,
				confirmed: true,
				isDefault: true,
				confidences: { '"y"': 0.9 },
			});
		});
	});
}
