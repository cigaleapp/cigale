import { type } from 'arktype';
import { format as formatDate } from 'date-fns';
import Handlebars from 'handlebars';

import { clamp, mapValues, safeJSONStringify, splitFilenameOnExtension } from '../utils.js';

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

export const Dimensions = type({
	width: 'number > 0',
	height: 'number > 0'
}).pipe(({ width, height }) => ({
	width,
	height,
	aspectRatio: width / height
}));

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
	},
	metadata: {
		documentation:
			"Récupère la valeur d'une métadonnée sur un subjet (une session, une observation ou une image) donnée. L'ID de la métadonnée peut ne pas comporter de namespace. Dans ce cas, le namespace correspondant au protocole courant est utilisé. Renvoie null si la métadonnée n'existe pas.",
		usage: "{{ metadata session 'transect_code' }} -> 'TR123'",
		/**
		 * @param {{ [ K in "protocolMetadata" | "metadata"]: import('$lib/database.js').MetadataValues } | { [ K in "metadataOverrides" | "protocolMetadataOverrides"]: import('$lib/database.js').MetadataValues }} subject
		 * @param {string} metadataId
		 */
		implementation: (subject, metadataId) => {
			if ('metadata' in subject) {
				return (
					subject.protocolMetadata[metadataId]?.value ??
					subject.metadata[metadataId]?.value ??
					null
				);
			}

			if ('metadataOverrides' in subject) {
				return (
					subject.protocolMetadataOverrides[metadataId]?.value ??
					subject.metadataOverrides[metadataId]?.value ??
					null
				);
			}

			throw new Error('Subject must have either metadata or metadataOverrides property');
		}
	},
	now: {
		documentation:
			'Renvoie la date actuelle dans le format précisé. Voir https://date-fns.org/v4.1.0/docs/format pour une description complète du format',
		usage: "{{ now \"dd/MM/yyyy 'à' HH:mm\" }} -> '31/12/2026 à 23:59'",
		/**
		 * @param {string} format
		 */
		implementation: (format) => {
			return formatDate(Date.now(), format);
		}
	},
	year: {
		documentation: "Renvoie l’année d'une date sur 4 chiffres",
		usage: "{{ year '2024-12-31' }} -> '2024'",
		/**
		 * @param {string} date
		 */
		implementation: (date) => {
			return formatDate(new Date(date), 'yyyy');
		}
	},
	month: {
		documentation: "Renvoie le mois d'une date sur 2 chiffres",
		usage: "{{ month '2024-12-31' }} -> '12'",
		/**
		 * @param {string} date
		 */
		implementation: (date) => {
			return formatDate(new Date(date), 'MM');
		}
	},
	day: {
		documentation: "Renvoie le jour d'une date sur 2 chiffres",
		usage: "{{ day '2024-12-31' }} -> '31'",
		/**
		 * @param {string} date
		 */
		implementation: (date) => {
			return formatDate(new Date(date), 'dd');
		}
	},
	hour: {
		documentation: "Renvoie l'heure d'une date sur 2 chiffres",
		usage: "{{ hour '2024-12-31T23:59' }} -> '23'",
		/**
		 * @param {string} date
		 */
		implementation: (date) => {
			return formatDate(new Date(date), 'HH');
		}
	},
	minute: {
		documentation: "Renvoie les minutes d'une date sur 2 chiffres",
		usage: "{{ minute '2024-12-31T23:59' }} -> '59'",
		/**
		 * @param {string} date
		 */
		implementation: (date) => {
			return formatDate(new Date(date), 'mm');
		}
	},
	second: {
		documentation: "Renvoie les secondes d'une date sur 2 chiffres",
		usage: "{{ second '2024-12-31T23:59:01' }} -> '01'",
		/**
		 * @param {string} date
		 */
		implementation: (date) => {
			return formatDate(new Date(date), 'ss');
		}
	},
	date: {
		documentation:
			"Construire une date à partir de ses composantes. il est possible d'omettre les noms des composantes si on les donnent dans l'ordre descendant (year, ..., minutes). toutes les composantes sont optionelles à partir des heures (et valent 0 par défaut). Les dates sont interprétées localement (dans le fuseau horaire local) ",
		usage: "{{ date year=2024 month=12 day=31 hours=23 minutes=59 seconds=1.5 }} -> '2024-12-31T23:59:01.500+02:00'",
		/**
		 * @param {number} year
		 * @param {number} month
		 * @param {number} day
		 * @param {number | undefined} hours
		 * @param {number | undefined} minutes
		 * @param {{hash: { year?: number, month?: number, day?: number, hours?: number, minutes?: number, seconds?: number}}} options
		 */
		implementation: (year, month, day, hours, minutes, { hash }) => {
			const seconds = hash.seconds ?? 0;

			return new Date(
				year,
				month - 1, // JavaScript 🥰
				day,
				hours ?? hash.hours ?? 0,
				minutes ?? hash.minutes ?? 0,
				Math.floor(seconds),
				Math.round((seconds - Math.floor(seconds)) * 1000)
			);
		}
	},
	object: {
		documentation:
			"Crée une représentation JSON d'un objet en prenant les paramètres comme paires clé-valeur",
		usage: '{{ object key1=\'value1\' key2=\'value2\' }} -> \'{"key1":"value1","key2":"value2"}\'',
		/**
		 * @param {{hash: Record<string, unknown>}} options
		 */
		implementation: ({ hash }) => {
			return safeJSONStringify(hash);
		}
	},
	array: {
		documentation:
			"Crée une représentation JSON d'un tableau en prenant les paramètres comme éléments du tableau",
		usage: "{{ array 'value1' 'value2' }} -> '[\"value1\",\"value2\"]'",
		/**
		 * @param {unknown} e0
		 * @param {unknown} e1
		 * @param {unknown} e2
		 * @param {unknown} e3
		 * @param {unknown} e4
		 * @param {unknown} e5
		 */
		implementation: (e0, e1, e2, e3, e4, e5) => {
			return safeJSONStringify([e0, e1, e2, e3, e4, e5].filter((e) => e !== undefined));
		}
	},
	gps: {
		documentation:
			'Crée une représetation JSON des coordonnées GPS données (latitude puis longitude)',
		usage: '{{ gps 42.957408 1.0859884 }} -> \'{"latitude": 42.957408, "longitude": 1.0859884}\'',
		/**
		 * @param {number} latitude
		 * @param {number} longitude
		 */
		implementation: (latitude, longitude) => {
			return safeJSONStringify({ latitude, longitude });
		}
	},
	boundingBox: {
		documentation:
			'Crée une représentation JSON d’une bounding box à partir de ses coordonnées normalisées (x, y, w, h)',
		usage: '{{ boundingBox 0.5 0.5 1 1 }} -> \'{"x":0.5,"y":0.5,"w":1,"h":1}\'',
		/**
		 * @param {number} x
		 * @param {number} y
		 * @param {number} w
		 * @param {number} h
		 */
		implementation: (x, y, w, h) => {
			return safeJSONStringify({ x, y, w, h });
		}
	}
};

for (const [name, { implementation }] of Object.entries(HANDLEBARS_HELPERS)) {
	Handlebars.registerHelper(name, implementation);
}

/**
 * @template {import("arktype").Type} T
 * @template {any} [O=string]
 * @param {T} Input
 * @param {(output: string) => O} [postprocess]
 */
export const TemplatedString = (Input, postprocess) =>
	type.string.pipe((t) => {
		try {
			const compiled = Handlebars.compile(t, {
				noEscape: true,
				assumeObjects: true,
				knownHelpersOnly: true,
				knownHelpers: mapValues(HANDLEBARS_HELPERS, () => true)
			});

			return {
				toJSON: () => t,
				/**
				 * @param {T["inferIn"]} data
				 * @returns {O}
				 */
				render(data) {
					const rendered = compiled(Input.assert(data));
					// @ts-ignore
					return postprocess ? postprocess(rendered) : rendered;
				}
			};
		} catch (cause) {
			throw new Error(`Invalid template ${safeJSONStringify(t)}`, { cause });
		}
	});

/**
 * @template {import("arktype").Type} T
 * @param {T} Input
 */
export const FilepathTemplate = (Input) =>
	TemplatedString(Input, (path) => path.replaceAll('\\', '/'));
