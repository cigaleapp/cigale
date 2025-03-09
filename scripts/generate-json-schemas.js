import { writeFile } from 'node:fs/promises';
import { ExportedProtocol } from '../src/lib/protocols.js';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const outputDir = path.resolve(here, '../static/');

async function exportJsonSchema(name, schema) {
	const json = JSON.stringify(
		{
			$schema: 'https://json-schema.org/draft-07/schema',
			...schema.in.toJsonSchema()
		},
		null,
		2
	);
	await writeFile(path.resolve(outputDir, `${name}.schema.json`), json);
}

await exportJsonSchema('protocol', ExportedProtocol);
