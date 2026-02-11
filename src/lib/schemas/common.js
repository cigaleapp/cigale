import { type } from 'arktype';
import Handlebars from 'handlebars';

import { clamp, safeJSONStringify, splitFilenameOnExtension } from '../utils.js';

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

/**
 * @template {import("arktype").Type} T
 * @param {T} Input
 */
export const FilepathTemplate = (Input) =>
	TemplatedString(Input).pipe(({ render, toJSON }) => ({
		toJSON,
		/** @type {typeof render} */
		render: (data) => render(data).replaceAll('\\', '/')
	}));
