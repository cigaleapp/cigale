import { type } from 'arktype';

import { NaturalRegexExpression } from '$lib/schemas/constraints.js';
import {
	MetadataDate,
	MetadataFloat,
	MetadataInteger,
	MetadataString
} from '$lib/schemas/metadata.js';

export function metadataValueValidatorNumeric(
	metadata: typeof MetadataInteger.infer | typeof MetadataFloat.infer
) {
	let schema = type('number');

	if (metadata.range) {
		if ('gt' in metadata.range) schema = schema.moreThan(metadata.range.gt);
		if ('gte' in metadata.range) schema = schema.atLeast(metadata.range.gte);
		if ('lt' in metadata.range) schema = schema.lessThan(metadata.range.lt);
		if ('lte' in metadata.range) schema = schema.atMost(metadata.range.lte);
	}

	return schema;
}

export function metadataValueValidatorString(metadata: typeof MetadataString.infer) {
	if (metadata.pattern) {
		return type(metadata.pattern.regex).describe(
			`string matching ${metadata.pattern.display}`
		);
	}

	if (metadata.regex) {
		return type(metadata.regex);
	}

	return type('string');
}

export function metadataValueValidatorDate(metadata: typeof MetadataDate.infer) {
	if (metadata.range === 'future') return type(`Date > ${new Date().valueOf()}`);
	if (metadata.range === 'past') return type(`Date < ${new Date().valueOf()}`);
	return type('Date');
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	const base = {
		id: 'test__test',
		label: 'Test',
		mergeMethod: 'none',
		required: false,
		description: 'test',
		sortable: false,
		groupable: false
	} as const;

	describe('metadataValueValidatorNumeric', () => {
		const numeric = { ...base, type: 'integer' } satisfies typeof MetadataInteger.infer;

		test('accepts any number without range', () => {
			const schema = metadataValueValidatorNumeric(numeric);
			expect(schema(42)).toBe(42);
			expect(schema(-3.5)).toBe(-3.5);
		});

		test('enforces gt', () => {
			const schema = metadataValueValidatorNumeric({ ...numeric, range: { gt: 10 } });
			expect(schema(11)).toBe(11);
			expect(String(schema(10))).toMatchInlineSnapshot(`"must be more than 10 (was 10)"`);
			expect(String(schema(9))).toMatchInlineSnapshot(`"must be more than 10 (was 9)"`);
		});

		test('enforces gte', () => {
			const schema = metadataValueValidatorNumeric({ ...numeric, range: { gte: 10 } });
			expect(schema(10)).toBe(10);
			expect(schema(11)).toBe(11);
			expect(String(schema(9))).toMatchInlineSnapshot(`"must be at least 10 (was 9)"`);
		});

		test('enforces lt', () => {
			const schema = metadataValueValidatorNumeric({ ...numeric, range: { lt: 5 } });
			expect(schema(4)).toBe(4);
			expect(String(schema(5))).toMatchInlineSnapshot(`"must be less than 5 (was 5)"`);
		});

		test('enforces lte', () => {
			const schema = metadataValueValidatorNumeric({ ...numeric, range: { lte: 5 } });
			expect(schema(5)).toBe(5);
			expect(String(schema(6))).toMatchInlineSnapshot(`"must be at most 5 (was 6)"`);
		});

		test('enforces combined gte + lt', () => {
			const schema = metadataValueValidatorNumeric({
				...numeric,
				range: { gte: 0, lt: 100 }
			});
			expect(schema(0)).toBe(0);
			expect(schema(50)).toBe(50);
			expect(schema(99)).toBe(99);
			expect(String(schema(100))).toMatchInlineSnapshot(`"must be less than 100 (was 100)"`);
			expect(String(schema(-1))).toMatchInlineSnapshot(`"must be non-negative (was -1)"`);
		});

		test('rejects non-numbers', () => {
			const schema = metadataValueValidatorNumeric(numeric);
			expect(String(schema('hello'))).toMatchInlineSnapshot(
				`"must be a number (was a string)"`
			);
		});
	});

	describe('metadataValueValidatorString', () => {
		const string = { ...base, type: 'string' } satisfies typeof MetadataString.infer;

		test('accepts any string without constraints', () => {
			const schema = metadataValueValidatorString(string);
			expect(schema('hello')).toBe('hello');
			expect(schema('')).toBe('');
		});

		test('rejects non-strings', () => {
			const schema = metadataValueValidatorString(string);
			expect(String(schema(123))).toMatchInlineSnapshot(`"must be a string (was a number)"`);
		});

		test('still returns a string schema when regex is provided', () => {
			const schema = metadataValueValidatorString({
				...string,
				regex: /^[a-z]+$/
			});
			expect(schema('abc')).toBe('abc');
		});

		test('still returns a string schema when pattern is provided', () => {
			const schema = metadataValueValidatorString({
				...string,
				pattern: NaturalRegexExpression.assert('digit for 3 times')
			});
			expect(schema('123')).toBe('123');
		});
	});

	describe('metadataValueValidatorDate', () => {
		const date = { ...base, type: 'date' } satisfies typeof MetadataDate.infer;

		test('accepts any Date without range', () => {
			const schema = metadataValueValidatorDate(date);
			expect(schema(new Date())).toBeInstanceOf(Date);
			expect(schema(new Date('2020-01-01'))).toBeInstanceOf(Date);
		});

		test('rejects non-dates', () => {
			const schema = metadataValueValidatorDate(date);
			expect(String(schema('not a date'))).toMatchInlineSnapshot(
				`"must be a Date (was string)"`
			);
		});

		test('accepts future dates with range=future', () => {
			const schema = metadataValueValidatorDate({ ...date, range: 'future' });
			const future = new Date(Date.now() + 86_400_000);
			expect(schema(future)).toBeInstanceOf(Date);
		});

		test('rejects past dates with range=future', () => {
			const schema = metadataValueValidatorDate({ ...date, range: 'future' });
			const past = new Date('2020-01-01');
			expect(String(schema(past))).toMatch(/or later/);
		});

		test('accepts past dates with range=past', () => {
			const schema = metadataValueValidatorDate({ ...date, range: 'past' });
			const past = new Date('2020-01-01');
			expect(schema(past)).toBeInstanceOf(Date);
		});

		test('rejects future dates with range=past', () => {
			const schema = metadataValueValidatorDate({ ...date, range: 'past' });
			const future = new Date(Date.now() + 86_400_000);
			expect(String(schema(future))).toMatch(/or earlier/);
		});
	});
}
