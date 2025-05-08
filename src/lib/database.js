import { type } from 'arktype';
import { HTTPRequest, ID, ModelInput, Probability, References } from './schemas/common.js';
import {
	EXIFField,
	MetadataEnumVariant,
	MetadataInferOptions,
	MetadataMergeMethod,
	Metadata as MetadataSchema,
	MetadataType,
	MetadataValue,
	MetadataValues
} from './schemas/metadata.js';
import { FilepathTemplate, Protocol as ProtocolSchema } from './schemas/protocols.js';

const Dimensions = type({
	width: 'number > 0',
	height: 'number > 0'
}).pipe(({ width, height }) => ({
	width,
	height,
	aspectRatio: width / height
}));

const ImageFile = table(
	['id'],
	type({
		/** ID of the associated Image object */
		id: ID,
		bytes: 'ArrayBuffer',
		filename: 'string',
		contentType: /\w+\/\w+/,
		dimensions: Dimensions
	})
);

const ImagePreviewFile = table(
	['id'],
	type({
		/** ID of the associated Image object */
		id: ID,
		bytes: 'ArrayBuffer',
		filename: 'string',
		contentType: /\w+\/\w+/,
		dimensions: Dimensions
	})
);

const Image = table(
	['id', 'addedAt'],
	type({
		id: /\d+(_\d+)*/,
		filename: 'string',
		addedAt: 'string.date.iso.parse',
		dimensions: Dimensions,
		metadata: MetadataValues,
		contentType: /\w+\/\w+/,
		fileId: ID.or('null').describe("ID vers l'objet ImageFile associé"),
		/** Si les boîtes englobantes ont été analysées. Pratique en particulier pour savoir s'il faut calculer les boîtes englobantes pour une image qui n'a aucune observation associée (chaque boudingbox crée une observation) */
		boundingBoxesAnalyzed: 'boolean = false'
	})
);

const Observation = table(
	['id', 'addedAt'],
	type({
		id: ID,
		label: 'string',
		addedAt: 'string.date.iso.parse',
		metadataOverrides: MetadataValues,
		images: References
	})
);

const Metadata = table('id', MetadataSchema);
const Protocol = table('id', ProtocolSchema);

const Settings = table(
	'id',
	type({
		id: '"defaults" | "user"',
		protocols: References,
		theme: type.enumerated('dark', 'light', 'auto'),
		gridSize: 'number',
		language: type.enumerated('fr'),
		showInputHints: 'boolean',
		showTechnicalMetadata: 'boolean',
		cropAutoNext: 'boolean = false'
	})
);

export const Schemas = {
	ID,
	FilepathTemplate,
	Probability,
	MetadataValues,
	MetadataValue,
	Image,
	ModelInput,
	Observation,
	MetadataInferOptions,
	MetadataType,
	MetadataMergeMethod,
	MetadataEnumVariant,
	Metadata,
	Protocol,
	Settings,
	EXIFField,
	HTTPRequest
};

export const NO_REACTIVE_STATE_TABLES = /** @type {const} */ (['ImageFile', 'ImagePreviewFile']);

/**
 *
 * @template {keyof typeof Tables} TableName
 * @param {TableName} name
 * @returns {name is Exclude<TableName, typeof NO_REACTIVE_STATE_TABLES[number]>}
 */
export function isReactiveTable(name) {
	return NO_REACTIVE_STATE_TABLES.every((n) => n !== name);
}

export const Tables = {
	Image,
	ImageFile,
	ImagePreviewFile,
	Observation,
	Metadata,
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
 * @typedef  Image
 * @type {typeof Image.infer}
 */

/**
 * @typedef  Observation
 * @type {typeof Observation.infer}
 */

/**
 * @typedef  MetadataType
 * @type {typeof MetadataType.infer}
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
 * @import { ModelDetectionOutputShape } from './schemas/protocols.js'
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
