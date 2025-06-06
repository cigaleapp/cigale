import { ArkErrors } from 'arktype';
import { formatISO } from 'date-fns';
import { describe, expect, test } from 'vitest';
import { Schemas } from './database';
import { FilepathTemplate } from './schemas/protocols';

describe('filepath templates', () => {
	/**
	 * @param {typeof FilepathTemplate.infer|ArkErrors} template
	 * @param {Record<string, unknown>} data
	 * @returns
	 */
	function expectRendered(template, data) {
		if (template instanceof ArkErrors) {
			return expect(template);
		}

		// TODO we should use fakerjs to generate fake Image data and pass that to template.render instead of using any object
		// @ts-expect-error
		return expect(template.render(data));
	}

	test('renders simple variables', () => {
		const template = FilepathTemplate('{{id}}.jpg');
		expect(template).not.toBeInstanceOf(ArkErrors);
		expectRendered(template, { id: '123' }).toBe('123.jpg');
	});

	test.skip('fails with malformed templates', () => {
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
		expect(() => template.render({ id: '123', foo: 'bar' })).toThrowErrorMatchingInlineSnapshot(`
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
		expectRendered(template, { filename: 'file.jpg', suf: '_cropped' }).toBe('file_cropped.jpg');
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
		test('null', () => {
			expect(value('null').value).toBe(null);
		});
		test('string', () => {
			expect(value('"foo"').value).toBe('foo');
		});
		test('negative float', () => {
			expect(value('-3.14').value).toBe(-3.14);
		});
		test('datestring', () => {
			expect(formatISO(value('"2025-01-01T00:00:00Z"').value)).toMatch(
				/^2025-01-01T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/
			);
		});
	});
});
