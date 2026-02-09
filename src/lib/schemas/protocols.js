import { type } from 'arktype';

import {
	FilepathTemplate,
	HTTPRequest,
	ID,
	References,
	TemplatedString,
	URLString
} from './common.js';
import { Metadata, namespacedMetadataId } from './metadata.js';
import { Image, Observation } from './observations.js';
import { AnalyzedImage, AnalyzedObservation } from './results.js';

export const ExportsFilepathTemplate = FilepathTemplate(
	type({
		observation: AnalyzedObservation.omit('images'),
		image: AnalyzedImage.omit('exportedAs')
		// TODO deprecate these, put them in the image object only
	}).and(AnalyzedImage.pick('sequence', 'numberInObservation'))
);

export const ANALYSIS_JSON_ZIP_FILEPATH = 'analysis.json';

export const Protocol = type({
	id: ID.describe(
		'Identifiant unique pour le protocole. On conseille de mettre une partie qui vous identifie dans cet identifiant, car il doit être globalement unique. Par exemple, mon-organisation.mon-protocole'
	),
	dirty: type('boolean')
		.describe('Si le protocole a été modifié depuis sa dernière exportation')
		.default(false),
	metadata: References.describe(
		"Toutes les métadonnées du protocole (qu'elles soient associées aux sessions ou aux observations/images)"
	),
	sessionMetadata: References.describe('Métadonnées associées à la session entière').default(
		() => []
	),
	name: ['string', '@', 'Nom du protocole'],
	description: ['string', '@', 'Description du protocole'],
	'learnMore?': URLString.describe(
		"Lien vers un site où l'on peut se renseigner sur ce protocole. Cela peut aussi être simplement un lien de téléchargement direct de ce fichier"
	),
	'version?': ['number', '@', 'Version actuelle du protocole'],
	updates: type
		.enumerated('automatic', 'manual')
		.describe('Mode de mise à jour du protocole')
		.default('manual'),
	'source?': HTTPRequest.describe(
		`Requête ou URL devant mener à un fichier JSON contenant la version la plus récente du protocole. Permet de proposer des mises à jour.
		
		Si le champ "version" n'existe pas (que ce soit dans le protocole local ou distant), aucune mise à jour ne sera proposée.`
	),
	authors: type({
		'email?': ['string.email', '@', 'Adresse email'],
		name: ['string', '@', 'Prénom Nom']
	})
		.array()
		.describe("Les auteurices ayant participé à l'élaboration du protocole"),
	'metadataOrder?': type(ID.array()).describe(
		"L'ordre dans lequel les métadonnées doivent être présentées dans l'interface utilisateur. Les métadonnées non listées ici seront affichées après toutes celles listées ici"
	),
	'observations?': {
		'defaultLabel?': TemplatedString(
			type({
				images: Image.array(),
				observation: Observation
			})
		).describe(
			"Label par défaut pour les observations. Template Handlebars, recevant une liste des images de l'observation à crééer (clé images) et l'observation elle-même (clé observation)"
		)
	},
	'crop?': type({
		padding: type(/^\d+(%|px)$/)
			.describe(
				"Pixels de marge à rajouter autour de la boîte englobante au moment d'exporter les images recadrées. Nombre suivi de 'px' pour un nombre de pixels fixe, ou de '%' pour un pourcentage des dimensions de chaque image."
			)
			.default('0px')
	}).describe('Configuration de la partie recadrage'),
	exports: type({
		images: type({
			cropped: ExportsFilepathTemplate.describe('Chemins des images recadrées'),
			original: ExportsFilepathTemplate.describe('Chemins des images originales'),
			'mtime?': [
				'string',
				'@',
				'Métadonnée à utiliser pour la date de modification des fichiers exportés'
			]
		}).describe(
			`Chemins où sauvegarder les images. Vous pouvez utiliser {{observation.metadata.identifiant.value}} pour insérer la valeur d'une métadonnée, {{image.filename}} pour le nom de fichier, {{observation.label}} pour le label (nom) de l'observation, et {{sequence}} pour un numéro d'image, commençant à 1. {{observation.metadata.identifiant.valueLabel}} peut être pratique pour obtenir le label associé au choix d'une métadonnée de type 'enum'. Enfin, il est possible de faire {{suffix image.filename "_exemple"}} pour ajouter "_exemple" à la fin d'un nom de fichier, mais avant son extension (par exemple: {{suffix image.filename "_cropped"}} donnera "IMG_1245_cropped.JPEG" si l'image avait pour nom de fichier "IMG_12345.JPEG"); Vous pouvez faire {{extension image.filename}} pour avoir l'extension d'un fichier, et {{fallback image.metadata.exemple "(Inconnnu)"}} pour utiliser "(Inconnu)" si image.metadata.example n'existe pas. Ce sont enfait des templates Handlebars, en savoir plus: https://handlebarsjs.com/guide/`
		),
		metadata: {
			json: type(`"${ANALYSIS_JSON_ZIP_FILEPATH}"`)
				.describe(
					"Chemin du fichier JSON complet. Il n'est pas possible de le modifier, car CIGALE doit connaître son emplacement dans un .zip pour pouvoir importer des analyses."
				)
				.default(ANALYSIS_JSON_ZIP_FILEPATH),
			csv: type.string
				.describe("Chemin du fichier CSV contenant les résultats de l'analyse")
				.pipe((path) => path.replaceAll('\\', '/'))
		}
	})
		.describe("La structure du fichier .zip d'export pour ce protocole.")
		.optional()
});

export const ExportedProtocol = Protocol.omit('metadata', 'sessionMetadata', 'dirty')
	.in.and({
		metadata: {
			'[string]': Metadata.omit('id').describe(
				'Métadonnées associées aux observations/imagess'
			)
		},
		'sessionMetadata?': {
			'[string]': Metadata.omit('id').describe('Métadonnées associées à la session entière')
		}
	})
	.pipe((protocol) => ({
		...protocol,
		metadata: Object.fromEntries(
			Object.entries(protocol.metadata).map(([id, metadata]) => [
				namespacedMetadataId(protocol.id, id),
				metadata
			])
		),
		sessionMetadata: Object.fromEntries(
			Object.entries(protocol.sessionMetadata ?? {}).map(([id, metadata]) => [
				namespacedMetadataId(protocol.id, id),
				metadata
			])
		)
	}));

/**
 * @typedef {typeof ExportedProtocol.inferOut} ExportedProtocol
 */
