import * as dates from 'date-fns';

import * as DB from '$lib/database';
import type { RuntimeValue } from '$lib/schemas/metadata';
import { mapValues } from '$lib/utils';

/**
 * Serialize a metadata value for storing in the database.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeMetadataValue(value: any): string {
	return JSON.stringify(
		value instanceof Date && dates.isValid(value)
			? dates.format(value, "yyyy-MM-dd'T'HH:mm:ss")
			: value
	);
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
export function serializeMetadataFullValue<T extends { value: RuntimeValue }>({
	value,
	...rest
}: T): T & { value: string } {

	return { ...rest, value: serializeMetadataValue(value) };
}

/**
 * Serialize a record of metadata values for storing in the database.
 */
export function serializeMetadataValues(values: DB.MetadataValues): DB.MetadataValues {
	return mapValues(values, serializeMetadataFullValue);
}
