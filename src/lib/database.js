import { type } from 'arktype';

import { localeFromNavigator } from './i18n.js';
import {
	Dimensions,
	HTTPRequest,
	ID,
	ModelInput,
	Probability,
	References
} from './schemas/common.js';
import {
	EXIFField,
	MetadataEnumVariant,
	MetadataError,
	MetadataInferOptions,
	MetadataMergeMethod,
	Metadata as MetadataSchema,
	MetadataType as MetadataTypeSchema,
	MetadataValue,
	MetadataValues
} from './schemas/metadata.js';
import { Image as ImageSchema, Observation as ObservationSchema } from './schemas/observations.js';
import {
	FilepathTemplate,
	ModelDetectionOutputShape,
	Protocol as ProtocolSchema
} from './schemas/protocols.js';
import { Session as SessionSchema } from './schemas/sessions.js';
import { clamp } from './utils.js';

/**
 * Generate an ID for a given table
 * @param {keyof typeof Tables} table
 */
export function generateId(table) {
	return table.slice(0, 1).toLowerCase() + Math.random().toString(36).slice(2, 9);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('generateId', () => {
		const id1 = generateId('Protocol');
		const id2 = generateId('Image');
		const id3 = generateId('Observation');

		expect(id1.charAt(0)).toBe('p');
		expect(id2.charAt(0)).toBe('i');
		expect(id3.charAt(0)).toBe('o');

		expect(id1.length).toBe(8); // 1 + 7 random chars
		expect(id2.length).toBe(8);
		expect(id3.length).toBe(8);

		// Should be different each time
		expect(generateId('Protocol')).not.toBe(generateId('Protocol'));

		// Should only contain lowercase letters and digits (base36)
		expect(/^[a-z0-9]+$/.test(id1)).toBe(true);
		expect(/^[a-z0-9]+$/.test(id2)).toBe(true);
	});
}

const ImageFile = table(
	['id', 'sessionId'],
	type({
		/** ID of the associated Image object */
		id: ID,
		bytes: 'ArrayBuffer',
		filename: 'string',
		contentType: /\w+\/\w+/,
		dimensions: Dimensions,
		sessionId: ID
	})
);

const ImagePreviewFile = table(
	['id', 'sessionId'],
	type({
		/** ID of the associated Image object */
		id: ID,
		bytes: 'ArrayBuffer',
		filename: 'string',
		contentType: /\w+\/\w+/,
		dimensions: Dimensions,
		sessionId: ID
	})
);

const Image = table(['id', 'addedAt', 'sessionId'], ImageSchema);

const Observation = table(['id', 'addedAt', 'sessionId'], ObservationSchema);

const Session = table(['id'], SessionSchema);

const Metadata = table('id', MetadataSchema.omit('options'));
const MetadataOption = table(
	['id'],
	MetadataEnumVariant.and({
		id: [/\w+:\w+/, '@', 'ID of the form metadata_id:key'],
		metadataId: ID
	})
);
const Protocol = table('id', ProtocolSchema);

const Settings = table(
	'id',
	type({
		id: '"defaults" | "user"',
		protocols: References,
		theme: type.enumerated('dark', 'light', 'auto'),
		// TODO(2025-09-05): remove n===10 after a while
		gridSize: type.number.pipe((n) => (n === 10 ? 1 : clamp(n, 0.5, 2))),
		notifications: 'boolean | null = null',
		language: type.enumerated('fr', 'en').default(
			/** @type {() => 'fr' | 'en'} */
			() => {
				// TODO(2025-10-04): remove paraglide migration after a while

				try {
					const fromParaglide = localStorage.getItem('PARAGLIDE_LOCALE');

					if (fromParaglide === 'fr' || fromParaglide === 'en') {
						localStorage.removeItem('PARAGLIDE_LOCALE');
						return fromParaglide;
					}
				} catch (e) {
					// ReferenceError => localStorage not defined => not in browser => isok
					if (!(e instanceof ReferenceError))
						console.warn('Error migrating from PARAGLIDE_LOCALE ', e);
				}

				try {
					return localeFromNavigator();
				} catch (e) {
					console.warn('Error getting navigator.language, defaulting to fr', e);
					return 'fr';
				}
			}
		),
		showInputHints: 'boolean',
		showTechnicalMetadata: 'boolean',
		cropAutoNext: 'boolean = false',
		parallelism: type('number').default(() => {
			try {
				return Math.ceil(navigator.hardwareConcurrency / 3);
			} catch (e) {
				console.warn("Couldn't get navigator.hardwareConcurrency, defaulting to 1", e);
				return 1;
			}
		}),
		gallerySort: type({
			direction: type.enumerated('asc', 'desc'),
			key: type.enumerated('filename', 'date')
		})
			.configure({ deprecated: true })
			.default(() => ({
				direction: 'asc',
				key: 'date'
			})),
		autoUpdateProtocols: type('Record<string, boolean>').default(() => ({}))
	})
);

export const Schemas = {
	ID,
	FilepathTemplate,
	Probability,
	MetadataValues,
	MetadataValue,
	MetadataError,
	Image,
	ModelInput,
	ModelDetectionOutputShape,
	Observation,
	Session,
	MetadataInferOptions,
	MetadataTypeSchema,
	MetadataMergeMethod,
	MetadataEnumVariant,
	Metadata,
	Protocol,
	Settings,
	EXIFField,
	HTTPRequest
};

export const NO_REACTIVE_STATE_TABLES = /** @type {const} */ ([
	'ImageFile',
	'ImagePreviewFile',
	'MetadataOption'
]);

const SESSION_DEPENDENT_REACTIVE_TABLES = /** @type {const} */ (['Image', 'Observation']);

/**
 *
 * @template {keyof typeof Tables} TableName
 * @param {TableName} name
 * @returns {name is Exclude<TableName, typeof NO_REACTIVE_STATE_TABLES[number]>}
 */
export function isReactiveTable(name) {
	return NO_REACTIVE_STATE_TABLES.every((n) => n !== name);
}

/**
 * @template {keyof typeof Tables} TableName
 * @param {TableName} name
 * @returns {name is typeof SESSION_DEPENDENT_REACTIVE_TABLES[number]}
 */
export function isSessionDependentReactiveTable(name) {
	return SESSION_DEPENDENT_REACTIVE_TABLES.some((n) => n === name);
}

export const Tables = {
	Image,
	ImageFile,
	ImagePreviewFile,
	Observation,
	Session,
	Metadata,
	MetadataOption,
	Protocol,
	Settings
};

/**
 *
 * @param {string|string[]} keyPaths expanded to an array.
 * Every element is an index to be created.
 * Indexes are dot-joined paths to keys in the objects.
 * First index is given as the keyPath argument when creating the object store instead.
 * @param {Schema} schema
 * @template {import('arktype').Type} Schema
 * @returns
 */
function table(keyPaths, schema) {
	const expandedKeyPaths = Array.isArray(keyPaths)
		? keyPaths.map((keyPath) => keyPath)
		: [keyPaths];

	return schema.configure({ table: { indexes: expandedKeyPaths } });
}

/**
 * Returns a comparator to sort objects by their id property
 * If both IDs are numeric, they are compared numerically even if they are strings
 * @template {{id: string|number} | string | number} IdOrObject
 * @param {IdOrObject} a
 * @param {IdOrObject} b
 * @returns {number}
 */
export const idComparator = (a, b) => {
	// @ts-ignore
	if (typeof a === 'object' && 'id' in a) return idComparator(a.id, b.id);
	// @ts-ignore
	if (typeof b === 'object' && 'id' in b) return idComparator(a.id, b.id);

	if (typeof a === 'number' && typeof b === 'number') return a - b;

	if (typeof a === 'number') return -1;
	if (typeof b === 'number') return 1;

	if (/^\d+$/.test(a) && /^\d+$/.test(b)) return Number(a) - Number(b);
	return a.localeCompare(b);
};

/**
 * @typedef  ID
 * @type {typeof ID.infer}
 */

/**
 * @typedef  Probability
 * @type {typeof Probability.infer}
 */

/**
 * @typedef  MetadataValue
 * @type {typeof MetadataValue.infer}
 */

/**
 * @typedef  MetadataValues
 * @type {typeof MetadataValues.infer}
 */

/**
 * @typedef MetadataError
 * @type {typeof MetadataError.infer}
 */

/**
 * @typedef  Image
 * @type {typeof Image.infer}
 */

/**
 * @typedef  Observation
 * @type {typeof Observation.infer}
 */

/**
 * @typedef  Session
 * @type {typeof Session.infer}
 */

/**
 * @typedef  MetadataType
 * @type {typeof MetadataTypeSchema.infer}
 */

/**
 * @typedef  MetadataMergeMethod
 * @type {typeof MetadataMergeMethod.infer}
 */

/**
 * @typedef  MetadataEnumVariant
 * @type {typeof MetadataEnumVariant.infer}
 */

/**
 * @typedef  Metadata
 * @type {typeof Metadata.infer}
 */

/**
 * @typedef  Protocol
 * @type {typeof Protocol.infer}
 */

/**
 * @typedef  ModelInput
 * @type {typeof ModelInput.infer}
 */

/**
 * @typedef  ModelDetectionOutputShape
 * @type {typeof ModelDetectionOutputShape.infer}
 */

/**
 * @typedef  Settings
 * @type {typeof Settings.infer}
 */

/**
 * @typedef  HTTPRequest
 * @type {typeof HTTPRequest.infer}
 */

/**
 * @typedef EXIFField
 * @type {typeof EXIFField.infer}
 */

/**
 * @typedef MetadataInferOptions
 * @type {typeof MetadataInferOptions.infer}
 */

/**
 * @typedef ImageFile
 * @type {typeof ImageFile.infer}
 */

/**
 * @typedef Dimensions
 * @type {typeof Dimensions.infer}
 *
 * @typedef DimensionsInput
 * @type {typeof Dimensions.inferIn}
 */
