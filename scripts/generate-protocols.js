import { readFile } from 'node:fs/promises';
import { execa } from 'execa';
import { type } from 'arktype';
import path from 'node:path';
import { writeFileSync } from 'node:fs';

const here = import.meta.dirname;

const classmapping = await fetch('https://cigaleapp.github.io/models/class_mapping.txt')
	.then((r) => r.text())
	.then((text) =>
		Object.fromEntries(
			text
				.split('\n')
				.filter((x) => x.trim())
				.map((line, i) => [line, i])
		)
	);

const oldProtocol = await readFile(
	path.join(here, '../examples/arthropods.cigaleprotocol.json'),
	'utf-8'
)
	.then((v) => JSON.parse(v))
	.then((v) => type({ version: 'number' }).assert(v))
	.catch((e) => {
		console.error('Could not load current protocol declaration:', e);
		console.error('Version will be set to 1');
		return undefined;
	});

/**
 * @template {string} T
 *  @param {T} id
 * @returns {`io.github.cigaleapp.arthropods.example__${T}`}
 */
const namespaced = (id) => `io.github.cigaleapp.arthropods.example__${id}`;

const cladeMetadata = (clade, label) => ({
	type: 'enum',
	options: [],
	label,
	required: false,
	description: '',
	mergeMethod: 'average',
	taxonomic: {
		clade,
		parent: {}
	}
});

/**
 * @type {typeof import('../src/lib/protocols').ExportedProtocol.inferIn}
 */
const protocol = {
	$schema: 'https://cigaleapp.github.io/cigale/protocol.schema.json',
	id: 'io.github.cigaleapp.arthropods.example',
	name: 'Example: arthropodes',
	learnMore: `https://github.com/cigaleapp/cigale/tree/${await execa`git rev-parse HEAD`.then((result) => result.stdout)}/scripts/README.md#protocoles-arthropodsexample`,
	version: (oldProtocol?.version ?? 0) + 1,
	source:
		'https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.json',
	description:
		'Protocole de transect pour l’identification des arthropodes. Descriptions et photos des espèces de Jessica Joachim, cf https://jessica-joachim.com/identification',
	authors: [
		{
			name: 'Jessica Joachim (photos et descriptions des espèces)',
			email: 'tifaeriis@gmail.com'
		}
	],
	metadataOrder: [
		'species',
		'genus',
		'family',
		'order',
		'shoot_date',
		'shoot_location',
		'class',
		'phylum',
		'kingdom',
		'crop',
		'crop_is_confirmed'
	].map(namespaced),
	metadata: {
		[namespaced('kingdom')]: cladeMetadata('kingdom', 'Règne'),
		[namespaced('phylum')]: cladeMetadata('phylum', 'Phylum'),
		[namespaced('class')]: cladeMetadata('class', 'Classe'),
		[namespaced('order')]: cladeMetadata('order', 'Ordre'),
		[namespaced('family')]: cladeMetadata('family', 'Famille'),
		[namespaced('genus')]: cladeMetadata('genus', 'Genre'),
		[namespaced('shoot_date')]: {
			type: 'date',
			label: 'Date',
			description: 'Moment où la photo a été prise',
			required: false,
			mergeMethod: 'average',
			infer: { exif: 'DateTimeOriginal' }
		},
		[namespaced('shoot_location')]: {
			type: 'location',
			label: 'Localisation',
			description: 'Endroit où la photo a été prise',
			required: false,
			mergeMethod: 'average',
			infer: { latitude: { exif: 'GPSLatitude' }, longitude: { exif: 'GPSLongitude' } }
		},
		[namespaced('crop')]: {
			type: 'boundingbox',
			label: '',
			description: '',
			required: true,
			mergeMethod: 'average'
		},
		[namespaced('crop_is_confirmed')]: {
			type: 'boolean',
			label: '',
			description: '',
			required: false,
			mergeMethod: 'max'
		},
		[namespaced('species')]: {
			type: 'enum',
			label: 'Espèce',
			description: '',
			required: true,
			mergeMethod: 'max',
			options: Object.entries(classmapping)
				.map(([name, index]) => ({
					key: index.toString(),
					label: name,
					description: ''
				}))
				.sort((a, b) => parseFloat(a.key) - parseFloat(b.key)),
			taxonomic: {
				clade: 'species',
				parent: {}
			},
			infer: {
				neural: {
					model: 'https://cigaleapp.github.io/models/model_classif.onnx',
					metadata: namespaced('species'),
					input: {
						height: 224,
						width: 224,
						disposition: 'CHW',
						normalized: true
					}
				}
			}
		}
	},
	crop: {
		metadata: namespaced('crop'),
		confirmationMetadata: namespaced('crop_is_confirmed'),
		infer: {
			model: 'https://cigaleapp.github.io/models/arthropod_detector_yolo11n_conf0.437.onnx',
			input: {
				height: 640,
				width: 640,
				disposition: '1CHW',
				normalized: true
			},
			output: {
				normalized: true,
				shape: ['sx', 'sy', 'ex', 'ey', 'score', '_']
			}
		}
	},
	exports: {
		images: {
			cropped:
				'Cropped/{{ fallback image.protocolMetadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}',
			original:
				'Original/{{ fallback image.protocolMetadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}'
		},
		metadata: {
			json: 'analysis.json',
			csv: 'metadata.csv'
		}
	}
};

writeFileSync(
	here,
	'../examples/old-arthropods.cigaleprotocol.json',
	JSON.stringify(oldProtocol, null, 2)
);

writeFileSync(
	path.join(here, '../examples/arthropods.cigaleprotocol.json'),
	JSON.stringify(protocol, null, 2)
);

console.log(
	'===============================================================\n' +
		`Generated cigale protocol ${protocol.id} v${protocol.version}\n` +
		'==============================================================='
);
