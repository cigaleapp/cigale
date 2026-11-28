import { type } from 'arktype';

import { entries } from '../utils.js';
import { HTTPRequest, URLString, ID } from './common.js';
import { HardwareRequirements } from './constraints.js';
import { JsonataExpression } from './expressions.js';
import { NetworkStreamedLines } from './network.js';

export const MODEL_DETECTION_OUTPUT_SHAPES = {
	cx: { help: 'Centre, X' },
	cy: { help: 'Centre, Y' },
	sy: { help: 'Supérieur gauche, X' },
	sx: { help: 'Supérieur gauche, Y' },
	ex: { help: 'Inférieur droit, X' },
	ey: { help: 'Inférieur droit, Y' },
	w: { help: 'Largeur de la boîte' },
	h: { help: 'Hauteur de la boîte' },
	score: { help: 'Confiance (0—1)' },
	_: { help: 'Autre valeur (ignorée)' },
};

export const ModelDetectionOutputShape = type.or(
	...entries(MODEL_DETECTION_OUTPUT_SHAPES).map(([key, { help }]) =>
		type(`"${key}"`).describe(help, 'self')
	)
);

export const ModelDetectionOutputShapes = ModelDetectionOutputShape.array();

export const ModelInput = type({
	width: ['number < 1024', '@', "Largeur en pixels du tenseur d'entrée du modèle"],
	height: ['number < 1024', '@', "Hauteur en pixels du tenseur d'entrée du modèle"],
	'disposition?': type(['"CHW"', '@', 'Tenseurs de la forme [3, H, W]']).or(
		type(['"1CHW"', '@', 'Tenseurs de la forme [1, 3, H, W]'])
	),
	normalized: [
		'boolean',
		'@',
		'Si les valeurs des pixels doivent être normalisées entre 0 et 1. Sinon, elles sont entre 0 et 255',
	],
	'name?': [
		'string',
		'@',
		"Nom de l'input du modèle à utiliser. Par défaut, prend la première input",
	],
});

export const ModelOutputCommon = type({
	name: type('string ', '@', "Nom de l'output du modèle à utiliser. output0 par défaut").default(
		'output0'
	),
});

export const ModelOutputBoundingBox = ModelOutputCommon.and({
	normalized: [
		'boolean',
		'@',
		"Si les coordonnées des boîtes englobantes sont normalisées par rapport aux dimensions de l'image",
	],
	shape: ModelDetectionOutputShapes.describe(
		"Forme de sortie de chaque boîte englobante. Nécéssite obligatoirement d'avoir 'score'; 2 parmi 'cx', 'sx', 'ex', 'w'; et 2 parmi 'cy', 'sy', 'ey', 'h'. Si les boîtes contiennent d'autre valeurs, bien les mentionner avec '_', même quand c'est à la fin de la liste: cela permet de savoir quand on passe à la boîte suivante. Par exemple, [cx, cy, w, h, score, _] correspond à un modèle YOLO11"
	),
});

export const ModelOutputEnum = ModelOutputCommon.and({
	'select?': JsonataExpression(
		type({
			neurons: type({ score: '0 <= number <= 1', key: 'string' }).array(),
		}),
		type('string[]')
	).describe(
		'Given the 100 highest-score options (sorted with highest-score first), choose which options to select for the metadata value. If more than one is returned, the first element will be the value and the other elements will be alternatives. By default, the highest-score option only will be selected'
	),
});

export const ModelSettingsCommon = type({
	model: HTTPRequest.describe(
		'Lien vers le modèle de classification utilisé pour inférer les métadonnées. Au format ONNX (.onnx) seulement, pour le moment.'
	),
	'name?': [
		'string',
		'@',
		"Nom du réseau à afficher dans l'interface. Particulièrement utile si il y a plusieurs réseaux",
	],
	input: ModelInput.describe("Configuration de l'entrée des modèles"),
	'requirements?': HardwareRequirements.describe(
		'Configuration matérielle minimum pour éxécuter ce modèle'
	),
	webgpuReady: 'boolean = false',
});

export const NeuralBoundingBoxInference = ModelSettingsCommon.and({
	output: ModelOutputBoundingBox,
});

const ClassmappingRef = type.enumerated('labels', 'keys', 'extraKeys');
export const ClassmappingLineParsed = type.or('string', {
	neuron: 'number.integer >= 0',
	value: 'string',
	ref: ClassmappingRef.default('keys'),
});

export const NeuralEnumInference = ModelSettingsCommon.and({
	'output?': ModelOutputEnum,
	classmapping: NetworkStreamedLines(ClassmappingLineParsed)
		.describe(
			`Récupération du classmapping du modèle. postprocess permet de traiter les lignes du classmapping: on peut soit renvoyer une string, soit un objet avec .value, ref: "labels" | "keys" | "extraKeys" (à quoi fait référence .value dans les options de la métadonnée, optionnel) et neuron: n >= 0, l'index (commençant à 0) du neurone de la couche de sortie à laquelle correspond cette classe. Pratique si le fichier ne les donne pas dans l'ordre (optionnel)`
		)
		.or(
			type(URLString).pipe((url) =>
				NetworkStreamedLines(ClassmappingLineParsed).from({
					at: url,
					format: 'txt',
					postprocess: '{ "value": raw }',
				})
			)
		),
	classes: ClassmappingRef.describe(
		`À quoi le classmapping fait référence par rapport aux options de la métadonnée. Si classmapping.postprocess renvoie des objets, et que ref n'est pas précisé, c'est cette valeur qui est utilisée`
	).default('keys'),
});

/**
 * @typedef {typeof NeuralBoundingBoxInference.infer | typeof NeuralEnumInference.infer} NeuralInference
 */

export const CustomNeuralNetworkSchema = type({
	id: ID,
	name: 'string',
	input: ModelInput,
	bytes: '"migrated" = "migrated"',
	sessionId: '"_" = "_"',
	'requirements?': HardwareRequirements,
	webgpuReady: 'boolean = false',
})
	.and(
		type.or(
			{
				source: '"remote"',
				url: 'string.url.parse',
				filename: '"none"',
			},
			{
				source: '"local"',
				filename: 'string > 0',
			}
		)
	)
	.and(
		type.or(
			{
				purpose: '"classify"',
				classmapping: HTTPRequest.or('string[]'),
				'output?': { 'name?': 'string' },
			},
			{
				purpose: '"detect"',
				output: ModelOutputBoundingBox,
			}
		)
	);
