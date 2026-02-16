import { type } from 'arktype';

import { mapKeys } from '../utils.js';
import {
	FilepathTemplate,
	HTTPRequest,
	ID,
	MIMEType,
	NamespacedMetadataID,
	ProtocolID,
	TemplatedString,
	URLString
} from './common.js';
import { Metadata, namespacedMetadataId } from './metadata.js';
import { Image, Observation } from './observations.js';
import { AnalyzedImage, AnalyzedObservation } from './results.js';

export const ExportsFilepathTemplateObservation = FilepathTemplate(
	type({
		observation: AnalyzedObservation.omit('images'),
		image: AnalyzedImage.omit('exportedAs')
		// TODO deprecate these, put them in the image object only
	}).and(AnalyzedImage.pick('sequence', 'numberInObservation'))
);

export const ExportsFilepathTemplateMetadataFile = FilepathTemplate(
	type({
		observation: ['undefined', '|', AnalyzedObservation.omit('images')],
		image: ['undefined', '|', AnalyzedImage.omit('exportedAs')],
		session: ['undefined', '|', { id: 'string' }],
		metadata: Metadata,
		metadataKey: ['string', '@', 'ID de la métadonnée, sans namespace'],
		size: ['number', '@', 'Taille du fichier en octets'],
		filename: 'string',
		contentType: MIMEType,
		id: [
			'string',
			'@',
			'Référence du fichier, correspondant à la valeur de la métadonnée de type "file"'
		]
	})
);

export const ANALYSIS_JSON_ZIP_FILEPATH = 'analysis.json';

export const Protocol = type({
	id: ProtocolID,
	dirty: type('boolean')
		.describe('Si le protocole a été modifié depuis sa dernière exportation')
		.default(false),
	metadata: NamespacedMetadataID.array().describe(
		"Toutes les métadonnées du protocole (qu'elles soient associées aux sessions ou aux observations/images)"
	),
	sessionMetadata: NamespacedMetadataID.array()
		.describe('Métadonnées associées à la session entière')
		.default(() => []),
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
	'metadataOrder?': type(NamespacedMetadataID.array()).describe(
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
			cropped: ExportsFilepathTemplateObservation.describe('Chemins des images recadrées'),
			original: ExportsFilepathTemplateObservation.describe('Chemins des images originales'),
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
				.pipe((path) => path.replaceAll('\\', '/')),
			files: ExportsFilepathTemplateMetadataFile.describe(
				'Chemins où sauvegarder les fichiers pour les métadonnées de type "file". Même syntaxe que pour les images, mais avec en plus {{metadata}} pour accéder à la métadonnée elle-même, {{metadataKey}} pour accéder à la clé de la métadonnée (sans namespace), {{filename}} pour le nom du fichier, {{contentType}} pour son type MIME, {{id}} pour sa référence (cette référence est ce qui est stocké dans la valeur de la métadonnée de type "file", et peut être utilisée pour faire le lien entre les fichiers et les métadonnées), et {{size}} pour sa taille en octets.'
			).default(
				'{{ metadataKey }}-files/{{ stem filename }}-{{ id }}.{{ extension filename }}'
			)
		}
	})
		.describe("La structure du fichier .zip d'export pour ce protocole.")
		.optional()
});

export const ExportedProtocol = Protocol.omit(
	'metadata',
	'sessionMetadata',
	'metadataOrder',
	'dirty'
)
	.in.and({
		'metadataOrder?': ID.array().describe(
			"L'ordre dans lequel les métadonnées doivent être présentées dans l'interface utilisateur. Les métadonnées non listées ici seront affichées après toutes celles listées ici"
		),
		metadata: type.Record(
			ID,
			Metadata.in.omit('id').describe('Métadonnées associées aux observations/imagess')
		),
		'sessionMetadata?': type.Record(
			ID,
			Metadata.in.omit('id').describe('Métadonnées associées à la session entière')
		)
	})
	.pipe((protocol) => ({
		...protocol,
		metadataOrder: protocol.metadataOrder?.map((key) => namespacedMetadataId(protocol.id, key)),
		metadata: mapKeys(protocol.metadata, (key) => namespacedMetadataId(protocol.id, key)),
		sessionMetadata: mapKeys(protocol.sessionMetadata ?? {}, (key) =>
			namespacedMetadataId(protocol.id, key)
		)
	}));

/**
 * @typedef {typeof ExportedProtocol.inferOut} ExportedProtocol
 */
