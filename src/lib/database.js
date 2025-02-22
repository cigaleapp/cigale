import { type } from 'arktype';

const ID = type(/[\w_]+/).pipe((id) => id.toLowerCase());

/**
 * Between 0 and 1
 */
const Probability = type('0 <= number <= 1');

const MetadataValues = type({
	// TODO: figure out a way to reuse the ID const
	'[/[a-z0-9_]+/]': {
		value: 'string',
		confidence: Probability,
		alternatives: {
			'[string]': Probability
		}
	}
});

const Image = type({
	id: ID,
	filename: 'string',
	metadata: MetadataValues
});

const Observation = type({
	id: ID,
	label: 'string',
	metadataOverrides: MetadataValues,
	images: Image.array()
});

const MetadataType = type.enumerated(
	'string',
	'boolean',
	'integer',
	'float',
	'enum',
	'date',
	'location'
);

/**
 * @type { Record<typeof MetadataType.infer, string> }
 */
export const METADATA_TYPES = {
	string: 'texte',
	boolean: 'booléen',
	integer: 'entier',
	float: 'nombre',
	enum: 'énumération',
	date: 'date',
	location: 'localisation'
};

const MetadataMergeMethod = type.enumerated('min', 'max', 'average', 'median', 'none');

/**
 * @type { Record<typeof MetadataMergeMethod.infer, { label: string; help: string }> }
 */
export const METADATA_MERGE_METHODS = {
	min: {
		label: 'Minimum',
		help: 'Prend la valeur minimale'
	},
	max: {
		label: 'Maximum',
		help: 'Prend la valeur maximale'
	},
	average: {
		label: 'Moyenne',
		help: 'Prend la moyenne des valeurs'
	},
	median: {
		label: 'Médiane',
		help: 'Prend la médiane des valeurs'
	},
	none: {
		label: 'Aucune',
		help: 'Ne pas fusionner'
	}
};

const MetadataEnumVariant = type({
	key: ID,
	label: 'string',
	description: 'string',
	learnMore: 'string.url.parse | null'
});
const Metadata = type({
	id: ID,
	label: 'string',
	type: MetadataType,
	mergeMethod: MetadataMergeMethod,
	options: MetadataEnumVariant.array().atLeastLength(1).optional(),
	required: 'boolean',
	description: 'string',
	learnMore: 'string.url.parse | null'
});

const Protocol = type({
	id: ID,
	name: 'string',
	source: 'string.url.parse | null',
	metadata: Metadata.array(),
	author: {
		email: 'string',
		name: 'string'
	}
});

const Settings = type({
	protocols: Protocol.array(),
	theme: type.enumerated('dark', 'light', 'auto'),
	gridSize: 'number',
	language: type.enumerated('fr')
});

/**
 * @type {Array<typeof Metadata.infer>}
 */
export const BUILTIN_METADATA = [
	{
		id: 'sex',
		description: "Sexe de l'individu",
		label: 'Sexe',
		learnMore: new URL('https://fr.wikipedia.org/wiki/Sexe'),
		type: 'enum',
		mergeMethod: 'none',
		required: false,
		options: [
			{
				key: 'm',
				label: 'Male',
				learnMore: new URL('https://fr.wikipedia.org/wiki/M%C3%A2le'),
				description: ''
			},
			{
				key: 'f',
				label: 'Femelle',
				learnMore: new URL('https://fr.wikipedia.org/wiki/Femelle'),
				description: ''
			}
		]
	},
	{
		id: 'shoot_date',
		description: '',
		label: 'Date de prise de vue',
		learnMore: null,
		type: 'date',
		mergeMethod: 'average',
		required: true
	}
];

export const Schemas = {
	ID,
	Probability,
	MetadataValues,
	Image,
	Observation,
	MetadataType,
	MetadataMergeMethod,
	MetadataEnumVariant,
	Metadata,
	Protocol,
	Settings
};

/**
 * @typedef  ID
 * @type {typeof ID.infer}
 */

/**
 * @typedef  Probability
 * @type {typeof Probability.infer}
 */

/**
 * @typedef  MetadataValues
 * @type {typeof MetadataValues.infer}
 */

/**
 * @typedef  Image
 * @type {typeof Image.infer}
 */

/**
 * @typedef  Observation
 * @type {typeof Observation.infer}
 */

/**
 * @typedef  MetadataType
 * @type {typeof MetadataType.infer}
 */

/**
 * @typedef  MetadataMergeMethod
 * @type {typeof MetadataMergeMethod.infer}
 */

/**
 * @typedef  MetadataEnumVariant
 * @type {typeof MetadataEnumVariant.infer}
 */

/**
 * @typedef  Metadata
 * @type {typeof Metadata.infer}
 */

/**
 * @typedef  Protocol
 * @type {typeof Protocol.infer}
 */

/**
 * @typedef  Settings
 * @type {typeof Settings.infer}
 */
