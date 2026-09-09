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
