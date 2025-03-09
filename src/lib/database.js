import { type } from 'arktype';
import { parseISOSafe } from './date.js';

const ID = type(/[\w_]+/);

/**
 * Between 0 and 1
 */
const Probability = type('0 <= number <= 1');

/**
 * Can't use string.url.parse because it prevents us from generating JSON schemas
 */
const URLString = type('/https?:\\/\\/.+/');

const MetadataValue = type({
	value: type('string.json').pipe((jsonstring) => {
		/** @type {import('./metadata').RuntimeValue<typeof MetadataType.infer>}  */
		let out = JSON.parse(jsonstring);
		if (typeof out === 'string') out = parseISOSafe(out) ?? out;
		return out;
	}),
	confidence: Probability.default(1),
	alternatives: {
		'[string.json]': Probability
	}
});

const MetadataValues = type({
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

const MetadataType = type("'string'", '@', 'du texte')
	.or(type("'boolean'", '@', 'un booléen (vrai ou faux)'))
	.or(type("'integer'", '@', 'un entier'))
	.or(type("'float'", '@', 'un nombre, potentiellement à virgule'))
	.or(
		type(
			"'enum'",
			'@',
			"un ensemble de valeur fixes. Utiliser 'options' sur la définition d'une métadonnée pour préciser les valeurs possibles"
		)
	)
	.or(type("'date'", '@', 'une date'))
	.or(type("'location'", '@', 'un objet avec deux nombres, `latitude` et `longitude`'))
	.or(
		type(
			"'boundingbox'",
			'@',
			"un objet représentant une région rectangulaire, définie par son point supérieur gauche avec `x` et `y`, et sa largeur et hauteur avec `width` et `height'"
		)
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

const MetadataMergeMethod = type(
	'"min"',
	'@',
	"Choisir la valeur avec la meilleure confiance, et prendre la plus petite valeur en cas d'ambuiguité"
)
	.or(
		type(
			'"max"',
			'@',
			"Choisir la valeur avec la meilleure confiance, et prendre la plus grande valeur en cas d'ambuiguité"
		)
	)
	.or(type('"average"', '@', 'Prendre la moyenne des valeurs'))
	.or(type('"median"', '@', 'Prendre la médiane des valeurs'))
	.or(type('"none"', '@', 'Ne pas fusionner'));

/**
 * @type { Record<typeof MetadataMergeMethod.infer, { label: string; help: string }> }
 */
export const METADATA_MERGE_METHODS = {
	min: {
		label: 'Minimum',
		help: "Choisir la valeur avec la meilleure confiance, et prendre la plus petite valeur en cas d'ambuiguité"
	},
	max: {
		label: 'Maximum',
		help: "Choisir la valeur avec la meilleure confiance, et prendre la plus grande valeur en cas d'ambuiguité"
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
	key: [ID, '@', 'Identifiant unique pour cette option'],
	label: ['string', '@', "Nom de l'option, affichable dans une interface utilisateur"],
	description: ['string', '@', 'Description (optionnelle) de cette option'],
	learnMore: URLString.describe(
		"Lien pour en savoir plus sur cette option de l'énumération en particulier"
	).optional()
});

// TODO https://github.com/arktypeio/arktype/discussions/1360
const _mergeMethodDescription =
	"Méthode utiliser pour fusionner plusieurs différentes valeurs d'une métadonnée. Notamment utilisé pour calculer la valeur d'une métadonnée sur une Observation à partir de ses images";

const MetadataWithoutID = type({
	label: ['string', '@', 'Nom de la métadonnée'],
	type: MetadataType,
	mergeMethod: MetadataMergeMethod,
	options: MetadataEnumVariant.array()
		.atLeastLength(1)
		.describe('Les options valides. Uniquement utile pour une métadonnée de type "enum"')
		.optional(),
	required: ['boolean', '@', 'Si la métadonnée est obligatoire'],
	description: ['string', '@', 'Description, pour aider à comprendre la métadonnée'],
	learnMore: URLString.describe(
		'Un lien pour en apprendre plus sur ce que cette métadonnée décrit'
	).optional()
});

const Metadata = table('id', MetadataWithoutID.and({ id: ID }));

const ProtocolWithoutMetadata = type({
	id: ID.describe(
		'Identifiant unique pour le protocole. On conseille de mettre une partie qui vous identifie dans cet identifiant, car il doit être globalement unique. Par exemple, mon-organisation.mon-protocole'
	),
	name: ['string', '@', 'Nom du protocole'],
	source: URLString.describe(
		"Lien vers un site où l'on peut se renseigner sur ce protocole. Cela peut aussi être simplement un lien de téléchargement direct de ce fichier"
	),
	authors: type({
		email: ['string.email', '@', 'Adresse email'],
		name: ['string', '@', 'Prénom Nom']
	})
		.array()
		.describe("Les auteurices ayant participé à l'élaboration du protocole")
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
		showInputHints: 'boolean',
		showTechnicalMetadata: 'boolean'
	})
);

export const BUILTIN_METADATA_IDS = {
	crop: 'crop',
	shoot_date: 'shoot_date',
	shoot_location: 'shoot_location',
	cuteness: 'cuteness',
	species: 'species'
};

/**
 * @type {Array<typeof Metadata.inferIn & { id: keyof typeof BUILTIN_METADATA_IDS }>}
 */
export const BUILTIN_METADATA = [
	{
		id: 'cuteness',
		description: "À quel point l'arthropode est trop cute 😖",
		label: '🥺',
		type: 'float',
		mergeMethod: 'average',
		required: false
	},
	{
		id: 'crop',
		description: "Boîte de recadrage pour l'image",
		label: 'Recadrage',
		type: 'boundingbox',
		mergeMethod: 'none',
		required: false
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
	MetadataWithoutID,
	Metadata,
	Protocol,
	ProtocolWithoutMetadata,
	Settings
};

export const NO_REACTIVE_STATE_TABLES = /** @type {const} */ (['ImageFile']);

/**
 *
 * @template {keyof typeof Tables} TableName
 * @param {TableName} name
 * @returns {name is Exclude<TableName, typeof NO_REACTIVE_STATE_TABLES[number]>}
 */
export function isReactiveTable(name) {
	return NO_REACTIVE_STATE_TABLES.every((n) => n !== name);
}

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
