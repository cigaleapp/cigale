import { writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { type } from 'arktype';
import { x } from 'tinyexec';

const BEAMUP_ORIGIN = 'https://beamup.cigale.gwen.works';

const here = import.meta.dirname;

async function gbifIds(url) {
	return fetch(url)
		.then((res) => res.text())
		.then((text) =>
			text
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => Boolean(line))
				.filter((line) => !Number.isNaN(Number.parseInt(line)))
		);
}

const lightweightModelGbifIds = await gbifIds(
	'https://cigaleapp.github.io/models/lightweight-80-classmapping.txt'
);

const allGbifIds = new Set([
	...(await gbifIds('https://cigaleapp.github.io/models/polymny-17k-classmapping.txt')),
	...lightweightModelGbifIds
]);

/** @type { Record<string, { name: string; synonyms: string[] }>} */
let gbifCache = await fetch(
	'https://raw.githubusercontent.com/cigaleapp/models/main/gbif-cache.json'
)
	.then((res) => res.json())
	.catch((e) =>
		console.error(
			'Could not fetch GBIF ID to canonical name mapping:',
			e,
			'will use GBIF API instead (slow!)'
		)
	);

console.info(`Protocol has ${allGbifIds.size} species options`);

/**
 * @type {Array<typeof import('../src/lib/schemas/metadata').MetadataEnumVariant.infer>}
 */
const options = [];

for (const gbifId of allGbifIds) {
	gbifCache[gbifId] ??= await fetch(`https://api.gbif.org/v1/species/${gbifId}/synonyms`)
		.then((res) => res.json())
		.then(async ({ results }) => {
			if (!results.length) {
				return {
					name: await fetch(`https://api.gbif.org/v1/species/${gbifId}/name`)
						.then((res) => res.json())
						.then((data) => data.canonicalName),
					synonyms: []
				};
			}

			const name = results[0].species;

			/** @type {Set<string>} */
			const synonyms = new Set(results.map((r) => r.canonicalName));
			synonyms.delete(name);

			return { name, synonyms: [...synonyms] };
		});

	const { name, synonyms } = gbifCache[gbifId];

	process.stdout.write(`\x1b[2K\r[${options.length}/${allGbifIds.size}] ${gbifId} -> ${name}`);
	// gbifCache[gbifId] = { name, synonyms };
	options.push({
		key: gbifId,
		label: name,
		// Remove mystery null values
		synonyms: synonyms.filter(Boolean),
		description: '',
		learnMore: `https://gbif.org/species/${gbifId}`
	});
}

// writeFileSync(path.join(here, 'gbif-cache.json'), JSON.stringify(gbifCache, null, 2));

options.sort((a, b) => a.label.localeCompare(b.label));

console.info('');

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
	mergeMethod: 'max'
});

/**
 * @type {typeof import('../src/lib/protocols').ExportedProtocol.inferIn}
 */
const protocol = {
	$schema: 'https://cigaleapp.github.io/cigale/protocol.schema.json',
	id: 'io.github.cigaleapp.arthropods.example',
	name: 'Example: arthropodes',
	learnMore: `https://github.com/cigaleapp/cigale/tree/${await x('git', ['rev-parse', 'HEAD']).then((result) => result.stdout.trim())}/scripts/README.md#protocoles-arthropodsexample`,
	version: (oldProtocol?.version ?? 0) + 1,
	source: 'https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.json',
	description:
		'Protocole de transect pour l’identification des arthropodes. Descriptions et photos des espèces de Jessica Joachim, cf https://jessica-joachim.com/identification',
	authors: [
		{
			name: 'GBIF Contributors',
			email: 'info@gbif.org'
		},
		{
			name: 'Jessica Joachim',
			email: 'tifaeriis@gmail.com'
		},
		{
			name: 'Gwenn Le Bihan',
			email: 'gwenn.lebihan7@gmail.com'
		},
		{
			name: 'Maxime Cauchoix'
		},
		{
			name: 'Léo Chekir'
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
			mergeMethod: 'union'
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
			options: options.sort((a, b) => parseFloat(a.key) - parseFloat(b.key)),
			infer: {
				neural: [
					{
						name: 'Arthropodes (~17000 classes)',
						description: 'Terrestres, France métropolitaine', // TODO
						// FIXME: github release downloads are not cors-enabled, so we use a CORS proxy... this one has a 2GB bandwidth limit, if things are actually cached correctly it should be fine?
						model: 'https://media.gwen.works/cigale/models/classification-arthropoda-polymny-2025-04-11.onnx',
						classmapping:
							'https://raw.githubusercontent.com/cigaleapp/models/main/polymny-17k-classmapping.txt',
						input: {
							height: 224,
							width: 224,
							disposition: 'CHW',
							normalized: true
						}
					},
					{
						name: 'Collemboles (~80 classes)',
						model: 'https://raw.githubusercontent.com/cigaleapp/models/main/model_classif.onnx',
						classmapping:
							'https://raw.githubusercontent.com/cigaleapp/models/main/lightweight-80-classmapping.txt',
						input: {
							height: 224,
							width: 224,
							disposition: 'CHW',
							normalized: true
						}
					}
				]
			}
		}
	},
	crop: {
		metadata: namespaced('crop'),
		confirmationMetadata: namespaced('crop_is_confirmed'),
		infer: [
			{
				model: 'https://raw.githubusercontent.com/cigaleapp/models/main/arthropod_detector_yolo11n_conf0.437.onnx',
				name: 'YOLO11',
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
		]
	},
	exports: {
		images: {
            mtime: namespaced('shoot_date'),
			cropped:
				'Cropped/{{ fallback image.protocolMetadata.species.valueLabel "(Unknown)" }}_obs{{ observation.number }}_{{ sequence }}.{{ extension image.filename }}',
			original:
				'Original/{{ fallback image.protocolMetadata.species.valueLabel "(Unknown)" }}_obs{{ observation.number }}_{{ sequence }}.{{ extension image.filename }}'
		},
		metadata: {
			json: 'analysis.json',
			csv: 'metadata.csv'
		}
	},
	beamup: {
		origin: BEAMUP_ORIGIN
	}
};

writeFileSync(
	path.join(here, '../examples/old-arthropods.cigaleprotocol.json'),
	JSON.stringify(oldProtocol, null, 2)
);

writeFileSync(
	path.join(here, '../examples/arthropods.cigaleprotocol.json'),
	JSON.stringify(protocol, null, 2)
);

writeFileSync(
	path.join(here, '../examples/arthropods.light.cigaleprotocol.json'),
	JSON.stringify(
		{
			...protocol,
			id: 'io.github.cigaleapp.arthropods.example.light',
			name: `Example: arthropodes (lightweight)`,
			source: protocol.source.replace(
				'arthropods.cigaleprotocol.json',
				'arthropods.light.cigaleprotocol.json'
			),
			learnMore: protocol.learnMore.replace('arthropodsexample', 'arthropodsexamplelight'),
			metadata: {
				...protocol.metadata,
				[namespaced('species')]: {
					...protocol.metadata[namespaced('species')],
					options: protocol.metadata[namespaced('species')].options.filter((o) =>
						lightweightModelGbifIds.includes(o.key)
					),
					infer: {
						neural: protocol.metadata[namespaced('species')].infer.neural.filter(
							(model) => model.name === 'Collemboles (~80 classes)'
						)
					}
				}
			}
		},
		null,
		2
	).replaceAll(
		'io.github.cigaleapp.arthropods.example__',
		'io.github.cigaleapp.arthropods.example.light__'
	)
);

console.info(
	'===============================================================\n' +
		`Generated cigale protocol ${protocol.id} v${protocol.version}\n` +
		'==============================================================='
);
