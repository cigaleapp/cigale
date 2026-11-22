/// <reference types="@types/node" />
/// <reference types="@types/bun" />

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { ExportedProtocol, ProtocolRegistry } from '#lib/schemas/protocols.js';

import YAML from 'yaml';

const root = path.dirname(import.meta.dir);

// CLI: bun run scripts/generate-protocol-registry.ts [directory] [base url]

const [dirArg = 'protocols', baseUrl = 'http://localhost:3000'] = process.argv.slice(2);

const directory = path.join(root, dirArg);
const outPath = path.join(directory, 'registry.json');
mkdirSync(path.dirname(outPath), { recursive: true });

await writeRegistry({
	directory,
	transformSource: (url) => baseUrl.replace(/\/$/, '') + url.pathname + url.search,
	filter: () => true,
	outPath,
});

/**
 * Scans a directory for `*.cigaleprotocol.{json,yaml}` files and writes a
 * `registry.json`, one entry per protocol passing the filter. Protocols
 * without a declared `version` are skipped.
 *
 * @param transformSource transform the source url
 * @param directory Directory to scan for protocol files
 * @param filter Returns whether a protocol id should be included in the registry
 * @param outPath Where to write the registry (defaults to `registry.json` in `directory`)
 */
export async function writeRegistry({
	directory,
	transformSource,
	filter,
	outPath,
}: {
	directory: string;
	transformSource: (u: URL) => URL | string;
	filter: (id: string) => boolean;
	outPath?: string;
}) {
	const glob = new Bun.Glob('**/*.cigaleprotocol.{json,yaml}');
	const files = glob.scanSync({ cwd: directory });

	const protocols = new Map<string, (typeof ProtocolRegistry.inferIn)['protocols'][number]>();

	for (const entry of files) {
		const file = path.join(directory, entry);
		const parsed = YAML.parse(await Bun.file(file).text()) as typeof ExportedProtocol.inferIn;
		if (parsed.version === undefined) continue;
		if (!parsed.source) continue;
		if (!filter(parsed.id)) continue;

		const manifestVersion = (parsed.manifest ?? 'v0.0').replace(/^v/, '');

		protocols.set(parsed.id, {
			name: parsed.name,
			version: parsed.version,
			manifestVersion,
			older: [],
			id: parsed.id,
			url: transformSource(new URL(parsed.source)).toString(),
		});
	}

	const out = outPath ?? path.join(directory, 'registry.json');

	await Bun.file(out).write(
		JSON.stringify(
			{
				$schema: path
					.relative(path.dirname(out), path.join(root, 'static', 'registry.schema.json'))
					.replaceAll('\\', '/'),
				protocols: [...protocols.values()],
			},
			null,
			'\t'
		)
	);
}
