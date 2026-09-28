/// <reference types="@types/node" />
/// <reference types="@types/bun" />

import { execSync } from 'node:child_process';
import path from 'node:path';
import type { ProtocolRegistry } from '../src/lib/schemas/protocols.js';

import { uniqBy } from 'es-toolkit';
import YAML from 'yaml';

const glob = new Bun.Glob('{protocols,examples}/*.cigaleprotocol.{json,yaml}');
const commit = execSync(`git rev-parse HEAD`).toString().trim();
const root = path.dirname(import.meta.dir);

const files = glob.scanSync({ cwd: root });

const registry: (typeof ProtocolRegistry)['inferIn'] = {
	protocols: [],
};

for (const file of files) {
	const parsed = YAML.parse(await Bun.file(file).text());
	const folder = path.dirname(path.relative(root, file));

	registry.protocols.push({
		id: parsed.id,
		name: parsed.name,
		logo: parsed.logo,
		version: parsed.version,
		suggested: folder === 'protocols',
		url: `https://raw.githubusercontent.com/cigaleapp/cigale/${commit}/${path.relative(root, file).replaceAll('\\', '/')}`,
	});
}

registry.protocols = uniqBy(registry.protocols, (p) => p.id);

await Bun.file(path.join(root, 'src/lib', 'registry.json')).write(
	JSON.stringify(
		{
			$schema: 'https://cigaleapp.github.io/cigale/registry.schema.json',
			...registry,
		},
		null,
		2
	)
);
