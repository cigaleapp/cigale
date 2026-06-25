import path from 'node:path';
import type { ExportedProtocol } from '../src/lib/schemas/protocols.js';

import backbone from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import { version as oldVersion } from '../protocols/idmybee.cigaleprotocol.json' with { type: 'json' };

const here = import.meta.dirname;

const descriptors = Object.fromEntries(
	Object.entries(backbone.metadata)
		.filter(([, m]) => 'group' in m && m.group === 'andrena')
		.map(([id, metadata]) => [id.replace(`${backbone.id}__`, ''), metadata])
);

await Bun.write(
	path.join(here, '../protocols/idmybee.cigaleprotocol.json'),
	JSON.stringify({
		// TODO: remove once #1750 is fixed
		// @ts-expect-error - $schema is technically not allowed
		$schema: backbone.$schema,
		id: 'io.github.cigaleapp.idmybee',
		name: 'IDmyBee',
		summary: "Identification d'Andrènes par élimination",
		logo: 'https://cigaleapp.github.io/cigale/logos/idmybee.png',
		description:
			'Un protocole pour identifier des abeilles genre Andrena via des descripteurs, avec pré-élimination par classification par inférence de Morphogroupes',
		version: oldVersion + 1,
		updates: 'automatic',
		source: 'https://raw.githubusercontent.com/cigaleapp/cigale/main/protocols/idmybee.cigaleprotocol.json',
		authors: [],
		sessionMetadata: {},
		exports: backbone.exports,
		// TODO: use this once #1696 is merged
		imports: [
			// {
			// 	from: 'io.github.cigaleapp.arthropods.example',
			// 	metadataGroups: [
			// 		'taxonomy' /* TODO: fix bugs related to imported metadata and narrow mode  'andrena'*/,
			// 	],
			// 	metadata: ['crop', 'conservation_status', 'identification_difficulty'],
			// },
		],
		metadataOrder: [
			'morphogroup',
			...Object.keys(descriptors).filter((d) => d !== 'morphogroup'),
		],
		metadataGroups: {
			andrena: {
				name: 'Andrènes',
				collapsed: true,
				narrowable: true,
				description:
					"Caractéristiques d'identification spécifiques aux abeilles du genre Andrena",
			},
		},
		metadata: {
			crop: backbone.metadata[`${backbone.id}__crop`],
			species: {
				label: 'Espèce',
				type: 'enum',
				required: true,
				description: '',
				mergeMethod: 'max',
				classification: true,
				options: backbone.metadata[`${backbone.id}__species`].options.filter(
					(opt) => opt['x-generator'] === 'xper3'
				),
			},
			...descriptors,
		},
	} satisfies typeof ExportedProtocol.inferIn)
);
