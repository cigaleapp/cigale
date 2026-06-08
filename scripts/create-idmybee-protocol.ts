import path from 'node:path';
import type { ExportedProtocol } from '../src/lib/schemas/protocols.js';

import backbone from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };

const here = import.meta.dirname;

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
		version: 1,
		updates: 'automatic',
		source: 'https://raw.githubusercontent.com/cigaleapp/cigale/main/protocols/idmybee.cigaleprotocol.json',
		authors: [],
		sessionMetadata: {},
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
			...backbone.metadataOrder.filter((m) => !m.includes('morphogroup')),
		],
		metadataGroups: {
			andrena: {
				name: 'Andrènes',
				collapsed: false,
				narrowable: true,
				description:
					"Caractéristiques d'identification spécifiques aux abeilles du genre Andrena",
			},
		},
		metadata: {
			species: {
				label: 'Espèce',
				type: 'enum',
				required: true,
				description: '',
				mergeMethod: 'max',
				classification: true,
				options: backbone.metadata[
					'io.github.cigaleapp.arthropods.example__species'
				].options.filter((opt) => opt['x-generator'] === 'xper3'),
			},
			...Object.fromEntries(
				Object.entries(backbone.metadata).filter(
					([, m]) => 'group' in m && m.group === 'andrena'
				)
			),
		},
	} satisfies typeof ExportedProtocol.inferIn)
);
