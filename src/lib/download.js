import YAML from 'yaml';

/**
 *
 * @param {BlobPart | string} content
 * @param {string} filename
 * @param {string} [contentType] defaults to 'text/plain' for strings and 'application/octet-stream' for blobs
 */
export function downloadAsFile(content, filename, contentType) {
	const blob =
		content instanceof Blob
			? content
			: new Blob([content], {
					type:
						contentType ??
						(typeof content === 'string' ? 'text/plain' : 'application/octet-stream')
				});

	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 *
 * @template {string} Keys
 * @param { { [K in Keys]?: unknown } } object the object to serialize
 * @param {readonly Keys[]} ordering an array of keys in target order, for the top-level object
 * @param {'json' | 'yaml'} format
 * @param {string} schema the json schema URL
 */
export function stringifyWithToplevelOrdering(format, schema, object, ordering) {
	let keysOrder = [...ordering];

	if (format === 'json') {
		// @ts-expect-error
		keysOrder = ['$schema', ...keysOrder];
	}

	/**
	 * @param {*} _
	 * @param {*} value
	 */
	const reviver = (_, value) => {
		if (value === null) return value;
		if (Array.isArray(value)) return value;
		if (typeof value !== 'object') return value;

		// @ts-expect-error
		if (Object.keys(value).every((key) => keysOrder.includes(key))) {
			return Object.fromEntries(keysOrder.map((key) => [key, value[key]]));
		}
		return value;
	};

	if (format === 'yaml') {
		const yamled = YAML.stringify(object, reviver, 2);
		return `# yaml-language-server: $schema=${schema}\n\n${yamled}`;
	}

	return JSON.stringify({ $schema: schema, ...object }, reviver, 2);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('stringifyWithToplevelOrdering', () => {
		expect(
			stringifyWithToplevelOrdering(
				'json',
				'http://example.com/schema.json',
				{ a: 1, b: 2, c: 3 },
				['a', 'c', 'a', 'b']
			)
		).toMatchInlineSnapshot(`
			"{
			  "$schema": "http://example.com/schema.json",
			  "a": 1,
			  "c": 3,
			  "b": 2
			}"
		`);

		expect(
			stringifyWithToplevelOrdering(
				'yaml',
				'http://example.com/schema.json',
				{ a: 1, b: 2, c: 3 },
				['a', 'c', 'a', 'b']
			)
		).toMatchInlineSnapshot(`
			"# yaml-language-server: $schema=http://example.com/schema.json

			a: 1
			c: 3
			b: 2
			"
		`);
	});
}
