import { type } from 'arktype';

import { clamp, cleanFilepath, safeJSONStringify } from '../utils.js';
import { TemplatedString } from './expressions.js';

export const ID = type(/^[\w._-]+$/);

export const ProtocolID = type(/[\w.-]+/).describe(
	'Identifiant unique pour un protocole. On conseille de mettre une partie qui vous identifie dans cet identifiant, car il doit être globalement unique. Par exemple, fr.sete-moulis-cnrs.mon-protocole si vous contrôler le nom de domain sete-moulis.cnrs.fr'
);

export const NamespacedMetadataID = type('/^([\\w.-]+)__([\\w._-]+)$/').describe(
	'Identifiant de métadonnée avec namespace, sous la forme "protocolId__metadataId"'
);

/**
 * @template {string} [P=string]
 * @typedef {`${P}__${string}`} NamespacedMetadataID
 */

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

/**
 * @template {import("arktype").Type} T
 * @param {T} Input
 */
export const FilepathTemplate = (Input) => TemplatedString(Input, cleanFilepath);

export const MIMEType = type(
	/^(application|audio|font|example|image|message|model|multipart|text|video|x-\w+)\/\w+$/
);

/**
 * Describes valid values of `<input type=file>`'s "accept" list
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file#unique_file_type_specifiers
 */
export const UniqueFileTypeSpecifier = type.or(
	[/^\..+$/, '@', 'Une extension de fichier'],
	[MIMEType, '@', 'Un type MIME'],
	['"audio/*"', '@', 'Un fichier audio'],
	['"video/*"', '@', 'Un fichier vidéo'],
	['"image/*"', '@', 'Un fichier image']
);

// XXX: Most JSON schema integrations don't support named capture groups...
const FILE_SIZE_PATTERN =
	// /^\s*(?<amount>\d+(\.\d+)?)\s+(?<prefix>[kMGTP])(?<binary>i?)(?<unit>[oBb])\s*$/i;
	/^\s*(\d+(?:[.,]\d+)?)\s+([kMGTP]?)(i?)([oBb])\s*$/i;

/**
 * Parse a human-readable file size (e.g. "2.5 MB") into a number of bytes
 */
export const FileSize = type('number')
	.describe('Une taille de fichier exprimée en octets')
	.or(
		type(FILE_SIZE_PATTERN)
			.pipe.try((literal) => {
				const match = literal.match(FILE_SIZE_PATTERN);
				if (!match) throw new Error(`Invalid file size: ${literal}`);

				const [_, amountString, prefix, binary, unit] = match;

				let amount = Number.parseFloat(amountString.replace(',', '.'));
				if (Number.isNaN(amount))
					throw new Error(`Invalid file size amount: ${amountString} is ${amount}`);

				const power = {
					'': 0,
					K: 3,
					M: 6,
					G: 9,
					T: 12,
					P: 15
				}[prefix.toUpperCase()];

				const base = binary ? 2 : 10;

				amount *= Math.pow(base, power ?? 0);

				if (unit === 'b') {
					amount /= 8;
				}

				return amount;
			})
			.describe(
				"Une taille de fichier sous une forme plus lisible comme '2.5 MB' (les suffixes k, M, G, T et P sont supportés, avec une base 10 ou 2 selon la présence du suffixe 'i', et les unités 'B'/'o' ou 'b' sont supportées pour indiquer si le nombre donné est en bits ou en octets)"
			)
	);

/**
 * @template {import("arktype").Type} K
 * @template {import("arktype").Type} V
 * @param {K} k
 * @param {V} v
 */
export const SingleEntryRecord = (k, v) =>
	type('Record<string, unknown>').pipe.try((obj) => {
		const entries = Object.entries(obj);
		if (entries.length !== 1) {
			throw new Error(
				`Expected an object with a single entry, but got ${entries.length} entries: ${safeJSONStringify(obj)}`
			);
		}
		const [key, value] = entries[0];
		return { key: k.assert(key), value: v.assert(value) };
	});
