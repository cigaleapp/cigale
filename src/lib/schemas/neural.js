import { type } from 'arktype';

import { entries } from '../utils.js';
import { HTTPRequest } from './common.js';

export const MODEL_DETECTION_OUTPUT_SHAPES = {
	cx: { help: 'Coordonée X du point central' },
	cy: { help: 'Coordonée Y du point central' },
	sy: { help: 'Coordonée Y du point supérieur gauche' },
	sx: { help: 'Coordonée X du point supérieur gauche' },
	ex: { help: 'Coordonée X du point inférieur droit' },
	ey: { help: 'Coordonée Y du point inférieur droit' },
	w: { help: 'Largeur de la boîte englobante' },
	h: { help: 'Hauteur de la boîte englobante' },
	score: { help: 'Score de confiance de cette boîte, entre 0 et 1' },
	_: { help: 'Autre valeur (ignorée par CIGALE)' }
};

export const ModelDetectionOutputShape = type
	.or(
		...entries(MODEL_DETECTION_OUTPUT_SHAPES).map(([key, { help }]) =>
			type(`"${key}"`).describe(help, 'self')
		)
	)
	.array();

export const ModelInput = type({
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

export const ModelOutputCommon = type({
	'name?': ['string', '@', "Nom de l'output du modèle à utiliser. output0 par défaut"]
});

export const ModelOutputBoundingBox = ModelOutputCommon.and({
	normalized: [
		'boolean',
		'@',
		"Si les coordonnées des boîtes englobantes sont normalisées par rapport aux dimensions de l'image"
	],
	shape: ModelDetectionOutputShape.describe(
		"Forme de sortie de chaque boîte englobante. Nécéssite obligatoirement d'avoir 'score'; 2 parmi 'cx', 'sx', 'ex', 'w'; et 2 parmi 'cy', 'sy', 'ey', 'h'. Si les boîtes contiennent d'autre valeurs, bien les mentionner avec '_', même quand c'est à la fin de la liste: cela permet de savoir quand on passe à la boîte suivante. Par exemple, [cx, cy, w, h, score, _] correspond à un modèle YOLO11 COCO"
	)
});

const ModelSettingsCommon = type({
	model: HTTPRequest.describe(
		'Lien vers le modèle de classification utilisé pour inférer les métadonnées. Au format ONNX (.onnx) seulement, pour le moment.'
	),
	'name?': [
		'string',
		'@',
		"Nom du réseau à afficher dans l'interface. Particulièrement utile si il y a plusieurs réseaux"
	],
	input: ModelInput.describe("Configuration de l'entrée des modèles")
});

export const NeuralBoundingBoxInference = ModelSettingsCommon.and({
	output: ModelOutputBoundingBox
});

export const NeuralEnumInference = ModelSettingsCommon.and({
	'output?': ModelOutputCommon,
	classmapping: HTTPRequest.describe(
		'Fichier texte contenant une clé de la métadonnée par ligne, dans le même ordre que les neurones de sortie du modèle.'
	)
});

/**
 * @typedef {typeof NeuralBoundingBoxInference.infer | typeof NeuralEnumInference.infer} NeuralInference
 */
