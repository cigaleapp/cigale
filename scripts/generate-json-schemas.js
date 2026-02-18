import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { type } from 'arktype';

import { Analysis } from '../src/lib/schemas/exports.js';
import { ExportedProtocol, ProtocolRegistry } from '../src/lib/schemas/protocols.js';

const here = path.dirname(new URL(import.meta.url).pathname);
const outputDir = path.resolve(here, '../static/');

/**
 *
 * @param {string} name
 * @param {import('arktype').Type} schema
 */
async function exportJsonSchema(name, schema) {
	console.info(`Exporting JSON Schema for ${name}…`);
	let schemaObject = {
		$schema: 'https://json-schema.org/draft-07/schema',
		...schema.in.toJsonSchema()
	};

	// Remove any key that as a value matching a $ark.object
	const isArkObject = (entry) => type(["'table'", /^\$ark\.object\d+$/]).allows(entry);
	schemaObject = deleteKeys(schemaObject, isArkObject);

	const json = JSON.stringify(schemaObject, null, 2);
	await writeFile(
		path.resolve(outputDir, `${name}.schema.json`).replace(/([A-Z]):\\\1:\\/, '$1:\\'),
		json
	);
}

if (process.argv[1] === import.meta.filename) {
	await exportJsonSchema('protocol', ExportedProtocol);
	await exportJsonSchema('results', Analysis);
	await exportJsonSchema('registry', ProtocolRegistry);
}

function deleteKeys(obj, pred) {
	if (typeof obj !== 'object') return obj;
	if (Array.isArray(obj)) return obj.map((item) => deleteKeys(item, pred));

	return Object.fromEntries(
		Object.entries(obj)
			.filter((entry) => !pred(entry))
			.map(([key, value]) => [key, deleteKeys(value, pred)])
	);
}

if (import.meta.vitest) {
	const { it, expect, describe } = import.meta.vitest;

	describe('deleteKeys', () => {
		it('should remove keys that match the predicate', () => {
			const input = {
				a: 1,
				b: { $ark: { object1: true } },
				c: 3,
				d: { $ark: { object2: true } }
			};
			const result = deleteKeys(
				input,
				([, value]) => typeof value === 'object' && value.$ark
			);
			expect(result).toEqual({ a: 1, c: 3 });
		});

		it('should return an empty object if all keys match the predicate', () => {
			const input = { $ark: { object1: true } };
			const result = deleteKeys(
				input,
				([, value]) => typeof value === 'object' && value.object1
			);
			expect(result).toEqual({});
		});

		it('should return the same object if no keys match the predicate', () => {
			const input = { a: 1, b: 2 };
			const result = deleteKeys(
				input,
				([, value]) => typeof value === 'object' && value.$ark
			);
			expect(result).toEqual(input);
		});
	});
}
