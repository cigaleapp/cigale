import { type } from 'arktype';

import { URLString } from './common.js';
import { JsonataExpression } from './expressions.js';

/**
 * @template {import('arktype').Type} O
 * @param {O} Output
 */
export const NetworkStreamedLines = (Output) =>
	type({
		at: URLString.describe('Où télécharger les options'),
		format: type.or(
			[
				'"csv-commas"',
				'@',
				'Format CSV avec champs séparés par ,. La première ligne doit être le nom des clés. Chaque ligne est transformé en un objet pour être traité par .postprocess.',
			],
			[
				'"csv-semicolons"',
				'@',
				'Format CSV avec champs séparés par ;. La première ligne doit être le nom des clés. Chaque ligne est transformé en un objet pour être traité par .postprocess.',
			],
			[
				'"txt"',
				'@',
				'Format texte simple. Il faut ensuite adapter en un objet option avec .postprocess.',
			],
			[
				'"json-lines"',
				'@',
				`Un objet au format JSON par ligne du fichier. La première ligne doit être un header, avec au moins une propriété "count" qui indique le nombre d'options contenues dans le fichier (sans compter la ligne de header)`,
			]
		),
		'postprocess?': JsonataExpression(
			type({
				lineIndex: [
					'number.integer >= 0',
					'@',
					"Index de la ligne actuelle (commence à 0, en sachant que la première ligne n'est pas donnée à postprocess sauf pour txt (csv-*: c'est le header, json-lines: c'est l'objet header avec .count))",
				],
				totalCount: [
					'undefined | number.integer > 0',
					'@',
					"Nombre total d'objets à traiter. Undefined pour txt et csv-*.",
				],
				raw: ['string', '@', 'La ligne du fichier, verbatim'],
				line: [
					'unknown',
					'@',
					'La ligne du fichier, parsée en un objet. Undefined pour txt, Object avec les clés du header pour csv et JSON parsé pour json-lines',
				],
			}),
			Output
		).describe(
			"Appliquer un traitement à chaque option. Renvoyer undefined revient à ne pas rajouter l'option"
		),
	});
