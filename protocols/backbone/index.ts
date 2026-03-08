import path from 'node:path';

import { ExportedProtocol } from '../../src/lib/schemas/protocols.js';
import { run } from './module.ts';
import _lighten from './modules/lighten.ts';

const lighten = (n: number) => ({
	..._lighten,
	name: `${_lighten.name} #${n}`,
	priority: n
});

const base = await here('base.yml')
	.text()
	.then((text) => Bun.YAML.parse(text))
	.then((yaml) => ExportedProtocol.in.assert(yaml));

const final = await run(
	base,
	[lighten(1), lighten(10)],
	[lighten(2)],
	[lighten(3), lighten(4), lighten(5)]
);

// const final = await run(
// 	base,
// 	[huggingFace, idMyBee.stub, versioning],
// 	[gbif],
// 	[iucn, idMyBee, jessicaJoachim.species, jessicaJoachim.genus, googleSlides],
// 	[lighten]
// );

await here('../backbone.arthropods.cigaleprotocol.json').write(JSON.stringify(final, null, 2));

export function here(...segments: string[]) {
	return Bun.file(path.join(import.meta.dir, ...segments));
}
