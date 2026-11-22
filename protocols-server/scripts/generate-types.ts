/// <reference types="@types/bun" />

import { execSync } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
// Repo layout: <repo>/static/protocol.schema.json. Container layout: /app/static/.
const schemaPath = [join(root, '..', 'static', 'protocol.schema.json'), join(root, 'static', 'protocol.schema.json')].find(
	(p) => existsSync(p)
);
if (!schemaPath) throw new Error('protocol.schema.json not found');
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

// Composition keywords that change a node's semantics — don't close those.
const COMPOSITION = new Set(['anyOf', 'oneOf', 'allOf', 'not', 'if', 'then', 'else']);

// Recursively:
//  1. Convert `patternProperties` into `additionalProperties`. QuickType
//     doesn't support `patternProperties` (it falls back to `unknown` values),
//     but it does support `additionalProperties`. Every node in this schema
//     has at most one pattern key, so the conversion is lossless for typing.
//  2. Close plain object nodes by adding `additionalProperties: false` when
//     unspecified. JSON Schema objects are open by default, which QuickType
//     models as a `[property: string]: unknown` index signature on every
//     interface — unwanted, and it breaks `Omit<...>` etc. Genuinely open
//     records (the patternProperties ones) already have a typed
//     `additionalProperties` and are left alone.
function convert(node: any) {
	if (node && typeof node === 'object') {
		if (node.patternProperties) {
			const keys = Object.keys(node.patternProperties);
			if (keys.length === 1) {
				node.additionalProperties = node.patternProperties[keys[0]];
			} else {
				node.additionalProperties = { anyOf: keys.map((k) => node.patternProperties[k]) };
			}
			delete node.patternProperties;
		}
		const isObject = node.type === 'object' || node.properties !== undefined;
		const isComposed = [...COMPOSITION].some((k) => node[k] !== undefined);
		if (isObject && !isComposed && node.additionalProperties === undefined) {
			node.additionalProperties = false;
		}
		for (const v of Object.values(node)) convert(v);
	}
}
convert(schema);

const tmpPath = join(root, '.protocol.schema.tmp.json');
writeFileSync(tmpPath, JSON.stringify(schema, null, 2));

try {
	execSync(
		`bunx quicktype -o protocol-types.ts --src-lang schema "${tmpPath}" --top-level ExportedProtocol --no-runtime-typecheck`,
		{ cwd: root, stdio: 'inherit' }
	);
} finally {
	unlinkSync(tmpPath);
}
