/**
 * Computed expression templates: Handlebars and Jsonata
 */
import { ArkErrors, type } from 'arktype';
import { format as formatDate, formatISO, parse as parseDate } from 'date-fns';
import Handlebars from 'handlebars';
import jsonata from 'jsonata';

import {
	mapValues,
	safeJSONStringify,
	splitFilenameOnExtension,
	transformObject,
} from '../utils.js';

/**
 * @typedef {object} Helper
 * @property {string} documentation
 * @property {[string[], unknown]} usage [args, result]
 * @property {((...args: any[]) => any)} [implementation]
 * @property {((...args: any[]) => any)} [implementationHandlebars]
 * @property {((...args: any[]) => any)} [implementationJsonata]
 */

/**
 * @satisfies {Record<string, Helper>}
 */
export const HELPERS = /** @type {const} */ ({
	titlecase: {
		documentation:
			'Met la première lettre de chaque mot en majuscule et les autres en minuscules',
		usage: [["'some Test HERE!!'"], 'Some Test Here!!'],
		/**
		 * @param {string} subject
		 */
		implementation(subject) {
			return subject
				.split(/\s/)
				.map((word) => word.at(0)?.toUpperCase() + word.slice(1).toLowerCase())
				.join(' ');
		},
	},
	suffix: {
		documentation: "Ajoute un suffixe à un nom de fichier, avant l'extension",
		usage: [["'filename.jpeg'", "'_example'"], 'filename_example.jpeg'],
		/**
		 * @param {string} subject
		 * @param {string} suffix
		 */
		implementation(subject, suffix) {
			const [stem, ext] = splitFilenameOnExtension(subject);
			return `${stem}${suffix}.${ext}`;
		},
	},
	extension: {
		documentation: 'Récupère l’extension d’un nom de fichier',
		usage: [["'filename.jpeg'"], 'jpeg'],
		/**
		 * @param {string} subject
		 */
		implementation(subject) {
			return splitFilenameOnExtension(subject)[1];
		},
	},
	stem: {
		documentation: 'Récupère le nom d’un fichier sans son extension',
		usage: [["'filename.jpeg'"], 'filename'],
		/**
		 * @param {string} subject
		 */
		implementation(subject) {
			return splitFilenameOnExtension(subject)[0];
		},
	},
	fallback: {
		documentation: 'Fournit une valeur de repli si la première est indéfinie',
		usage: [['obj.does_not_exist', "'Unknown'"], 'Unknown'],
		/**
		 * @param {string} subject
		 * @param {string} fallback
		 */
		implementation(subject, fallback) {
			return subject ?? fallback;
		},
	},
	clamp: {
		documentation: 'Contraindre un nombre à une plage donnée',
		usage: [['101', '0', '100'], 100],
		/**
		 * @param {number} value
		 * @param {number} min
		 * @param {number} max
		 */
		implementation(value, min, max) {
			return Math.min(Math.max(value, min), max);
		},
	},
	trim: {
		documentation: 'Supprime les espaces au début et à la fin d’un texte',
		usage: [["'   some text   '"], 'some text'],
		/**
		 * @param {string} subject
		 */
		implementation(subject) {
			return subject.trim();
		},
	},
	percentage: {
		documentation:
			'Display a percentage string, with a optional number of decimals (default: 0)',
		usage: [['0.1236', '1'], '12.4%'],
		implementationHandlebars(...args) {
			args.pop(); // Remove Handlebars options argument

			const [value, decimals = 0] = args;

			return `${(value * 100).toFixed(decimals)}%`;
		},
		implementationJsonata(value, decimals = 0) {
			return `${(value * 100).toFixed(decimals)}%`;
		},
	},
	metadata: {
		documentation:
			"Récupère la valeur d'une métadonnée sur un subjet (une session, une observation ou une image) donnée. L'ID de la métadonnée peut ne pas comporter de namespace. Dans ce cas, le namespace correspondant au protocole courant est utilisé. Renvoie null si la métadonnée n'existe pas.",
		usage: [['session', "'transect_code'"], 'TR123'],
		/**
		 * @param {{ [ K in "protocolMetadata" | "metadata"]: import('$lib/database.js').MetadataValues } | { [ K in "metadataOverrides" | "protocolMetadataOverrides"]: import('$lib/database.js').MetadataValues }} subject
		 * @param {import('$lib/schemas/common.js').NamespacedMetadataID} metadataId
		 */
		implementation(subject, metadataId) {
			if ('metadata' in subject) {
				const record = subject.protocolMetadata ?? subject.metadata;
				if (metadataId in record) return record[metadataId]?.value;
				return null;
			}

			if ('metadataOverrides' in subject) {
				const record = subject.protocolMetadataOverrides ?? subject.metadataOverrides;
				if (metadataId in record) return record[metadataId]?.value;
				return null;
			}

			throw new Error('Subject must have either metadata or metadataOverrides property');
		},
	},
	now: {
		documentation: 'Renvoie la date actuelle au format ISO',
		usage: [[], '2026-12-31T23:59:00Z'],
		implementation() {
			return formatISO(new Date());
		},
	},
	year: {
		documentation: "Renvoie l’année d'une date sur 4 chiffres",
		usage: [["'2024-12-31'"], '2024'],
		/**
		 * @param {string} date
		 */
		implementation(date) {
			return formatDate(new Date(date), 'yyyy');
		},
	},
	month: {
		documentation: "Renvoie le mois d'une date sur 2 chiffres",
		usage: [["'2024-12-31'"], '12'],
		/**
		 * @param {string} date
		 */
		implementation(date) {
			return formatDate(new Date(date), 'MM');
		},
	},
	day: {
		documentation: "Renvoie le jour d'une date sur 2 chiffres",
		usage: [["'2024-12-31'"], '31'],
		/**
		 * @param {string} date
		 */
		implementation(date) {
			return formatDate(new Date(date), 'dd');
		},
	},
	hour: {
		documentation: "Renvoie l'heure d'une date sur 2 chiffres",
		usage: [["'2024-12-31T23:59'"], '23'],
		/**
		 * @param {string} date
		 */
		implementation(date) {
			return formatDate(new Date(date), 'HH');
		},
	},
	minute: {
		documentation: "Renvoie les minutes d'une date sur 2 chiffres",
		usage: [["'2024-12-31T23:59'"], '59'],
		/**
		 * @param {string} date
		 */
		implementation(date) {
			return formatDate(new Date(date), 'mm');
		},
	},
	second: {
		documentation: "Renvoie les secondes d'une date sur 2 chiffres",
		usage: [["'2024-12-31T23:59:01'"], '01'],
		/**
		 * @param {string} date
		 */
		implementation(date) {
			return formatDate(new Date(date), 'ss');
		},
	},
	json: {
		documentation: 'Sérialise une valeur en JSON',
		usage: [
			['{ "key": { "nested1": "value1", "nested2": "value2" } }', '2'],
			JSON.stringify({ key: { nested1: 'value1', nested2: 'value2' } }, null, 2),
		],
		/**
		 * @param {unknown} value
		 * @param {number | string | undefined} indentation
		 * @returns {string}
		 */
		implementationJsonata(value, indentation) {
			return JSON.stringify(value, null, indentation);
		},
	},
	slice: {
		documentation: "Prendre une partie d'une liste ou d'un texte",
		usage: [['"abcDEFgh"', '3', '6'], 'DEF'],
		/**
		 * @param {string | unknown[]} subject
		 * @param {number} start
		 * @param {number} stop
		 */
		implementation(subject, start, stop) {
			return subject.slice(start, stop);
		},
	},
	parseDate: {
		documentation: "Construire une date à partir d'un texte et d'un format",
		usage: [['"202508311121"', '"yyyyMMddHHmm"'], '2025-08-31T11:21:00.000Z'],
		/**
		 * @param {string} datestring
		 * @param {string} format
		 */
		implementation(datestring, format) {
			return parseDate(datestring, format, new Date()).toISOString();
		},
	},
	date: {
		documentation:
			"Construire une date à partir de ses composantes. il est possible d'omettre les noms des composantes si on les donne dans l'ordre descendant (year, ..., minutes). toutes les composantes sont optionelles à partir des heures (et valent 0 par défaut). Les dates sont interprétées localement (dans le fuseau horaire local) ",
		usage: [
			['year=2024', 'month=12', 'day=31', 'hours=23', 'minutes=58', 'seconds=1.5'],
			'2024-12-31T23:58:01.500Z',
		],
		implementationHandlebars(...args) {
			/** @type {{hash: { year?: number, month?: number, day?: number, hours?: number, minutes?: number, seconds?: number}}} */
			const { hash } = args.pop();

			const year = hash.year ?? args.shift();
			const month = hash.month ?? args.shift();
			const day = hash.day ?? args.shift();
			const hours = hash.hours ?? args.shift() ?? 0;
			const minutes = hash.minutes ?? args.shift() ?? 0;
			const seconds = hash.seconds ?? 0;

			return new Date(
				year,
				month - 1, // JavaScript 🥰
				day,
				hours ?? hash.hours ?? 0,
				minutes ?? hash.minutes ?? 0,
				Math.floor(seconds),
				Math.round((seconds - Math.floor(seconds)) * 1000)
			).toISOString();
		},
	},
	formatDate: {
		documentation: "Formatte une date à partir d'une date au format ISO",
		usage: [["'2024-01-10T02:03:04Z'", "'dd/MM/yyyy'"], '10/01/2024'],
		/**
		 * @param {string} datestring
		 * @param {string} format
		 */
		implementation(datestring, format) {
			return formatDate(new Date(datestring), format);
		},
	},
	object: {
		documentation:
			"Crée une représentation JSON d'un objet en prenant les paramètres comme paires clé-valeur",
		usage: [
			["key1='value1'", "key2='value2'"],
			JSON.stringify({ key2: 'value2', key1: 'value1' }),
		],
		/**
		 * @param {{hash: Record<string, unknown>}} options
		 */
		implementationHandlebars({ hash }) {
			return safeJSONStringify(hash);
		},
	},
	array: {
		documentation:
			"Crée une représentation JSON d'un tableau en prenant les paramètres comme éléments du tableau",
		usage: [
			['"value1"', '"value2"'],
			['value1', 'value2'],
		],
		implementationHandlebars(...args) {
			args.pop(); // Remove hash argument added by Handlebars
			return safeJSONStringify(args.filter((e) => e !== undefined));
		},
	},
	gps: {
		documentation:
			'Crée une représetation JSON des coordonnées GPS données (latitude puis longitude)',
		usage: [
			['42.957408', '1.0859884'],
			JSON.stringify({ latitude: 42.957408, longitude: 1.0859884 }),
		],
		/**
		 * @param {number} latitude
		 * @param {number} longitude
		 */
		implementation(latitude, longitude) {
			return safeJSONStringify({ latitude, longitude });
		},
	},
	boundingBox: {
		documentation:
			'Crée une représentation JSON d’une bounding box à partir de ses coordonnées normalisées (x, y, w, h)',
		usage: [['0.5', '0.5', '1', '1'], JSON.stringify({ x: 0.5, y: 0.5, w: 1, h: 1 })],
		/**
		 * @param {number} x
		 * @param {number} y
		 * @param {number} w
		 * @param {number} h
		 */
		implementation(x, y, w, h) {
			return safeJSONStringify({ x, y, w, h });
		},
	},
});

export const HANDLEBARS_HELPERS = transformObject(
	HELPERS,
	(name, { usage: [usageArgs, usageResult], ...rest }) => {
		if (!('implementationHandlebars' in rest || 'implementation' in rest)) return undefined;

		const impl =
			'implementationHandlebars' in rest
				? rest.implementationHandlebars
				: rest.implementation;

		return [
			name,
			{
				...rest,
				usageArgs,
				usageResult,
				implementation: impl,
				usage: `{{ ${name} ${usageArgs.join(' ')} }} -> ${safeJSONStringify(usageResult)}`,
			},
		];
	}
);

for (const [name, { implementation }] of Object.entries(HANDLEBARS_HELPERS)) {
	Handlebars.registerHelper(name, implementation);
}

const JSONATA_HELPERS = transformObject(
	HELPERS,
	(name, { usage: [usageArgs, usageResult], ...rest }) => {
		if (!('implementationJsonata' in rest || 'implementation' in rest)) return undefined;

		const impl =
			'implementationJsonata' in rest ? rest.implementationJsonata : rest.implementation;

		return [
			name,
			{
				...rest,
				usageArgs,
				usageResult,
				usage: `$${name}(${usageArgs.join(', ')}) -> ${safeJSONStringify(usageResult)}`,
				/**
				 *
				 * @param {import('jsonata').Focus} _this
				 * @param  {...any} args
				 */
				implementation: impl,
			},
		];
	}
);

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
				knownHelpers: mapValues(HANDLEBARS_HELPERS, () => true),
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
				},
			};
		} catch (cause) {
			throw new Error(`Invalid template ${safeJSONStringify(t)}`, { cause });
		}
	});

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe('Handlebars helpers', () => {
		for (const [name, { usageArgs, usageResult }] of Object.entries(HANDLEBARS_HELPERS)) {
			// We should try mocking new Date() maybe?
			if (name === 'now') continue;

			const call = `${name} ${usageArgs.join(' ')}`;

			test(call, () => {
				const result = TemplatedString(type({}))
					.assert(`{{ ${call} }}`)
					.render({
						obj: {},
						session: {
							protocolMetadata: { transect_code: { value: 'TR123' } },
							metadata: {},
						},
					});
				expect(result).toEqual(
					typeof usageResult === 'string' ? usageResult : safeJSONStringify(usageResult)
				);
			});
		}
	});
}

/**
 * @template {import("arktype").Type} I
 * @template {import("arktype").Type} O
 * @param {I} Input
 * @param {O} Output
 */
export const JsonataExpression = (Input, Output) =>
	type.string.pipe((t) => {
		try {
			const expr = jsonata(t);

			for (const [name, helper] of Object.entries(JSONATA_HELPERS)) {
				expr.registerFunction(name, helper.implementation);
			}

			return {
				toJSON: () => t,
				/**
				 * @param {Input['inferIn']}  data
				 * @param {Record<string, any>} [context] additional variables to set on the expression before evaluation
				 * @returns {Promise<Output['inferOut']>}
				 */
				async evaluate(data, context = {}) {
					for (const [key, value] of Object.entries(context)) {
						expr.assign(key, value);
					}

					const raw = await expr.evaluate(Input.assert(data));
					const out = Output(raw);

					if (out instanceof ArkErrors) {
						console.error(
							`Validation error on output of jsonata expression ${safeJSONStringify(t)}: ${out.summary}`,
							{ raw, out }
						);
						throw out;
					}

					return out;
				},
			};
		} catch (cause) {
			throw new Error(
				`Invalid Jsonata expression ${safeJSONStringify(t)}: ${cause.message}`,
				{ cause }
			);
		}
	});

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe('Jsonata helpers', () => {
		for (const [name, { usageArgs, usageResult }] of Object.entries(JSONATA_HELPERS)) {
			// We should try mocking new Date() maybe?
			if (name === 'now') continue;

			const call = `$${name}(${usageArgs.join(', ')})`;

			test(call, async () => {
				const expr = JsonataExpression(type({}), type('unknown')).assert(call);
				const result = await expr.evaluate({
					obj: {},
					session: {
						protocolMetadata: { transect_code: { value: 'TR123' } },
						metadata: {},
					},
				});
				expect(result).toEqual(usageResult);
			});
		}
	});
}
