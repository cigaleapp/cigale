import { type } from 'arktype';
import Handlebars from 'handlebars';

import { entries, safeJSONStringify, splitFilenameOnExtension } from '../utils.js';
import { HTTPRequest, ID, ModelInput, References, URLString } from './common.js';
import { Metadata, namespacedMetadataId } from './metadata.js';
import { Image, Observation } from './observations.js';
import { AnalyzedImage, AnalyzedObservation } from './results.js';

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

export const HANDLEBARS_HELPERS = {
	suffix: {
		documentation: "Ajoute un suffixe à un nom de fichier, avant l'extension",
		usage: "{{ suffix 'filename.jpeg' '_example' }} -> 'filename_example.jpeg'",
		/**
		 * @param {string} subject
		 * @param {string} suffix
		 */
		implementation: (subject, suffix) => {
			const [stem, ext] = splitFilenameOnExtension(subject);
			return `${stem}${suffix}.${ext}`;
		}
	},
	extension: {
		documentation: 'Récupère l’extension d’un nom de fichier',
		usage: "{{ extension 'filename.jpeg' }} -> 'jpeg'",
		/**
		 * @param {string} subject
		 */
		implementation: (subject) => {
			return splitFilenameOnExtension(subject)[1];
		}
	},
	fallback: {
		documentation: 'Fournit une valeur de repli si la première est indéfinie',
		usage: "{{ fallback obj.does_not_exist 'Unknown' }} -> 'Unknown'",
		/**
		 * @param {string} subject
		 * @param {string} fallback
		 */
		implementation: (subject, fallback) => {
			return subject ?? fallback;
		}
	}
};

for (const [name, { implementation }] of Object.entries(HANDLEBARS_HELPERS)) {
	Handlebars.registerHelper(name, implementation);
}

/**
 * @template {import("arktype").Type} T
 * @param {T} Input
 */
export const TemplatedString = (Input) =>
	type.string.pipe((t) => {
		try {
			const compiled = Handlebars.compile(t, {
				noEscape: true,
				assumeObjects: true,
				knownHelpersOnly: true,
				knownHelpers: { suffix: true, extension: true, fallback: true }
			});

			return {
				toJSON: () => t,
				/**
				 * @param {T["inferIn"]} data
				 * @returns {string}
				 */
				render: (data) => compiled(Input.assert(data))
			};
		} catch (cause) {
			throw new Error(`Invalid template ${safeJSONStringify(t)}`, { cause });
		}
	});

export const FilepathTemplate = TemplatedString(
	type({
		observation: AnalyzedObservation.omit('images'),
		image: AnalyzedImage.omit('exportedAs')
		// TODO deprecate these, put them in the image object only
	}).and(AnalyzedImage.pick('sequence', 'numberInObservation'))
).pipe(({ render, toJSON }) => ({
	toJSON,
	/** @type {typeof render} */
	render: (data) => render(data).replaceAll('\\', '/')
}));

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
	crop: type({
		metadata: [ID, '@', 'Métadonnée associée à la boîte englobante'],
		'confirmationMetadata?': ID.configure({
			deprecated: true,
			description:
				'Métadonnée associée au fait que la boîte englobante a été (humainement) confirmée. Dépréciée, la confirmation est maintenant stockée dans les valeurs des métadonnées directement.'
		}),
		padding: type(/^\d+(%|px)$/)
			.describe(
				"Pixels de marge à rajouter autour de la boîte englobante au moment d'exporter les images recadrées. Nombre suivi de 'px' pour un nombre de pixels fixe, ou de '%' pour un pourcentage des dimensions de chaque image."
			)
			.default('0px'),
		'classifyUncropped?': [
			'boolean',
			'@',
			"Lancer la classification des images qui n'ont pas de boîte englobante"
		],
		'infer?': type({
			'name?': [
				'string',
				'@',
				"Nom du réseau à afficher dans l'interface. Particulièrement utile si il y a plusieurs réseaux"
			],
			model: HTTPRequest.describe(
				'Lien vers le modèle de détection utilisé pour inférer les boîtes englobantes. Au format ONNX (.onnx) seulement, pour le moment.'
			),
			input: ModelInput.describe("Configuration de l'entrée du modèle"),
			output: type({
				'name?': [
					'string',
					'@',
					"Nom de l'output du modèle à utiliser. output0 par défaut"
				],
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
		})
			.array()
			.describe("Configuration de l'inférence des boîtes englobantes")
	}).describe('Configuration de la partie recadrage'),
	exports: type({
		images: type({
			cropped: FilepathTemplate.describe('Chemins des images recadrées'),
			original: FilepathTemplate.describe('Chemins des images originales'),
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
