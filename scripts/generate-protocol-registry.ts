/// <reference types="@types/node" />
/// <reference types="@types/bun" />

import { execSync } from 'node:child_process';
import path from 'node:path';
import type { ProtocolRegistry } from '../src/lib/schemas/protocols.js';

import YAML from 'yaml';

const glob = new Bun.Glob('{protocols,examples}/*.cigaleprotocol.{json,yaml}');
const root = path.dirname(import.meta.dir);

const files = glob.scanSync({ cwd: root });

const registry: (typeof ProtocolRegistry)['inferIn'] = {
	protocols: [],
};

for (const file of files) {
	const parsed = YAML.parse(await Bun.file(file).text());

	registry.protocols.push({
		id: parsed.id,
		name: parsed.name,
		logo: parsed.logo,
		version: parsed.version,
		suggested: file.includes('/protocols/'),
		url: `https://raw.githubusercontent.com/cigaleapp/cigale/${execSync(`git rev-parse HEAD`)}/${path.relative(root, file)}`,
	});
}

await Bun.file(path.join(root, 'static', 'registry.json')).write(
	JSON.stringify(
		{
			$schema: 'https://cigaleapp.github.io/cigale/registry.schema.json',
			...registry,
		},
		null,
		2
	)
);
