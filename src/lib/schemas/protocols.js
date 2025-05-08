import { type } from 'arktype';
import Handlebars from 'handlebars';
import { safeJSONStringify, splitFilenameOnExtension } from '../utils.js';
import { HTTPRequest, ID, ModelInput, References, URLString } from './common.js';

/**
 * @import { Analysis } from './results';
 */

export const ModelDetectionOutputShape = type(['"cx"', '@', 'Coordonée X du point central'])
	.or(type(['"cy"', '@', 'Coordonée Y du point central']))
	.or(type(['"sy"', '@', 'Coordonée Y du point supérieur gauche']))
	.or(type(['"sx"', '@', 'Coordonée X du point supérieur gauche']))
	.or(type(['"ex"', '@', 'Coordonée X du point inférieur droit']))
	.or(type(['"ey"', '@', 'Coordonée Y du point inférieur droit']))
	.or(type(['"w"', '@', 'Largeur de la boîte englobante']))
	.or(type(['"h"', '@', 'Hauteur de la boîte englobante']))
	.or(type(['"score"', '@', 'Score de confiance de cette boîte, entre 0 et 1']))
	.or(type(['"_"', '@', 'Autre valeur (ignorée par CIGALE)']))
	.array();

/**
 * Add a suffix to a filename, before the extension
 */
Handlebars.registerHelper('suffix', (subject, suffix) => {
	type('string').assert(subject);
	type('string').assert(suffix);

	const [stem, ext] = splitFilenameOnExtension(subject);
	return `${stem}${suffix}.${ext}`;
});

/**
 * Get the extension part from a filename
 */
Handlebars.registerHelper('extension', (subject) => {
	type('string').assert(subject);

	return splitFilenameOnExtension(subject)[1];
});

/**
 * Provide a default, akin to a ?? b
 */
Handlebars.registerHelper('fallback', (subject, fallback) => {
	return subject ?? fallback;
});

export const FilepathTemplate = type.string
	.pipe((t) => {
		try {
			return {
				source: t,
				template: Handlebars.compile(t, {
					noEscape: true,
					assumeObjects: true,
					knownHelpersOnly: true,
					knownHelpers: {
						suffix: true,
						extension: true,
						fallback: true
					}
				})
			};
		} catch (e) {
			throw new Error(`Invalid template ${safeJSONStringify(t)}: ${e}`);
		}
	})
	.pipe(({ source, template }) => ({
		/** @param {{ observation: Omit<typeof Analysis.inferIn['observations'][number], 'images'>, image: typeof Analysis.inferIn['observations'][number]['images'][number], sequence: number }} data */
		render(data) {
			console.log('Applying template', source, 'on', data);
			return template(data, {}).replaceAll('\\', '/');
		},
		toJSON: () => source
	}));

export const Protocol = type({
	id: ID.describe(
		'Identifiant unique pour le protocole. On conseille de mettre une partie qui vous identifie dans cet identifiant, car il doit être globalement unique. Par exemple, mon-organisation.mon-protocole'
	),
	metadata: References,
	name: ['string', '@', 'Nom du protocole'],
	description: ['string', '@', 'Description du protocole'],
	source: URLString.describe(
		"Lien vers un site où l'on peut se renseigner sur ce protocole. Cela peut aussi être simplement un lien de téléchargement direct de ce fichier"
	),
	authors: type({
		email: ['string.email', '@', 'Adresse email'],
		name: ['string', '@', 'Prénom Nom']
	})
		.array()
		.describe("Les auteurices ayant participé à l'élaboration du protocole"),
	'metadataOrder?': type(ID.array()).describe(
		"L'ordre dans lequel les métadonnées doivent être présentées dans l'interface utilisateur. Les métadonnées non listées ici seront affichées après toutes celles listées ici"
	),
	'crop?': type({
		metadata: [ID, '@', 'Métadonnée associée à la boîte englobante'],
		'confirmationMetadata?': [
			ID,
			'@',
			'Métadonnée associée au fait que la boîte englobante a été (humainement) confirmée'
		],
		infer: type({
			model: HTTPRequest.describe(
				'Lien vers le modèle de détection utilisé pour inférer les boîtes englobantes. Au format ONNX (.onnx) seulement, pour le moment.'
			),
			input: ModelInput.describe("Configuration de l'entrée du modèle"),
			output: type({
				'name?': ['string', '@', "Nom de l'output du modèle à utiliser. output0 par défaut"],
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
		}).describe("Configuration de l'inférence des boîtes englobantes")
	}).describe('Configuration de la partie recadrage'),
	exports: type({
		images: type({
			cropped: FilepathTemplate.describe('Chemins des images recadrées'),
			original: FilepathTemplate.describe('Chemins des images originales')
		}).describe(
			`Chemins où sauvegarder les images. Vous pouvez utiliser {{observation.metadata.identifiant.value}} pour insérer la valeur d'une métadonnée, {{image.filename}} pour le nom de fichier, {{observation.label}} pour le label (nom) de l'observation, et {{sequence}} pour un numéro d'image, commençant à 1. {{observation.metadata.identifiant.valueLabel}} peut être pratique pour obtenir le label associé au choix d'une métadonnée de type 'enum'. Enfin, il est possible de faire {{suffix image.filename "_exemple"}} pour ajouter "_exemple" à la fin d'un nom de fichier, mais avant son extension (par exemple: {{suffix image.filename "_cropped"}} donnera "IMG_1245_cropped.JPEG" si l'image avait pour nom de fichier "IMG_12345.JPEG"); Vous pouvez faire {{extension image.filename}} pour avoir l'extension d'un fichier, et {{fallback image.metadata.exemple "(Inconnnu)"}} pour utiliser "(Inconnu)" si image.metadata.example n'existe pas. Ce sont enfait des templates Handlebars, en savoir plus: https://handlebarsjs.com/guide/`
		),
		metadata: {
			json: type.string
				.describe("Chemin du fichier JSON contenant les résultats de l'analyse")
				.pipe((path) => path.replaceAll('\\', '/')),
			csv: type.string
				.describe("Chemin du fichier CSV contenant les résultats de l'analyse")
				.pipe((path) => path.replaceAll('\\', '/'))
		}
	})
		.describe("La structure du fichier .zip d'export pour ce protocole.")
		.optional()
});
