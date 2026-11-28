/// <reference types="@types/node" />
/// <reference types="@types/bun" />

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { ExportedProtocol } from '../protocol-types.js';
import type { ProtocolRegistry } from '../registry-types.js';

import config from '../server/config.js';

const root = path.dirname(import.meta.dir); // protocols-server/

// CLI: bun run protocols-server/scripts/generate-protocol-registry.ts [directory] [base url]
if (import.meta.main) {
	const [dirArg, baseUrlArg] = process.argv.slice(2);
	const baseUrl = baseUrlArg ?? process.env.WEB_ORIGIN;
	const directory = dirArg ? path.resolve(dirArg) : path.join(root, '..', 'protocols');
	const outPath = path.join(directory, 'registry.json');
	mkdirSync(path.dirname(outPath), { recursive: true });

	if (baseUrl) {
		const amended = amendManifests(directory, baseUrl);
		if (amended.length > 0) {
			console.info(`Amended ${amended.length} protocol manifest(s) to use ${baseUrl}:`);
			for (const file of amended) console.info(`  - ${file}`);
		}
	}

	const registryPath = writeRegistry({
		directory,
		transformSource: baseUrl
			? (url) => baseUrl.replace(/\/+$/, '') + url.pathname + url.search
			: undefined,
		filter: () => true,
		outPath,
	});

	console.info(`Generated protocol registry at ${registryPath}`);
}

// The registry schema lives in the repo's static/ dir (copied to /app/static
// in the container). Repo layout: <repo>/static/. Container layout: /app/static/.
function schemaPath(): string {
	return (
		[
			path.join(root, '..', 'static', 'registry.schema.json'),
			path.join(root, 'static', 'registry.schema.json'),
		].find((p) => existsSync(p)) ?? path.join(root, '..', 'static', 'registry.schema.json')
	);
}

/**
 * Rewrite the hardcoded `LOCAL_DEV_ORIGIN` references in the protocol
 * manifests to `baseUrl`. Returns the relative paths of the amended files.
 * A no-op when `baseUrl` is `LOCAL_DEV_ORIGIN` (e.g. codegen from the
 * repo root, where WEB_ORIGIN is unset).
 */
export function amendManifests(directory: string, baseUrl: string): string[] {
	if (!baseUrl) return [];
	const target = baseUrl.replace(/\/+$/, '');
	if (target === config.LOCAL_DEV_ORIGIN) return [];
	const glob = new Bun.Glob('**/*.cigaleprotocol.{json,yaml}');
	const amended: string[] = [];
	for (const entry of glob.scanSync({ cwd: directory })) {
		const file = path.join(directory, entry);
		const text = readFileSync(file, 'utf8');
		const out = text.replaceAll(config.LOCAL_DEV_ORIGIN, target);
		if (out !== text) {
			writeFileSync(file, out);
			amended.push(entry);
		}
	}
	return amended;
}

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
export function writeRegistry({
	directory,
	transformSource,
	filter,
	outPath,
}: {
	directory: string;
	transformSource: undefined | ((u: URL) => URL | string);
	filter: (id: string) => boolean;
	outPath?: string;
}): string {
	const glob = new Bun.Glob('**/*.cigaleprotocol.{json,yaml}');
	const files = glob.scanSync({ cwd: directory });

	const protocols = new Map<string, ProtocolRegistry['protocols'][number]>();

	for (const entry of files) {
		const file = path.join(directory, entry);
		const parsed = Bun.YAML.parse(readFileSync(file, 'utf8')) as ExportedProtocol;
		if (parsed.version === undefined) continue;
		if (!parsed.source) continue;
		if (!filter(parsed.id)) continue;

		const manifestVersion = (parsed.manifest ?? 'v0.0').replace(/^v/, '');
		const sourceUrl = new URL(
			typeof parsed.source === 'string' ? parsed.source : parsed.source.url
		);

		protocols.set(parsed.id, {
			name: parsed.name,
			version: parsed.version,
			manifestVersion,
			logo: parsed.logo,
			summary: parsed.summary,
			suggested: (parsed.usable ?? true) && !parsed.id.includes('.examples.'),
			older: [],
			id: parsed.id,
			url: (transformSource?.(sourceUrl) ?? sourceUrl).toString(),
		});
	}

	const out = outPath ?? path.join(directory, 'registry.json');
	writeFileSync(
		out,
		JSON.stringify(
			{
				$schema: transformSource
					? transformSource(new URL('/registry.schema.json', config.LOCAL_DEV_ORIGIN))
					: path.relative(path.dirname(out), schemaPath()).replaceAll('\\', '/'),
				protocols: [...protocols.values()],
			},
			null,
			'\t'
		)
	);
	return out;
}
