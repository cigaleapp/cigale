/// <reference types="@types/node" />
/// <reference types="@types/bun" />

import { mkdirSync } from 'node:fs';
import path from 'node:path';

import YAML from 'yaml';

const root = path.dirname(import.meta.dir);

// CLI: bun run scripts/generate-local-registry.ts [directory] [baseUrl]
const [dirArg, baseUrlArg] = process.argv.slice(2);
const directory = path.join(root, dirArg ?? 'protocols');
const baseUrl = baseUrlArg ?? 'http://localhost:3000/';
const outPath = path.join(directory, 'registry.json');
mkdirSync(path.dirname(outPath), { recursive: true });

// Precompute id → file path so idToUrl is a simple lookup
const idToFile = new Map();
for (const entry of new Bun.Glob('**/*.cigaleprotocol.{json,yaml}').scanSync({ cwd: directory })) {
	const file = path.join(directory, entry);
	const parsed = YAML.parse(await Bun.file(file).text());
	idToFile.set(parsed.id, file);
}

await writeRegistry({
	idToUrl: (id) => {
		const file = idToFile.get(id);
		if (!file) throw new Error(`No protocol file found for id ${id}`);
		return new URL(path.relative(directory, file).replaceAll('\\', '/'), baseUrl).toString();
	},
	directory,
	filter: () => true,
	outPath,
});

/**
 * Scans a directory for `*.cigaleprotocol.{json,yaml}` files and writes a
 * `registry.json`, one entry per protocol passing the filter. Protocols
 * without a declared `version` are skipped.
 *
 * @param idToUrl Turns a protocol id into the URL to download it from
 * @param directory Directory to scan for protocol files
 * @param filter Returns whether a protocol id should be included in the registry
 * @param outPath Where to write the registry (defaults to `registry.json` in `directory`)
 */
export async function writeRegistry({
	idToUrl,
	directory,
	filter,
	outPath,
}: {
	idToUrl: (id: string) => string;
	directory: string;
	filter: (id: string) => boolean;
	outPath?: string;
}) {
	const glob = new Bun.Glob('**/*.cigaleprotocol.{json,yaml}');
	const files = glob.scanSync({ cwd: directory });

	const protocols = [];

	for (const entry of files) {
		const file = path.join(directory, entry);
		const parsed = YAML.parse(await Bun.file(file).text());
		if (parsed.version === undefined) continue;
		if (!filter(parsed.id)) continue;

		const manifestVersion = (parsed.manifest ?? 'v0.0').replace(/^v/, '');

		protocols.push({
			name: parsed.name,
			version: parsed.version,
			manifestVersion,
			older: [],
			id: parsed.id,
			url: idToUrl(parsed.id),
		});
	}

	const out = outPath ?? path.join(directory, 'registry.json');

	await Bun.file(out).write(
		JSON.stringify(
			{
				$schema: path
					.relative(path.dirname(out), path.join(root, 'static', 'registry.schema.json'))
					.replaceAll('\\', '/'),
				protocols,
			},
			null,
			'\t'
		)
	);
}
