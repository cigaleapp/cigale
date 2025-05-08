import { writeFile } from 'node:fs/promises';
import path from 'node:path';
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
	const json = JSON.stringify(
		{
			$schema: 'https://json-schema.org/draft-07/schema',
			...schema.in.toJsonSchema()
		},
		null,
		2
	);
	await writeFile(path.resolve(outputDir, `${name}.schema.json`).replace('C:\\C:\\', 'C:\\'), json);
}

if (process.argv[1] === import.meta.filename) {
	await exportJsonSchema('protocol', ExportedProtocol);
	await exportJsonSchema('taxonomy', Taxonomy);
	await exportJsonSchema('results', Analysis);
}
