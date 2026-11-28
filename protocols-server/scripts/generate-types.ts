/// <reference types="@types/bun" />

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

generateTypes('protocol.schema.json', 'protocol-types.ts', 'ExportedProtocol');
generateTypes('registry.schema.json', 'registry-types.ts', 'ProtocolRegistry');

function generateTypes(schemaName: string, outName: string, topLevel: string) {
	const here = dirname(fileURLToPath(import.meta.url));
	const root = join(here, '..');
	// Repo layout: <repo>/static/. Container layout: /app/static/.
	const staticDir = [join(root, '..', 'static'), join(root, 'static')].find((p) =>
		existsSync(p)
	)!;
	if (!staticDir) throw new Error('static/ dir not found');

	const schemaPath = join(staticDir, schemaName);
	if (!existsSync(schemaPath)) throw new Error(`${schemaName} not found`);
	const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
	convert(schema);

	const tmpPath = join(root, `.${schemaName.replace('.json', '')}.tmp.json`);
	writeFileSync(tmpPath, JSON.stringify(schema, null, 2));

	try {
		execSync(
			`bunx quicktype -o ${outName} --src-lang schema "${tmpPath}" --top-level ${topLevel} --no-runtime-typecheck`,
			{ cwd: root, stdio: 'inherit' }
		);
	} finally {
		unlinkSync(tmpPath);
	}
}

// Recursively:
//  1. Convert `patternProperties` into `additionalProperties`. QuickType
//     doesn't support `patternProperties` (it falls back to `unknown` values),
//     but it does support `additionalProperties`. Every node in these schemas
//     has at most one pattern key, so the conversion is lossless for typing.
//  2. Close plain object nodes by adding `additionalProperties: false` when
//     unspecified. JSON Schema objects are open by default, which QuickType
//     models as a `[property: string]: unknown` index signature on every
//     interface — unwanted, and it breaks `Omit<...>` etc. Genuinely open
//     records (the patternProperties ones) already have a typed
//     `additionalProperties` and are left alone.
function convert(node?: {
	patternProperties?: Record<string, unknown>;
	additionalProperties?: boolean | Record<string, unknown>;
	type?: string;
	properties?: Record<string, unknown>;
	[x: string]: unknown;
}) {
	// Composition keywords that change a node's semantics — don't close those.
	const COMPOSITION = new Set(['anyOf', 'oneOf', 'allOf', 'not', 'if', 'then', 'else']);

	if (node && typeof node === 'object') {
		if (node.patternProperties) {
			const keys = Object.keys(node.patternProperties);
			if (keys.length === 1) {
				// @ts-expect-error i dont have a typescript type for json schema lol
				node.additionalProperties = node.patternProperties[keys[0]];
			} else {
				node.additionalProperties = { anyOf: keys.map((k) => node.patternProperties![k]) };
			}
			delete node.patternProperties;
		}
		const isObject = node.type === 'object' || node.properties !== undefined;
		const isComposed = [...COMPOSITION].some((k) => node[k] !== undefined);
		if (isObject && !isComposed && node.additionalProperties === undefined) {
			node.additionalProperties = false;
		}

		// @ts-expect-error i dont have a typescript type for json schema lol
		for (const v of Object.values(node)) convert(v);
	}
}
