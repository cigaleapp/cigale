import { ExportedProtocol } from '../../src/lib/schemas/protocols.js';
import { run } from './module.ts';
import gbif from './modules/gbif.ts';
import huggingface from './modules/huggingface.ts';
import lighten from './modules/lighten.ts';
import write from './modules/write.ts';
import { here } from './utils.ts';

const base = await here('base.yml')
	.text()
	.then((text) => Bun.YAML.parse(text))
	.then((yaml) => ExportedProtocol.in.assert(yaml));

await run(
	base,
	[huggingface],
	[gbif],
	// XXX: DONT MERGE
	[write('../../examples/arthropods.cigaleprotocol.json')]
);

await run(
	base,
	[huggingface],
	[lighten],
	[gbif],
	// XXX: DONT MERGE
	// ../backbone.arthropods.cigaleprotocol.json
	[write('../../examples/arthropods.light.cigaleprotocol.json')]
);
