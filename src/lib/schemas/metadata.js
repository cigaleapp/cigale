import { ArkErrors, scope, type } from 'arktype';

import { parseISOSafe } from '../date.js';
import { EXIF_FIELDS } from '../exiffields.js';
import { keys, safeJSONStringify, unique } from '../utils.js';
import {
	ColorHex,
	FileSize,
	ID,
	Probability,
	TemplatedString,
	UniqueFileTypeSpecifier,
	URLString
} from './common.js';
import { NeuralBoundingBoxInference, NeuralEnumInference } from './neural.js';

/**
 * @param {string} metadataId
 * @param {RuntimeValue<"enum">} key
 */
export function metadataOptionId(metadataId, key) {
	return `${metadataId}:${key}`;
}

/**
 * @param {string} optionId
 */
export function parseMetadataOptionId(optionId) {
	const parts = optionId.split(':');
	if (parts.length < 2) throw new Error(`Invalid metadata option ID: ${optionId}`);
	const metadataId = parts.slice(0, -1).join(':');
	const key = parts[parts.length - 1];
	return { metadataId, key };
}

/**
 * @satisfies { Record<string, {label: string, help: string}> }
 */
export const METADATA_TYPES = /** @type {const} */ ({
	string: { label: 'texte', help: 'du texte' },
	boolean: { label: 'booléen', help: 'vrai ou faux' },
	integer: { label: 'entier', help: 'un entier' },
	float: { label: 'nombre', help: 'un nombre, potentiellement à virgule' },
	enum: { label: 'énumération', help: 'un ensemble de valeur fixes' },
	date: { label: 'date', help: 'une date' },
	location: {
		label: 'localisation',
		help: 'un objet avec deux nombres, `latitude` et `longitude`'
	},
	boundingbox: {
		label: "région d'image",
		help: 'un objet représentant une région rectangulaire au format YOLO'
	},
	file: {
		label: 'fichier',
		help: 'un fichier, représenté par une référence à un MetadataFile, qui est exporté séparément'
	}
});

export const MetadataType = type.or(
	type("'string'", '@', METADATA_TYPES.string.help),
	type("'boolean'", '@', METADATA_TYPES.boolean.help),
	type("'integer'", '@', METADATA_TYPES.integer.help),
	type("'float'", '@', METADATA_TYPES.float.help),
	type("'enum'", '@', METADATA_TYPES.enum.help),
	type("'date'", '@', METADATA_TYPES.date.help),
	type("'location'", '@', METADATA_TYPES.location.help),
	type("'boundingbox'", '@', METADATA_TYPES.boundingbox.help),
	type("'file'", '@', METADATA_TYPES.file.help)
);

/**
 * @typedef {typeof MetadataType.infer} MetadataType
 */

/**
 * @satisfies {{[ key in MetadataType ]: import('arktype').Type }}
 */
export const MetadataRuntimeValue = /** @type {const} */ ({
	string: type('string'),
	boolean: type('boolean'),
	integer: type('number'),
	float: type('number'),
	enum: type('string | number'),
	date: type('Date'),
	location: type({ latitude: 'number', longitude: 'number' }),
	boundingbox: type({ x: 'number', y: 'number', w: 'number', h: 'number' }),
	file: type(ID)
});

export const MetadataRuntimeValueAny = type.or(
	MetadataRuntimeValue.string,
	MetadataRuntimeValue.boolean,
	MetadataRuntimeValue.integer,
	MetadataRuntimeValue.float,
	MetadataRuntimeValue.enum,
	MetadataRuntimeValue.date,
	MetadataRuntimeValue.location,
	MetadataRuntimeValue.boundingbox
);

export const MetadataError = type({
	message: 'string',
	details: 'unknown',
	stack: 'string = ""',
	/** Ignored by the user */
	ignored: 'boolean = false',
	happenedAt: ['string.date.iso', '=', () => new Date().toISOString()],
	kind: type.or(
		type(
			'"inference"',
			'@',
			"Erreur survenue lors de l'inférence de la valeur de cette métadonnée"
		)
	)
});

export const MetadataErrors = scope({ ID }).type({
	'[ID]': MetadataError.array()
});

/**
 * @template {MetadataType} [Type=MetadataType]
 * @typedef  RuntimeValue
 * @type { typeof MetadataRuntimeValue[Type]['infer'] }
 */

export const MetadataValue = type({
	value: type('string.json').pipe((jsonstring) => {
		/** @type {RuntimeValue<typeof MetadataType.infer>}  */
		let out = JSON.parse(jsonstring);
		if (typeof out === 'string') out = parseISOSafe(out) ?? out;
		return out;
	}, MetadataRuntimeValueAny),
	confidence: Probability.default(1),
	confirmed: type('boolean')
		.describe('Si la valeur a été manuellement confirmée comme correcte')
		.default(false),
	manuallyModified: type('boolean')
		.describe('Si la valeur a été modifiée manuellement')
		.default(false),
	isDefault: type('boolean')
		.describe('Si la valeur est la valeur par défaut définie dans le protocole')
		.default(false),
	alternatives: {
		'[string.json]': Probability
	}
});

export const MetadataValues = scope({ ID }).type({
	'[ID]': MetadataValue
});

export const MetadataRecord = type({
	'[string]': {
		value: [
			type.or(
				'null',
				MetadataRuntimeValue.boolean,
				MetadataRuntimeValue.integer,
				MetadataRuntimeValue.float,
				MetadataRuntimeValue.string,
				// MetadataRuntimeValue.date
				// Date is not compatible with JSON Schemas, use a datestring instead
				'string.date.iso',
				MetadataRuntimeValue.location,
				MetadataRuntimeValue.boundingbox,
				MetadataRuntimeValue.file
			),
			'@',
			'Valeur de la métadonnée'
		],
		'valueLabel?': [
			'string',
			'@',
			"Label de la valeur de la métadonnée. Existe pour les métadonnées de type enum, contient dans ce cas le label associé à la clé de l'option de l'enum choisie"
		],
		confidence: ['number', '@', 'Confiance dans la valeur de la métadonnée, entre 0 et 1'],
		manuallyModified: [
			'boolean',
			'@',
			'La valeur de la métadonnée a été modifiée manuellement'
		],
		confirmed: type('boolean')
			.describe('La valeur de la métadonnée a été confirmée par un·e utilisateurice')
			.default(false),
		alternatives: type({
			'[string]': [
				'number',
				'@',
				'Confiance dans cette valeur alternative de la métadonnée, entre 0 et 1.'
			]
		}).describe(
			"Autres valeurs possibles. Les clés de l'objet sont les autres valeurs possibles pour cette métadonnée (converties en texte via JSON), les valeurs de l'objet sont les confiances associées à ces alternatives."
		)
	}
});

/**
 * @satisfies { Record<string, { label: string; help: string }> }
 */
export const METADATA_MERGE_METHODS = /** @type {const} */ ({
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
	union: {
		label: 'Union',
		help: 'Spécifique aux boîtes de recadrage: fusionne les boîtes de recadrage en la plus petite boîte englobant toutes les boîtes'
	},
	none: {
		label: 'Aucune',
		help: 'Ne pas fusionner'
	}
});

export const MetadataMergeMethod = type.or(
	type('"min"', '@', METADATA_MERGE_METHODS.min.help),
	type('"max"', '@', METADATA_MERGE_METHODS.max.help),
	type('"average"', '@', METADATA_MERGE_METHODS.average.help),
	type('"median"', '@', METADATA_MERGE_METHODS.median.help),
	type('"none"', '@', METADATA_MERGE_METHODS.none.help),
	type('"union"', '@', METADATA_MERGE_METHODS.union.help)
);

export const MetadataEnumVariant = type({
	key: [ID, '@', 'Identifiant unique pour cette option'],
	label: ['string', '@', "Nom de l'option, affichable dans une interface utilisateur"],
	synonyms: type('string[]')
		.describe('Synonymes (labels alternatifs) pour cette option')
		.default(() => []),
	'description?': type('string').describe('Description (optionnelle) de cette option'),
	'index?': type('number').describe(
		"Nombre permettant de trier les options dans l'interface. Par défaut, correspond à l'indice de l'option dans l'ordre de définition de sa métadonnée"
	),
	'image?': URLString.configure({
		deprecated: true,
		description:
			"Image illustrant cette option de l'énumération. Utiliser plutôt `images` avec un seul élément."
	}),
	'images?': URLString.array().describe(
		"Liste d'images illustrant cette option de l'énumération. Permet d'en spécifier plusieurs"
	),
	'learnMore?': URLString.describe(
		"Lien pour en savoir plus sur cette option de l'énumération en particulier"
	),
	'color?': ColorHex.describe(
		"Code hexadécimal (avec ou sans le # préfixe) d'une couleur associée à cette option, pour l'affichage dans l'interface"
	),
	'icon?': type(/^ri:[\w-]+$/).describe(
		"Code Iconify d'une icône associée à cette option, provenant du pack d'icônes “Remix Icon”. Voir https://icon-sets.iconify.design/ri/ pour la liste."
	),
	'cascade?': scope({ ID })
		.type({ '[ID]': 'ID' })
		.describe(
			'Objet contenant pour clés des identifiants d\'autres métadonnées, et pour valeurs la valeur à assigner à cette métadonnée si cette option est choisie. Le processus est récursif: Imaginons une métadonnée species ayant une option avec `{ key: "1", cascade: { genus: "2" } }`, une métadonnée genus ayant une option `{ key: "2", cascade: { family: "3" } }`. Si l\'option "1" de la métadonnée species est choisie, la métadonnée genus sera définie sur l\'option "2" et la métadonnée family sera à son tour définie sur l\'option "3".'
		)
});

export const EXIFField = type.enumerated(...keys(EXIF_FIELDS));

export const EXIFInference = EXIFField.describe('Inférer depuis un champ EXIF', 'self');

export const MetadataDefaultDynamicPayload = type({
	protocolMetadata: MetadataRecord,
	metadata: MetadataRecord,
	session: {
		protocolMetadata: MetadataRecord,
		metadata: MetadataRecord,
		createdAt: 'string.date.iso'
	}
});

export const MetadataDefault = scope({ MetadataRuntimeValueAny }).type(
	'<static extends MetadataRuntimeValueAny>',
	[
		[
			'Exclude<static, string>',
			'@',
			"Une valeur par défaut pour une métadonnée. Pour l'instant, uniquement supportée sur les métadonnées de session"
		],
		'|',
		TemplatedString(MetadataDefaultDynamicPayload, (serialized) => {
			const parsed = MetadataValue.get('value')(serialized);

			if (parsed instanceof ArkErrors) {
				return serialized.trim();
			}

			return parsed;
		}).describe(
			"Une valeur par défaut dynamique. Pour l'instant, uniquement supportée sur les métadonnées de session. C'est une templates Handlebars, avec pour variables `protocolMetadata` (contenant les métadonnées du protocole courant) et `metadata` (contenant les métadonnées de _toutes_ les métadonnées). La valeur par défaut sera évaluée en considérant que le texte final (après éxécution de la template Handlebars) est une représentation JSON (sauf pour les métadonnées de type texte ou enum, où le text final est pris tel-quel). Les helpers gps, boundingBox, date, object et array sont disponibles pour facilement construire des représentations JSON de valeurs complexes"
		)
	]
);
/**
 * @typedef {typeof EXIFInference.infer} EXIFInference
 */

const MetadataBase = type({
	id: ID.describe(
		'Identifiant unique pour la métadonnée. On conseille de mettre une partie qui vous identifie dans cet identifiant, car il doit être globalement unique. Par exemple, mon-organisation.ma-métadonnée'
	),
	label: ['string', '@', 'Nom de la métadonnée'],
	// TODO: move to type-specific branches (e.g. for boundingbox, it's union | none, for others there isnt union, ...)
	// Get the allowed per-type methods from mergeBy<method> functions' declarations (add a satisfies to the implementations' type switches and export a const for each method)
	mergeMethod: MetadataMergeMethod.configure(
		"Méthode utiliser pour fusionner plusieurs différentes valeurs d'une métadonnée. Notamment utilisé pour calculer la valeur d'une métadonnée sur une Observation à partir de ses images",
		'self'
	),
	required: ['boolean', '@', 'Si la métadonnée est obligatoire'],
	description: ['string', '@', 'Description, pour aider à comprendre la métadonnée'],
	sortable: type('boolean')
		.describe('Si la métadonnée peut être utilisée pour trier des images ou observations')
		.default(false),
	groupable: type('boolean')
		.describe('Si la métadonnée peut être utilisée pour grouper des images ou observations')
		.default(false),
	// TODO move to the type: '"enum"' only branch
	'options?': MetadataEnumVariant.array()
		.pipe((opts) => unique(opts, (o) => o.key))
		.pipe((opts) => opts.map((opt, index) => ({ index, ...opt })))
		.describe('Les options valides. Uniquement utile pour une métadonnée de type "enum"'),
	learnMore: URLString.describe(
		'Un lien pour en apprendre plus sur ce que cette métadonnée décrit'
	).optional()
});

const MetadataBoolean = MetadataBase.and({
	type: '"boolean"',
	'default?': MetadataDefault('boolean'),
	'infer?': type.or({ exif: EXIFInference })
});

const MetadataString = MetadataBase.and({
	type: '"string"',
	'default?': MetadataDefault('string'),
	'infer?': type.or({ exif: EXIFInference })
});

const MetadataInteger = MetadataBase.and({
	type: '"integer"',
	'default?': MetadataDefault('number.integer'),
	'infer?': type.or({ exif: EXIFInference })
});

const MetadataFloat = MetadataBase.and({
	type: '"float"',
	'default?': MetadataDefault('number'),
	'infer?': type.or({ exif: EXIFInference })
});

const MetadataDate = MetadataBase.and({
	type: '"date"',
	'default?': MetadataDefault('string.date.iso'),
	'infer?': type.or({ exif: EXIFInference })
});

const MetadataLocation = MetadataBase.and({
	type: '"location"',
	'default?': MetadataDefault({ latitude: 'number', longitude: 'number' }),
	'infer?': type({
		latitude: type.or({ exif: EXIFInference }),
		longitude: type.or({ exif: EXIFInference })
	})
});

const MetadataEnum = MetadataBase.and({
	type: '"enum"',
	'default?': MetadataDefault('string | number'),
	'infer?': type.or({ exif: EXIFInference }, { neural: NeuralEnumInference.array() })
});

const MetadataBoundingbox = MetadataBase.and({
	type: '"boundingbox"',
	'default?': MetadataDefault({
		x: '0 <= number <= 1',
		y: '0 <= number <= 1',
		w: '0 <= number <= 1',
		h: '0 <= number <= 1'
	}),
	'infer?': type.or({
		neural: NeuralBoundingBoxInference.array()
	})
});

export const MetadataFile = MetadataBase.and({
	type: '"file"',
	'default?': 'null',
	'infer?': 'null',
	size: type({ 'minimum?': FileSize, 'maximum?': FileSize })
		.describe('Limites sur la taille du fichier')
		.default(() => ({})),
	accept: UniqueFileTypeSpecifier.array()
		.pipe((specs) => specs.join(', '))
		.describe('Fichiers acceptés pour cette métadonnée')
		.default(() => [])
});

export const Metadata = type.or(
	MetadataBoolean,
	MetadataString,
	MetadataInteger,
	MetadataFloat,
	MetadataDate,
	MetadataLocation,
	MetadataEnum,
	MetadataBoundingbox,
	MetadataFile
);

/**
 * Ensures a metadata ID is namespaced to the given protocol ID
 * If the ID is already namespaced, the existing namespace is re-namespaced to the given protocol ID.
 * @template {string} ProtocolID
 * @param {ProtocolID} protocolId
 * @param {string} metadataId
 * @returns {`${ProtocolID}__${string}`}
 */
export function namespacedMetadataId(protocolId, metadataId) {
	metadataId = metadataId.replace(/^.+__/, '');
	return `${protocolId}__${metadataId}`;
}

/**
 * Ensures a metadata ID is namespaced to the given protocol ID. If the metadata ID is not namespaced, it will be prefixed with the protocol ID. If it already is namespaced, it will stay as is.
 * @param {string} metadataId the metadata ID to ensure is namespaced
 * @param {string} fallbackProtocolId the protocol ID to use if the metadata ID is not namespaced
 */
export function ensureNamespacedMetadataId(metadataId, fallbackProtocolId) {
	if (isNamespacedToProtocol(fallbackProtocolId, metadataId)) return metadataId;
	return namespacedMetadataId(fallbackProtocolId, metadataId);
}

/**
 * Checks if a given metadata ID is namespaced to a given protocol ID
 * @template {string} ProtocolID
 * @param {ProtocolID} protocolId
 * @param {string} metadataId
 * @returns {metadataId is `${ProtocolID}__${string}` }
 */
export function isNamespacedToProtocol(protocolId, metadataId) {
	return metadataId.startsWith(`${protocolId}__`);
}

/**
 *
 * @param {string} metadataId
 * @returns {string}
 */
export function removeNamespaceFromMetadataId(metadataId) {
	return metadataId.replace(/^.+__/, '');
}

/**
 *
 * @param {string} metadataId
 * @returns
 */
export function namespaceOfMetadataId(metadataId) {
	const parts = metadataId.split('__');
	if (parts.length < 2) return undefined;
	return parts.slice(0, -1).join('__');
}

/**
 *
 * @param {string} metadataId
 */
export function splitMetadataId(metadataId) {
	return {
		namespace: namespaceOfMetadataId(metadataId),
		id: removeNamespaceFromMetadataId(metadataId)
	};
}
