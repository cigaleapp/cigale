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

/**
 * @param {"detector" | "classifier"} task
 * @param {"collembola" | "arthropoda"} [scope]
 * @param {"model" | "classmapping"} [type]
 */
function modelUrl(task, scope, type) {
	const ending = {
		model: '.onnx',
		classmapping: '-classmapping.txt'
	}[type];

	return `https://huggingface.co/cigaleapp/built-in-protocols/resolve/main/${task}-${scope}${ending}?download=true`;
}

const MODELS = {
	detectors: {
		arthropoda: modelUrl('detector', 'arthropoda', 'model')
	},
	classifiers: {
		arthropoda: {
			model: modelUrl('classifier', 'arthropoda', 'model'),
			classmapping: modelUrl('classifier', 'arthropoda', 'classmapping')
		},
		collembola: {
			model: modelUrl('classifier', 'collembola', 'model'),
			classmapping: modelUrl('classifier', 'collembola', 'classmapping')
		}
	}
};

const lightweightModelGbifIds = await gbifIds(MODELS.classifiers.collembola.classmapping);

const allGbifIds = new Set([
	...(await gbifIds(MODELS.classifiers.arthropoda.classmapping)),
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
	mergeMethod: 'max',
	groupable: true
});

/**
 * @satisfies {typeof import('../src/lib/schemas/protocols.js').ExportedProtocol.inferIn}
 */
const protocol = {
	$schema: 'https://cigaleapp.github.io/cigale/protocol.schema.json',
	id: 'io.github.cigaleapp.arthropods.example',
	name: 'Example: arthropodes',
	learnMore: `https://github.com/cigaleapp/cigale/tree/${await x('git', ['rev-parse', 'HEAD']).then((result) => result.stdout.trim())}/scripts/README.md#protocoles-arthropodsexample`,
	version: (oldProtocol?.version ?? 0) + 1,
	updates: 'automatic',
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
		// Session-wide
		'prospection_duration',
		'prospection_distance',
		'homogenous_habitat',
		'strictness',
		'wind',
		'temperature',
		'cloud_coverage',
		'shadow',
		'camera_type',
		'has_flash',
		'session_date',
		// Observations
		'species',
		'genus',
		'family',
		'order',
		'habitat_photo',
		'shoot_date',
		'shoot_location',
		'identification_difficulty',
		'conservation_status',
		'class',
		'phylum',
		'kingdom',
		'crop',
	].map(namespaced),
	sessionMetadata: {
		[namespaced('prospection_duration')]: {
			// TODO duration datatype ?
			type: 'integer',
			label: 'Durée de prospection',
			description: 'Durée (en minutes) de la prospection sur le terrain',
			required: false,
			mergeMethod: 'average',
			range: '> 0'
		},
		[namespaced('prospection_distance')]: {
			type: 'integer',
			label: 'Distance de prospection',
			description: 'Distance (en mètres) parcourue pendant la prospection',
			required: false,
			mergeMethod: 'average',
			range: '> 0'
		},
		// TODO trajectory
		[namespaced('homogenous_habitat')]: {
			type: 'boolean',
			label: 'Habitat homogène',
			description:
				"J'ai choisi un habitat homogène pour réaliser mon relevé (laisser vide si inconnu)",
			required: false,
			mergeMethod: 'none'
		},
		[namespaced('strictness')]: {
			type: 'enum',
			label: 'Exhaustivité du relevé',
			description: "J'ai photographié",
			required: true,
			mergeMethod: 'min',
			options: [
				{ key: 'all', label: 'Tous les individus rencontrés' },
				{ key: 'inventory', label: 'Au moins un individu de chaque espèce rencontrée' },
				{ key: 'at_will', label: "Juste quelques individus quand j'en avais envie" }
			]
		},
		[namespaced('wind')]: {
			type: 'enum',
			label: 'Vent',
			description: 'Condition de vent pendant la prospection',
			required: false,
			mergeMethod: 'max',
			options: [
				{ key: 'none', label: 'Pas du tout' },
				{ key: 'light', label: 'Léger' },
				{ key: 'moderate', label: 'Modéré' },
				{ key: 'strong', label: 'Fort' }
			]
		},
		[namespaced('temperature')]: {
			type: 'integer',
			label: 'Température',
			description: 'Température approximative pendant la prospection (en °C)',
			required: false,
			mergeMethod: 'average',
			range: '>= -273.15'
		},
		[namespaced('cloud_coverage')]: {
			type: 'enum',
			label: 'Couverture nuageuse',
			description: 'Condition de couverture nuageuse pendant la prospection',
			required: false,
			mergeMethod: 'max',
			options: [
				{ key: 'clear', label: 'Dégagé' },
				{ key: '10_30_percent', label: '10-30%' },
				{ key: 'half', label: '50%' },
				{ key: 'more_than_half', label: 'Plus de 50%' },
				{ key: 'overcast', label: 'Tout couvert' }
			]
		},
		[namespaced('shadow')]: {
			type: 'integer',
			label: "Photos à l'ombre",
			description: "Part des photos prises à l'ombre (en pourcentage)",
			required: false,
			mergeMethod: 'average',
			range:  '0..100'
		},
		[namespaced('camera_type')]: {
			type: 'enum',
			label: 'Type d’appareil photo',
			description: "Type d'appareil photo utilisé pour prendre les photos",
			required: false,
			mergeMethod: 'none',
			options: [
				{ key: 'smartphone', label: 'Smartphone' },
				{ key: 'compact', label: 'Appareil photo compact' },
				{ key: 'dslr', label: 'Appareil photo reflex (DSLR)' },
				{ key: 'mirrorless', label: 'Appareil photo hybride' }
			]
		},
		[namespaced('has_flash')]: {
			type: 'boolean',
			label: 'Flash utilisé',
			description:
				"Le flash de l'appareil photo a-t-il été utilisé pour prendre des photos ?",
			required: false,
			mergeMethod: 'max'
		},
		[namespaced('session_date')]: {
			type: 'date',
			label: 'Date de la session',
			description:
				'Date à laquelle la session a été réalisée. On peut laisser vide si la date a été correctement réglée sur l’appareil photo',
			required: false,
			mergeMethod: 'average',
			range: 'past'
		}
	},
	metadata: {
		[namespaced('kingdom')]: cladeMetadata('kingdom', 'Règne'),
		[namespaced('phylum')]: cladeMetadata('phylum', 'Phylum'),
		[namespaced('class')]: cladeMetadata('class', 'Classe'),
		[namespaced('order')]: cladeMetadata('order', 'Ordre'),
		[namespaced('family')]: cladeMetadata('family', 'Famille'),
		[namespaced('genus')]: cladeMetadata('genus', 'Genre'),
		[namespaced('habitat_photo')]: {
			type: 'enum',
			label: "Photo d'habitat",
			description:
				"Indique si cette photo est une photo de l'habitat. Laisser vide si ce n'est pas une photo d'habitat",
			required: false,
			mergeMethod: 'none',
			groupable: true,
			options: [
				{ key: 'current', label: "C'est une photo de l'habitat actuel" },
				{ key: 'nearby', label: "C'est une photo de l'habitat à proximité" }
			]
		},
		[namespaced('identification_difficulty')]: {
			type: 'enum',
			label: "Difficulté d'identification",
			description: "Niveau de difficulté pour identifier l'espèce sur la photo",
			required: false,
			mergeMethod: 'average',
			groupable: true,
			sortable: true,
			options: [
				{
					key: 'easy',
					label: 'Facile',
					color: '#367517',
					icon: 'ri:emotion-laugh-line'
				},
				{
					key: 'medium',
					label: 'Moyenne',
					color: '#e8e819',
					icon: 'ri:emotion-happy-line'
				},
				{
					key: 'hard',
					label: 'Difficile',
					color: '#dd8808',
					icon: 'ri:emotion-normal-line'
				},
				{
					key: 'very_hard',
					label: 'Très difficile',
					color: '#cd3c28',
					icon: 'ri:emotion-unhappy-line'
				}
			]
		},
		[namespaced('conservation_status')]: {
			type: 'enum',
			label: 'Statut de conservation',
			description: "Statut de conservation IUCN de l'espèce",
			required: false,
			mergeMethod: 'average',
			groupable: true,
			sortable: true,
			options: [
				{
					key: 'ex',
					label: 'EX',
					description: 'Éteint (“Extinct”)',
					color: '#000000'
				},
				{
					key: 'ew',
					label: 'EW',
					description: 'Éteint à l’état sauvage (“Extinct in the Wild”)',
					color: '#3a3a3a'
				},
				{
					key: 'cr',
					label: 'CR',
					description: 'En danger critique d’extinction (“Critically Endangered”)',
					color: '#cd3030'
				},
				{
					key: 'en',
					label: 'EN',
					description: 'En danger (“Endangered”)',
					color: '#cd6630'
				},
				{
					key: 'vu',
					label: 'VU',
					description: 'Vulnérable (“Vulnerable”)',
					color: '#cd9a00'
				},
				{
					key: 'nt',
					label: 'NT',
					description: 'Quasi menacé (“Near Threatened”)',
					color: '#006666'
				},
				{
					key: 'lc',
					label: 'LC',
					description: 'Préoccupation mineure (“Least Concern”)',
					color: '#16ca85'
				}
			]
		},
		[namespaced('shoot_date')]: {
			type: 'date',
			label: 'Date',
			description: 'Moment où la photo a été prise',
			required: false,
			mergeMethod: 'average',
			sortable: true,
			groupable: true,
			infer: { exif: 'DateTimeOriginal' }
		},
		[namespaced('shoot_location')]: {
			type: 'location',
			label: 'Localisation',
			description: 'Endroit où la photo a été prise',
			required: false,
			mergeMethod: 'average',
			groupable: true,
			infer: { latitude: { exif: 'GPSLatitude' }, longitude: { exif: 'GPSLongitude' } }
		},
		[namespaced('crop')]: {
			type: 'boundingbox',
			label: '',
			description: '',
			required: true,
			mergeMethod: 'union',
			groupable: true,
			infer: {
				neural: [
					{
						model: MODELS.detectors.arthropoda,
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
			}
		},
		[namespaced('species')]: {
			type: 'enum',
			label: 'Espèce',
			description: '',
			required: true,
			groupable: true,
			mergeMethod: 'max',
			options: options.sort((a, b) => parseFloat(a.key) - parseFloat(b.key)),
			infer: {
				neural: [
					{
						name: 'Arthropodes (~17000 classes)',
						description: 'Terrestres, France métropolitaine', // TODO
						...MODELS.classifiers.arthropoda,
						input: {
							height: 224,
							width: 224,
							disposition: 'CHW',
							normalized: true
						}
					},
					{
						name: 'Collemboles (~80 classes)',
						...MODELS.classifiers.collembola,
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
