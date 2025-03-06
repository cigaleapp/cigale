import { type } from 'arktype';

// TODO make table() take an object that can be passed to type() instead of a schema
//  * @template { {[x: string]: import('arktype').Type | string} } Schema

const ID = type(/[\w_]+/).pipe((id) => id.toLowerCase());

/**
 * Between 0 and 1
 */
const Probability = type('0 <= number <= 1');

/**
 * Can't use string.url.parse because it prevents us from generating JSON schemas
 */
const URLString = type('/https?:\\/\\/.+/');

const MetadataValue = type({
	value: type('string.json.parse').pipe(
		(primitive) =>
			/** @type {import('./metadata').RuntimeValue<typeof MetadataType.infer>}  */ (primitive)
	),
	confidence: Probability.default(1),
	alternatives: {
		'[string.json]': Probability
	}
});

const MetadataValues = type({
	// TODO: figure out a way to reuse the ID const
	'[/[a-z0-9_]+/]': MetadataValue
});

const ImageFile = table(
	['id'],
	type({
		/** ID of the associated Image object */
		id: ID,
		bytes: 'ArrayBuffer'
	})
);

const Image = table(
	['id', 'addedAt'],
	type({
		id: /\d+(_\d+)*/,
		filename: 'string',
		addedAt: 'string.date.iso.parse',
		metadata: MetadataValues,
		contentType: /\w+\/\w+/,
		bufferExists: 'boolean'
	})
);

const Observation = table(
	['id', 'addedAt'],
	type({
		id: ID,
		label: 'string',
		addedAt: 'string.date.iso.parse',
		metadataOverrides: MetadataValues,
		images: ID.array()
	})
);

const MetadataType = type.enumerated(
	'string',
	'boolean',
	'integer',
	'float',
	'enum',
	'date',
	'location',
	'boundingbox'
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
	location: 'localisation',
	boundingbox: 'boîte de recadrage'
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
	learnMore: URLString.optional()
});

const Metadata = table(
	'id',
	type({
		id: ID,
		label: 'string',
		type: MetadataType,
		mergeMethod: MetadataMergeMethod,
		options: MetadataEnumVariant.array().atLeastLength(1).optional(),
		required: 'boolean',
		description: 'string',
		learnMore: URLString.optional()
	})
);

const ProtocolWithoutMetadata = type({
	id: ID,
	name: 'string',
	source: URLString,
	authors: type({
		email: 'string.email',
		name: 'string'
	}).array()
});

const Protocol = table(
	'id',
	ProtocolWithoutMetadata.and({
		metadata: ID.array()
	})
);

const Settings = table(
	'id',
	type({
		id: '"defaults" | "user"',
		protocols: ID.array(),
		theme: type.enumerated('dark', 'light', 'auto'),
		gridSize: 'number',
		language: type.enumerated('fr'),
		showInputHints: 'boolean'
	})
);

/**
 * @type {Array<typeof Metadata.inferIn>}
 */
export const BUILTIN_METADATA = [
	{
		id: 'crop',
		description: "Boîte de recadrage pour l'image",
		label: 'Recadrage',
		type: 'boundingbox',
		mergeMethod: 'none',
		required: false
	},
	{
		id: 'sex',
		description: "Sexe de l'individu",
		label: 'Sexe',
		learnMore: 'https://fr.wikipedia.org/wiki/Sexe',
		type: 'enum',
		mergeMethod: 'none',
		required: false,
		options: [
			{
				key: 'm',
				label: 'Male',
				learnMore: 'https://fr.wikipedia.org/wiki/M%C3%A2le',
				description: ''
			},
			{
				key: 'f',
				label: 'Femelle',
				learnMore: 'https://fr.wikipedia.org/wiki/Femelle',
				description: ''
			}
		]
	},
	{
		id: 'shoot_date',
		description: '',
		label: 'Date de prise de vue',
		type: 'date',
		mergeMethod: 'average',
		required: true
	},
	{
		id: 'shoot_location',
		description: 'Localisation de la prise de vue',
		label: 'Lieu',
		type: 'location',
		mergeMethod: 'average',
		required: false
	}
];

export const Schemas = {
	ID,
	Probability,
	MetadataValues,
	MetadataValue,
	Image,
	Observation,
	MetadataType,
	MetadataMergeMethod,
	MetadataEnumVariant,
	Metadata,
	Protocol,
	ProtocolWithoutMetadata,
	Settings
};

export const NO_REACTIVE_STATE_TABLES = /** @type {const} */ (['ImageFile']);

export const Tables = {
	Image,
	ImageFile,
	Observation,
	Metadata,
	Protocol,
	Settings
};

/**
 *
 * @param {string|string[]} keyPaths expanded to an array.
 * Every element is an index to be created.
 * Indexes are dot-joined paths to keys in the objects.
 * First index is given as the keyPath argument when creating the object store instead.
 * @param {Schema} schema
 * @template {import('arktype').Type} Schema
 * @returns
 */
function table(keyPaths, schema) {
	const expandedKeyPaths = Array.isArray(keyPaths)
		? keyPaths.map((keyPath) => keyPath)
		: [keyPaths];

	return schema.configure({ table: { indexes: expandedKeyPaths } });
}

/**
 * @typedef  ID
 * @type {typeof ID.infer}
 */

/**
 * @typedef  Probability
 * @type {typeof Probability.infer}
 */

/**
 * @typedef  MetadataValue
 * @type {typeof MetadataValue.infer}
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
