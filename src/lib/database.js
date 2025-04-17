import { scope, type } from 'arktype';
import Handlebars from 'handlebars';
import { parseISOSafe } from './date.js';
import { splitFilenameOnExtension } from './download.js';
import { EXIF_FIELDS } from './exiffields.js';
import { Clade } from './taxonomy.js';
import { keys } from './utils.js';

const ID = type(/[\w_]+/);

const References = ID.array().pipe((ids) => [...new Set(ids)]);

/**
 * Add a suffix to a filename, before the extension
 */
Handlebars.registerHelper('suffix', (subject, suffix) => {
	type('string').assert(subject);
	type('string').assert(suffix);

	const [stem, ext] = splitFilenameOnExtension(subject);
	return `${stem}${suffix}.${ext}`;
});

/**
 * Get the extension part from a filename
 */
Handlebars.registerHelper('extension', (subject) => {
	type('string').assert(subject);

	return splitFilenameOnExtension(subject)[1];
});

/**
 * Provide a default, akin to a ?? b
 */
Handlebars.registerHelper('fallback', (subject, fallback) => {
	return subject ?? fallback;
});

const FilepathTemplate = type.string
	.pipe((t) => {
		try {
			return {
				source: t,
				template: Handlebars.compile(t, {
					noEscape: true,
					assumeObjects: true,
					knownHelpersOnly: true,
					knownHelpers: {
						suffix: true,
						extension: true,
						fallback: true
					}
				})
			};
		} catch (e) {
			throw new Error(`Invalid template "${t}": ${e.message}`);
		}
	})
	.pipe(({ source, template }) => ({
		/** @param {{ image: typeof Image.infer & { metadata: Record<string, typeof MetadataValue.infer & { valueLabel?: string }> }, observation: typeof Observation.infer, sequence: number }} data */
		render(data) {
			console.log('Applying template', source, 'on', data);
			return template(data, {}).replaceAll('\\', '/');
		},
		toJSON: () => source
	}));

/**
 * Between 0 and 1
 */
const Probability = type('0 <= number <= 1');

/**
 * Can't use string.url.parse because it prevents us from generating JSON schemas
 */
const URLString = type(/https?:\/\/.+/);

const Request = URLString.configure(
	"L'URL à laquelle se situe le fichier. Effectue une requête GET sans en-têtes particuliers.",
	'self'
)
	.or({
		url: URLString.describe("L'URL de la requête"),
		'headers?': type({ '[string]': 'string' }).describe('Les en-têtes à ajouter dans la requête'),
		'method?': type
			.enumerated('GET', 'POST', 'PUT', 'DELETE')
			.describe('La méthode de la requête (GET par défaut)')
	})
	.configure(
		'Le requête HTTP pour obtenir le fichier, avec des en-têtes et une méthode personnalisable',
		'self'
	);

const ModelInput = type({
	width: ['number < 1024', '@', "Largeur en pixels du tenseur d'entrée du modèle"],
	height: ['number < 1024', '@', "Hauteur en pixels du tenseur d'entrée du modèle"],
	'disposition?': type(['"CHW"', '@', 'Tenseurs de la forme [3, H, W]']).or(
		type(['"1CHW"', '@', 'Tenseurs de la forme [1, 3, H, W]'])
	),
	normalized: [
		'boolean',
		'@',
		'Si les valeurs des pixels doivent être normalisées entre 0 et 1. Sinon, elles sont entre 0 et 255'
	],
	'name?': [
		'string',
		'@',
		"Nom de l'input du modèle à utiliser. Par défaut, prend la première input"
	]
});

const ModelDetectionOutputShape = type(['"cx"', '@', 'Coordonée X du point central'])
	.or(type(['"cy"', '@', 'Coordonée Y du point central']))
	.or(type(['"sy"', '@', 'Coordonée Y du point supérieur gauche']))
	.or(type(['"sx"', '@', 'Coordonée X du point supérieur gauche']))
	.or(type(['"ex"', '@', 'Coordonée X du point inférieur droit']))
	.or(type(['"ey"', '@', 'Coordonée Y du point inférieur droit']))
	.or(type(['"w"', '@', 'Largeur de la boîte englobante']))
	.or(type(['"h"', '@', 'Hauteur de la boîte englobante']))
	.or(type(['"score"', '@', 'Score de confiance de cette boîte, entre 0 et 1']))
	.or(type(['"_"', '@', 'Autre valeur (ignorée par CIGALE)']))
	.array();

const EXIFField = type.enumerated(...keys(EXIF_FIELDS));

const MetadataValue = type({
	value: type('string.json').pipe((jsonstring) => {
		/** @type {import('./metadata').RuntimeValue<typeof MetadataType.infer>}  */
		let out = JSON.parse(jsonstring);
		if (typeof out === 'string') out = parseISOSafe(out) ?? out;
		return out;
	}),
	confidence: Probability.default(1),
	manuallyModified: type('boolean')
		.describe('Si la valeur a été modifiée manuellement')
		.default(false),
	alternatives: {
		'[string.json]': Probability
	}
});

const MetadataValues = scope({ ID }).type({
	'[ID]': MetadataValue
});

const ImageFile = table(
	['id'],
	type({
		/** ID of the associated Image object */
		id: ID,
		bytes: 'ArrayBuffer'
	})
);

const ImagePreviewFile = table(
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
		images: References
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
			"un objet représentant une région rectangulaire au format YOLO, définie par son point central avec `x` et `y`, et sa largeur et hauteur avec `w` et `h`. Les coordonnées sont relatives à la taille de l'image: si (x, y) = (0.5, 0.5), le centre de la boîte est au centre de l'image"
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
	'image?': URLString,
	'learnMore?': URLString.describe(
		"Lien pour en savoir plus sur cette option de l'énumération en particulier"
	)
});

const MetadataInferOptions = type
	.or(
		type({ exif: EXIFField }).describe('Inférer depuis un champ EXIF', 'self'),
		type({
			neural: {
				model: Request.describe(
					'Lien vers le modèle de classification utilisé pour inférer les métadonnées. Au format ONNX (.onnx) seulement, pour le moment.'
				),
				input: ModelInput.describe("Configuration de l'entrée des modèles"),
				'output?': type({
					'name?': ['string', '@', "Nom de l'output du modèle à utiliser. output0 par défaut"]
				})
			}
		}).describe('Inférer depuis un modèle de réseau de neurones', 'self')
	)
	.describe('Comment inférer la valeur de cette métadonnée', 'self');

const MetadataWithoutID = type({
	label: ['string', '@', 'Nom de la métadonnée'],
	mergeMethod: MetadataMergeMethod.configure(
		"Méthode utiliser pour fusionner plusieurs différentes valeurs d'une métadonnée. Notamment utilisé pour calculer la valeur d'une métadonnée sur une Observation à partir de ses images",
		'self'
	),
	required: ['boolean', '@', 'Si la métadonnée est obligatoire'],
	description: ['string', '@', 'Description, pour aider à comprendre la métadonnée'],
	learnMore: URLString.describe(
		'Un lien pour en apprendre plus sur ce que cette métadonnée décrit'
	).optional()
}).and(
	type.or(
		{
			type: "'location'",
			'infer?': { latitude: MetadataInferOptions, longitude: MetadataInferOptions }
		},
		{
			type: "'enum'",
			'infer?': MetadataInferOptions,
			'options?': MetadataEnumVariant.array()
				.atLeastLength(1)
				.describe('Les options valides. Uniquement utile pour une métadonnée de type "enum"'),
			'taxonomic?': type({
				clade: Clade.describe('La clade représentée par cette métadonnée.'),
				// taxonomy: Request.describe(
				// 	"Fichier JSON contenant l'arbre taxonomique. Un schéma JSON décrivant ce fichier est disponible à https://cigaleapp.github.io/cigale/taxonomy.schema.json"
				// )
				parent: type({ '[string]': 'string' }).describe(
					'Associe les valeurs (key) possibles de cette métadonnée aux valeurs (key) de la métadonnée représentant la clade parente'
				)
			}).describe(
				"Configuration si la métadonnée inférée par le modèle est taxonomique, ce qui permet d'inférer les clades supérieures dans des métadonnées additionnelles. Bien penser à définir toutes les autres métadonnées représentant les clades supérieures avec `taxonomic.clade`"
			)
		},
		{ type: MetadataType.exclude('"location" | "enum"'), 'infer?': MetadataInferOptions }
	)
);

const Metadata = table('id', MetadataWithoutID.and({ id: ID }));

const ProtocolWithoutMetadata = type({
	id: ID.describe(
		'Identifiant unique pour le protocole. On conseille de mettre une partie qui vous identifie dans cet identifiant, car il doit être globalement unique. Par exemple, mon-organisation.mon-protocole'
	),
	name: ['string', '@', 'Nom du protocole'],
	description: ['string', '@', 'Description du protocole'],
	source: URLString.describe(
		"Lien vers un site où l'on peut se renseigner sur ce protocole. Cela peut aussi être simplement un lien de téléchargement direct de ce fichier"
	),
	authors: type({
		email: ['string.email', '@', 'Adresse email'],
		name: ['string', '@', 'Prénom Nom']
	})
		.array()
		.describe("Les auteurices ayant participé à l'élaboration du protocole"),
	'metadataOrder?': type(ID.array()).describe(
		"L'ordre dans lequel les métadonnées doivent être présentées dans l'interface utilisateur. Les métadonnées non listées ici seront affichées après toutes celles listées ici"
	),
	'crop?': type({
		metadata: [ID, '@', 'Métadonnée associée à la boîte englobante'],
		infer: type({
			model: Request.describe(
				'Lien vers le modèle de détection utilisé pour inférer les boîtes englobantes. Au format ONNX (.onnx) seulement, pour le moment.'
			),
			input: ModelInput.describe("Configuration de l'entrée du modèle"),
			output: type({
				'name?': ['string', '@', "Nom de l'output du modèle à utiliser. output0 par défaut"],
				normalized: [
					'boolean',
					'@',
					"Si les coordonnées des boîtes englobantes sont normalisées par rapport aux dimensions de l'image"
				],
				shape: ModelDetectionOutputShape.describe(
					"Forme de sortie de chaque boîte englobante. Nécéssite obligatoirement d'avoir 'score'; 2 parmi 'cx', 'sx', 'ex', 'w'; et 2 parmi 'cy', 'sy', 'ey', 'h'. Si les boîtes contiennent d'autre valeurs, bien les mentionner avec '_', même quand c'est à la fin de la liste: cela permet de savoir quand on passe à la boîte suivante. Par exemple, [cx, cy, w, h, score, _] correspond à un modèle YOLO11 COCO"
				)
			}).describe(
				'Forme de la sortie du modèle de classification. Par exemple, shape: [cx, cy, w, h, score, _] et normalized: true correspond à un modèle YOLO11 COCO'
			)
		}).describe("Configuration de l'inférence des boîtes englobantes")
	}).describe('Configuration de la partie recadrage'),
	exports: type({
		images: type({
			cropped: FilepathTemplate.describe('Chemins des images recadrées'),
			original: FilepathTemplate.describe('Chemins des images originales')
		}).describe(
			`Chemins où sauvegarder les images. Vous pouvez utiliser {{observation.metadata.identifiant.value}} pour insérer la valeur d'une métadonnée, {{image.filename}} pour le nom de fichier, {{observation.label}} pour le label (nom) de l'observation, et {{sequence}} pour un numéro d'image, commençant à 1. {{observation.metadata.identifiant.valueLabel}} peut être pratique pour obtenir le label associé au choix d'une métadonnée de type 'enum'. Enfin, il est possible de faire {{suffix image.filename "_exemple"}} pour ajouter "_exemple" à la fin d'un nom de fichier, mais avant son extension (par exemple: {{suffix image.filename "_cropped"}} donnera "IMG_1245_cropped.JPEG" si l'image avait pour nom de fichier "IMG_12345.JPEG"); Vous pouvez faire {{extension image.filename}} pour avoir l'extension d'un fichier, et {{fallback image.metadata.exemple "(Inconnnu)"}} pour utiliser "(Inconnu)" si image.metadata.example n'existe pas. Ce sont enfait des templates Handlebars, en savoir plus: https://handlebarsjs.com/guide/`
		),
		metadata: {
			json: type.string
				.describe("Chemin du fichier JSON contenant les résultats de l'analyse")
				.pipe((path) => path.replaceAll('\\', '/')),
			csv: type.string
				.describe("Chemin du fichier CSV contenant les résultats de l'analyse")
				.pipe((path) => path.replaceAll('\\', '/'))
		}
	})
		.describe("La structure du fichier .zip d'export pour ce protocole.")
		.optional()
});

const Protocol = table(
	'id',
	ProtocolWithoutMetadata.and({
		metadata: References
	})
);

const Settings = table(
	'id',
	type({
		id: '"defaults" | "user"',
		protocols: References,
		theme: type.enumerated('dark', 'light', 'auto'),
		gridSize: 'number',
		language: type.enumerated('fr'),
		showInputHints: 'boolean',
		showTechnicalMetadata: 'boolean'
	})
);

export const Schemas = {
	ID,
	FilepathTemplate,
	Probability,
	MetadataValues,
	MetadataValue,
	Image,
	ModelInput,
	Observation,
	MetadataInferOptions,
	MetadataType,
	MetadataMergeMethod,
	MetadataEnumVariant,
	MetadataWithoutID,
	Metadata,
	Protocol,
	ProtocolWithoutMetadata,
	Settings,
	EXIFField,
	Request
};

export const NO_REACTIVE_STATE_TABLES = /** @type {const} */ (['ImageFile', 'ImagePreviewFile']);

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
	ImagePreviewFile,
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
 * @typedef  ProtocolWithoutMetadata
 * @type {typeof ProtocolWithoutMetadata.infer}
 */

/**
 * @typedef  ModelInput
 * @type {typeof ModelInput.infer}
 */

/**
 * @typedef  ModelDetectionOutputShape
 * @type {typeof ModelDetectionOutputShape.infer}
 */

/**
 * @typedef  Settings
 * @type {typeof Settings.infer}
 */

/**
 * @typedef  Request
 * @type {typeof Request.infer}
 */

/**
 * @typedef EXIFField
 * @type {typeof EXIFField.infer}
 */

/**
 * @typedef MetadataInferOptions
 * @type {typeof MetadataInferOptions.infer}
 */
