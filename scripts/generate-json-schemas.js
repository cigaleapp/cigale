import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { type } from 'arktype';
import { ExportedProtocol } from '../src/lib/protocols.js';
import { Analysis } from '../src/lib/schemas/results.js';
import { Taxonomy } from '../src/lib/taxonomy.js';

const here = path.dirname(new URL(import.meta.url).pathname);
const outputDir = path.resolve(here, '../static/');

/**
 *
 * @param {string} name
 * @param {import('arktype').Type} schema
 */
async function exportJsonSchema(name, schema) {
	let schemaObject = {
		$schema: 'https://json-schema.org/draft-07/schema',
		...schema.in.toJsonSchema()
	};

	// Remove any key that as a value matching a $ark.object
	const isArkObject = (entry) => type(["'table'", /^\$ark\.object\d+$/]).allows(entry);
	schemaObject = deleteKeys(schemaObject, isArkObject);

	const json = JSON.stringify(schemaObject, null, 2);
	await writeFile(path.resolve(outputDir, `${name}.schema.json`).replace('C:\\C:\\', 'C:\\'), json);
}

if (process.argv[1] === import.meta.filename) {
	await exportJsonSchema('protocol', ExportedProtocol);
	await exportJsonSchema('taxonomy', Taxonomy);
	await exportJsonSchema('results', Analysis);
}

function deleteKeys(obj, pred) {
	return Object.fromEntries(
		Object.entries(obj)
			.filter((entry) => pred(entry))
			.map((entry) => deleteKeys(entry, pred))
	);
}
