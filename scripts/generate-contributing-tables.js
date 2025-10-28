import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { JSONSchemaMarkdownDoc } from 'json-schema-doc-ts';

import { Tables } from '../src/lib/database.js';

/**
 *
 * @param {string} name
 * @param {import('arktype').Type} typ
 */
function documentTable(name, typ) {
	console.info(`Documenting table: ${name}`);
	return `### ${name}\n\n${new JSONSchemaMarkdownDoc(typ.out.toJsonSchema()).generate()}`;
}

const here = path.dirname(new URL(import.meta.url).pathname);
const contributingPath = path.join(here, '../CONTRIBUTING.md').replace('\\C:', 'C:');
let content = await readFile(contributingPath, 'utf-8');

// Content is to be inserted between a start:marker and an end:marker comment
const markerComment = 'jsonschema-tables';
content = content.replace(
	new RegExp(
		`(<!--\\s*${markerComment}\\s*start\\s*-->)[\\s\\S]*?(<!--\\s*${markerComment}\\s*end\\s*-->)`
	),
	(_, start, end) =>
		`${start}\n\n${Object.entries(Tables)
			.map(([name, typ]) => documentTable(name, typ))
			.join('\n\n')}\n\n${end}`
);

await writeFile(contributingPath, content, 'utf-8');
