import { ArkErrors } from 'arktype';
import * as dates from 'date-fns';
import { describe, expect, test } from 'vitest';

import { generateId, idComparator, Schemas } from './database';
import { FilepathTemplate } from './schemas/protocols';

describe('generateId', () => {
	test('should generate a unique ID', () => {
		const id1 = generateId('Image');
		const id2 = generateId('Image');
		expect(id1).not.toBe(id2);
	});

	test("should start with the table name's initial letter", () => {
		expect(generateId('Image').charAt(0)).toBe('i');
		expect(generateId('Observation').charAt(0)).toBe('o');
	});
});

describe('filepath templates', () => {
	/**
	 * @param {typeof FilepathTemplate.infer|ArkErrors} template
	 * @param {Record<string, unknown>} data
	 * @returns
	 */
	function expectRendered(template, data) {
		// oxlint-disable valid-expect
		if (template instanceof ArkErrors) {
			// oxlint-disable-next-line no-conditional-expect
			return expect(template);
		}

		// TODO we should use fakerjs to generate fake Image data and pass that to template.render instead of using any object
		// @ts-expect-error
		return expect(template.render(data));
		// oxlint-enable valid-expect
	}

	test('renders simple variables', () => {
		const template = FilepathTemplate('{{id}}.jpg');
		expect(template).not.toBeInstanceOf(ArkErrors);
		expectRendered(template, { id: '123' }).toBe('123.jpg');
	});

	test.todo('fails with malformed templates', () => {
		const template = FilepathTemplate('{{id}');
		expect(template).toBeInstanceOf(ArkErrors);
		expect(template).toHaveProperty('message', 'Invalid template: {{id}');
	});

	test('fails at runtime with malformed templates', () => {
		const template = FilepathTemplate('{{id}');
		expect(template).not.toBeInstanceOf(ArkErrors);
		// TODO: find a way to have type inference for a isinstance check
		// This way, we can also get rid of expectRendered and use template.render directly, making code clearer
		// @ts-expect-error
		expect(() => template.render({ id: '123', foo: 'bar' }))
			.toThrowErrorMatchingInlineSnapshot(`
			[Error: Parse error on line 1:
			{{id}
			----^
			Expecting 'CLOSE_RAW_BLOCK', 'CLOSE', 'CLOSE_UNESCAPED', 'OPEN_SEXPR', 'CLOSE_SEXPR', 'ID', 'OPEN_BLOCK_PARAMS', 'STRING', 'NUMBER', 'BOOLEAN', 'UNDEFINED', 'NULL', 'DATA', 'SEP', got 'INVALID']
		`);
	});

	test('is JSON serializable', () => {
		const template = FilepathTemplate('{{id}}.jpg');
		expect(template).not.toBeInstanceOf(ArkErrors);
		expect(
			JSON.stringify({
				path: template,
				type: 'filepath-template'
			})
		).toBe('{"path":"{{id}}.jpg","type":"filepath-template"}');
	});

	test('has the fallback helper', () => {
		const template = FilepathTemplate('{{ fallback thing.foo "yay" }}.jpeg');
		expect(template).not.toBeInstanceOf(ArkErrors);
		expectRendered(template, { thing: { foo: 'bar' } }).toBe('bar.jpeg');
		expectRendered(template, { thing: {} }).toBe('yay.jpeg');
		// expect(template.render({})).toBe('yay.jpeg')
		expectRendered(template, { thing: { foo: null } }).toBe('yay.jpeg');
		expectRendered(template, { thing: { foo: undefined } }).toBe('yay.jpeg');
	});

	test('has the extension helper', () => {
		const template = FilepathTemplate('file.{{ extension thing.foo }}');
		expect(template).not.toBeInstanceOf(ArkErrors);
		expectRendered(template, { thing: { foo: 'bar' } }).toBe('file.');
		expectRendered(template, { thing: { foo: 'bar.jpeg' } }).toBe('file.jpeg');
		expectRendered(template, { thing: { foo: 'bar.jpg' } }).toBe('file.jpg');
		expectRendered(template, { thing: { foo: 'bar.tar.gz' } }).toBe('file.tar.gz');
	});

	test('has the suffix helper', () => {
		const template = FilepathTemplate('{{ suffix filename suf }}');
		expect(template).not.toBeInstanceOf(ArkErrors);
		expectRendered(template, { filename: 'file.jpg', suf: '_cropped' }).toBe(
			'file_cropped.jpg'
		);
		expectRendered(template, { filename: 'file.jpg', suf: '_cropped.png' }).toBe(
			'file_cropped.png.jpg'
		);
	});
});

describe('MetadataValue', () => {
	describe('serialization roundtrips', () => {
		const value = (/** @type {string} */ val) =>
			Schemas.MetadataValue.assert({
				value: val,
				confidence: 0.5,
				alternatives: {}
			});

		test('invalid', () => {
			expect(() => value('foo')).toThrowErrorMatchingInlineSnapshot(
				`[TraversalError: value must be a JSON string (SyntaxError: Unexpected token 'o', "foo" is not valid JSON)]`
			);
		});
		test('int', () => {
			expect(value('1').value).toBe(1);
		});
		test('float', () => {
			expect(value('1.5').value).toBe(1.5);
		});
		test('boolean', () => {
			expect(value('true').value).toBe(true);
			expect(value('false').value).toBe(false);
		});
		test('string', () => {
			expect(value('"foo"').value).toBe('foo');
		});
		test('negative float', () => {
			expect(value('-3.14').value).toBe(-3.14);
		});
		test('datestring', () => {
			expect(dates.formatISO(value('"2025-01-01T00:00:00Z"').value)).toMatch(
				/^2025-01-01T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/
			);
		});
	});
});

describe('idComparator', () => {
	test('works on pairs of strings', () => {
		expect(idComparator('a', 'b')).toBeLessThan(0);
		expect(idComparator('b', 'a')).toBeGreaterThan(0);
		expect(idComparator('a', 'a')).toBe(0);
	});
	test('works on numeric strings', () => {
		expect(idComparator('1', '11')).toBeLessThan(0);
		expect(idComparator('11', '1')).toBeGreaterThan(0);
		expect(idComparator('0001', '1')).toBe(0);
	});
	test('works on pairs of numbers', () => {
		expect(idComparator(1, 2)).toBeLessThan(0);
		expect(idComparator(2, 1)).toBeGreaterThan(0);
		expect(idComparator(1, 1)).toBe(0);
	});
	test('works on pairs of objects', () => {
		expect(idComparator({ id: '1' }, { id: '11' })).toBeLessThan(0);
		expect(idComparator({ id: 'a' }, { id: '11' })).toBeGreaterThan(0);
		expect(idComparator({ id: '0001' }, { id: '1' })).toBe(0);
	});
});
