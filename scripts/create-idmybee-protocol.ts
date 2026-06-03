import path from 'node:path';

import backbone from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };

const here = import.meta.dirname;

await Bun.write(
	path.join(here, '../protocols/idmybee.cigaleprotocol.json'),
	JSON.stringify({
		$schema: backbone.$schema,
		id: 'io.github.cigaleapp.idmybee',
		name: 'IDmyBee',
		summary: "Identification d'Andrènes par élimination",
		logo: 'https://cigaleapp.github.io/cigale/logos/idmybee.png',
		description:
			'Un protocole pour identifier des abeilles genre Andrena via des descripteurs, avec pré-élimination par classification par inférence de Morphogroupes',
		version: 1,
		updates: 'automatic',
		source: 'https://raw.githubusercontent.com/cigaleapp/cigale/main/protocols/idmybee.cigaleprotocol.json',
		authors: [],
		sessionMetadata: {},
		imports: [
			{
				from: 'io.github.cigaleapp.arthropods.example',
				metadataGroups: [
					'taxonomy' /* TODO: fix bugs related to imported metadata and narrow mode  'andrena'*/,
				],
				metadata: ['crop', 'conservation_status', 'identification_difficulty'],
			},
		],
		metadataOrder: ["morphogroup", ...backbone.metadataOrder.filter(m => !m.includes('morphogroup'))],
		metadataGroups: {
			andrena: {
				name: "Andrènes",
				collapsed: false,
				narrowable: true,
				"description": "Caractéristiques d'identification spécifiques aux abeilles du genre Andrena",

			}
		},
		metadata: {
			species: {
				label: 'Espèce',
				type: 'enum',
				required: true,
				description: '',
				mergeMethod: 'max',
				// XXX: Used to mark the metadata as the classification metadata
				infer: { neural: [] },
				options: backbone.metadata[
					'io.github.cigaleapp.arthropods.example__species'
				].options.filter((opt) => opt['x-generator'] === 'xper3'),
			},

			...Object.fromEntries(
				Object.entries(backbone.metadata).filter(([, { group }]) => group === 'andrena')
			),
		},
	} satisfies typeof ExportedProtocol.infer)
);
