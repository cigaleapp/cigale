/**
 * @typedef ID
 * @type {string}
 */

/**
 * @typedef Probability
 * @type {number} between 0 and 1
 */

/**
 * @typedef Image
 * @type {object}
 * @property {ID} id
 * @property {string} filename
 * @property {MetadataValues} metadata
 */

/**
 * @typedef Observation
 * @type {object}
 * @property {ID} id
 * @property {string} label
 * @property {MetadataValues} metadataOverrides
 * @property {Image[]} images
 */

/**
 * @typedef MetadataType
 * @type { "string" | "boolean" | "integer" | "float" | "enum" | "date" | "location" }
 */

/**
 * @type { Record<MetadataType, string> }
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

/**
 * @typedef MetadataMergeMethod
 * @type { "min" | "max" | "average" | "median" | "none" }
 */

/**
 * @type { Record<MetadataMergeMethod, { label: string; help: string }> }
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

/**
 * @typedef MetadataEnumVariant
 * @type {object}
 * @property {string} key
 * @property {string} label
 * @property {string} description
 * @property {?URL} learnMore
 */

/**
 * @typedef Metadata
 * @type {object}
 * @property {ID} id
 * @property {string} label
 * @property {MetadataType} type
 * @property {MetadataMergeMethod} mergeMethod
 * @property {MetadataEnumVariant[]} [options=[]]
 * @property {boolean} required
 * @property {string} description
 * @property {?URL} learnMore
 */

/**
 * @typedef Protocol
 * @type {object}
 * @property {ID} id
 * @property {string} name
 * @property {?URL} source
 * @property {?{ email: string; name: string }} author
 * @property {Metadata[]} metadata
 */

/**
 * @typedef Settings
 * @type {object}
 * @property {Protocol[]} protocols
 * @property {"dark"|"light"|"auto"} theme
 * @property {number} gridSize
 * @property {"fr"} language
 */

/**
 * @typedef MetadataValues
 * @type {{[metadata: ID]: { value: string; confidence: Probability; alternatives: Record<string, Probability> }}}
 */

/**
 * @type {Metadata[]}
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
