import { scope, type } from 'arktype';
import { parseISOSafe } from '../date.js';
import { EXIF_FIELDS } from '../exiffields.js';
import { Clade } from '../taxonomy.js';
import { keys } from '../utils.js';
import { HTTPRequest, ID, ModelInput, Probability, URLString } from './common.js';

export const MetadataValue = type({
	value: type('string.json').pipe((jsonstring) => {
		/** @type {import('../metadata').RuntimeValue<typeof MetadataType.infer>}  */
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

export const MetadataValues = scope({ ID }).type({
	'[ID]': MetadataValue
});

export const MetadataType = type("'string'", '@', 'du texte')
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

export const MetadataMergeMethod = type.or(
	type(
		'"min"',
		'@',
		"Choisir la valeur avec la meilleure confiance, et prendre la plus petite valeur en cas d'ambuiguité"
	),
	type(
		'"max"',
		'@',
		"Choisir la valeur avec la meilleure confiance, et prendre la plus grande valeur en cas d'ambuiguité"
	),
	type('"average"', '@', 'Prendre la moyenne des valeurs'),
	type('"median"', '@', 'Prendre la médiane des valeurs'),
	type('"none"', '@', 'Ne pas fusionner'),
	type(
		'"union"',
		'@',
		'Spécifique aux boîtes de recadrage: fusionne les boîtes de recadrage en la plus petite boîte englobant toutes les boîtes'
	)
);

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
	union: {
		label: 'Union',
		help: 'Spécifique aux boîtes de recadrage: fusionne les boîtes de recadrage en la plus petite boîte englobant toutes les boîtes'
	},
	none: {
		label: 'Aucune',
		help: 'Ne pas fusionner'
	}
};

export const MetadataEnumVariant = type({
	key: [ID, '@', 'Identifiant unique pour cette option'],
	label: ['string', '@', "Nom de l'option, affichable dans une interface utilisateur"],
	description: ['string', '@', 'Description (optionnelle) de cette option'],
	'image?': URLString,
	'learnMore?': URLString.describe(
		"Lien pour en savoir plus sur cette option de l'énumération en particulier"
	)
});

export const EXIFField = type.enumerated(...keys(EXIF_FIELDS));

export const MetadataNeuralInference = type({
	model: HTTPRequest.describe(
		'Lien vers le modèle de classification utilisé pour inférer les métadonnées. Au format ONNX (.onnx) seulement, pour le moment.'
	),
	input: ModelInput.describe("Configuration de l'entrée des modèles"),
	'output?': type({
		'name?': ['string', '@', "Nom de l'output du modèle à utiliser. output0 par défaut"]
	})
});

export const MetadataInferOptions = type
	.or(
		type({ exif: EXIFField }).describe('Inférer depuis un champ EXIF', 'self'),
		type({ neural: MetadataNeuralInference }).describe(
			'Inférer depuis un modèle de réseau de neurones',
			'self'
		)
	)
	.describe('Comment inférer la valeur de cette métadonnée', 'self');

export const Metadata = type({
	id: ID.describe(
		'Identifiant unique pour la métadonnée. On conseille de mettre une partie qui vous identifie dans cet identifiant, car il doit être globalement unique. Par exemple, mon-organisation.ma-métadonnée'
	),
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
