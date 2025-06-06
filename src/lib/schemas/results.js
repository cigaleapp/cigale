import { type } from 'arktype';
import { Protocol } from './protocols.js';

const MetadataRecord = type({
	'[string]': {
		value: ['unknown', '@', 'Valeur de la métadonnée'],
		'valueLabel?': [
			'string',
			'@',
			"Label de la valeur de la métadonnée. Existe pour les métadonnées de type enum, contient dans ce cas le label associé à la clé de l'option de l'enum choisie"
		],
		confidence: ['number', '@', 'Confiance dans la valeur de la métadonnée, entre 0 et 1'],
		manuallyModified: ['boolean', '@', 'La valeur de la métadonnée a été modifiée manuellement'],
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

export const Analysis = type({
	observations: type({
		'[string]': {
			label: ['string', '@', "Label de l'observation"],
			images: type({
				id: ['string', '@', "ID de l'image"],
				filename: ['string', '@', 'Nom du fichier utilisé pour cette image'],
				contentType: [
					'string',
					'@',
					"Type de contenu de l'image, au format MIME (exemple: image/jpeg)"
				],
				sequence: [
					'number',
					'@',
					"Numéro de séquence de l'image dans l'archive .zip. Unique à l'entièreté de l'export"
				],
				metadata: MetadataRecord,
				exportedAs: type({
					original: ['string', '@', "Chemin vers l'image originale"],
					cropped: ['string', '@', "Chemin vers l'image recadrée"]
				}).describe("Chemins dans l'archive .zip vers l'image exportée")
			}).array(),
			metadata: MetadataRecord,
			protocolMetadata: MetadataRecord.describe(
				"Métadonnées définies par le protocole. Les clés de l'objet sont les identifiants des métadonnées, sans le préfixe qui identifie leur protocole de provenance"
			)
		}
	}).describe("Associe l'ID d'une observation à son label et les valeurs de ses métadonnées"),
	protocol: Protocol.describe("Le protocole utilisé pour cette session d'analyse")
});
