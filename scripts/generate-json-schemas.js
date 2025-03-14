import { writeFile } from 'node:fs/promises';
import { ExportedProtocol } from '../src/lib/protocols.js';
import { type } from 'arktype';
import path from 'node:path';
import { Schemas } from '../src/lib/database.js';

const here = path.dirname(new URL(import.meta.url).pathname);
const outputDir = path.resolve(here, '../static/');

async function exportJsonSchema(name, schema) {
	const json = JSON.stringify(
		{
			$schema: 'https://json-schema.org/draft-07/schema',
			...schema.in.toJsonSchema()
		},
		null,
		2
	);
	await writeFile(path.resolve(outputDir, `${name}.schema.json`), json);
}

await exportJsonSchema('protocol', ExportedProtocol);
await exportJsonSchema(
	'results',
	type({
		observations: type({
			'[string]': {
				label: ['string', '@', "Label de l'observation"],
				metadata: {
					'[string]': {
						value: ['unknown', '@', 'Valeur de la métadonnée'],
						'valueLabel?': [
							'string',
							'@',
							"Label de la valeur de la métadonnée. Existe pour les métadonnées de type enum, contient dans ce cas le label associé à la clé de l'option de l'enum choisie"
						],
						confidence: ['number', '@', 'Confiance dans la valeur de la métadonnée, entre 0 et 1'],
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
				}
			}
		}).describe("Associe l'ID d'une observation à son label et les valeurs de ses métadonnées"),
		protocol: Schemas.Protocol.describe("Le protocole utilisé pour cette session d'analyse")
	})
);
