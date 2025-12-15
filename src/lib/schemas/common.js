import { type } from 'arktype';

import { clamp } from '../utils.js';

export const ID = type(/^[\w._]+$/);

export const References = ID.array().pipe((ids) => [...new Set(ids)]);

/**
 * Between 0 and 1
 * Allow slightly above 1 to account for floating point imprecision,
 * but clamp it back to [0, 1]
 */
export const Probability = type('0 <= number <= 1.0001').pipe((n) => clamp(n, 0, 1));

/**
 * Can't use string.url.parse because it prevents us from generating JSON schemas
 */
export const URLString = type(/https?:\/\/.+/);

export const ColorHex = type(/^#?[0-9A-Fa-f]{6}$/).pipe((s) => (s.startsWith('#') ? s : `#${s}`));

export const HTTPRequest = URLString.configure(
	"L'URL à laquelle se situe le fichier. Effectue une requête GET sans en-têtes particuliers.",
	'self'
)
	.or({
		url: URLString.describe("L'URL de la requête"),
		'headers?': type({ '[string]': 'string' }).describe(
			'Les en-têtes à ajouter dans la requête'
		),
		'method?': type
			.enumerated('GET', 'POST', 'PUT', 'DELETE')
			.describe('La méthode de la requête (GET par défaut)')
	})
	.configure(
		'Le requête HTTP pour obtenir le fichier, avec des en-têtes et une méthode personnalisable',
		'self'
	);

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

export const Dimensions = type({
	width: 'number > 0',
	height: 'number > 0'
}).pipe(({ width, height }) => ({
	width,
	height,
	aspectRatio: width / height
}));
