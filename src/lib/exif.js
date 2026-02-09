import { match, type } from 'arktype';
import * as dates from 'date-fns';
import * as exifParser from 'exif-parser';
import piexif from 'piexifjs';

import { Schemas } from './database.js';
import { EXIF_GPS_FIELDS } from './exiffields.js';
import * as db from './idb.svelte.js';
import { storeMetadataValue } from './metadata/index.js';
import { ensureNamespacedMetadataId } from './schemas/metadata.js';
import { toasts } from './toasts.svelte.js';

/**
 * @import { MetadataInferOptions, MetadataType } from './database.js';
 * @import { RuntimeValue } from './metadata/index.js';
 */

/**
 *
 * @param {string} sessionId
 * @param {string} imageFileId
 * @param {ArrayBuffer|Buffer} imageBytes
 * @param {{ type: string; name: string }} file
 */
export async function processExifData(sessionId, imageFileId, imageBytes, file) {
	const session = await db.tables.Session.get(sessionId);
	if (!session) {
		throw new Error(`Session ${sessionId} introuvable`);
	}

	const protocol = await db.tables.Protocol.get(session.protocol);
	if (!protocol) {
		throw new Error(`Protocole ${session.protocol} introuvable`);
	}
	const metadataOfProtocol = await db.tables.Metadata.list().then((defs) =>
		defs.filter((def) => protocol.metadata.includes(def.id))
	);
	const metadataFromExif = await extractMetadata(
		// 2^16 + 100 of margin
		// see https://www.npmjs.com/package/exif-parser#creating-a-parser
		imageBytes.slice(0, 65_635),
		(metadataOfProtocol ?? [])
			.map(({ infer, type, id }) =>
				match
					.case(
						[
							{ exif: 'string' },
							'|',
							{ latitude: { exif: 'string' }, longitude: { exif: 'string' } }
						],
						(infer) => /** @type {ExifExtractionPlanItem} */ ({ key: id, infer, type })
					)
					.default(() => undefined)(infer)
			)
			.filter((entry) => entry !== undefined)
	).catch((e) => {
		console.warn(e);
		if (file.type === 'image/jpeg') {
			toasts.warn(
				`Impossible d'extraire les métadonnées EXIF de ${file.name}: ${e?.toString() ?? 'Erreur inattendue'}`
			);
		}
		return {};
	});

	const images = await db
		.list('Image')
		.then((imgs) => imgs.filter((img) => img.fileId === imageFileId));

	for (const { id: subjectId } of images) {
		for (const [key, { value, confidence }] of Object.entries(metadataFromExif)) {
			await storeMetadataValue({
				db: db.databaseHandle(),
				subjectId,
				sessionId: session.id,
				metadataId: ensureNamespacedMetadataId(key, protocol.id),
				value,
				confidence
			});
		}
	}
}

/**
 * @typedef {object} ExifExtractionPlanItem
 * @property {string} key key in the output object
 * @property {MetadataInferOptions | { latitude: MetadataInferOptions, longitude: MetadataInferOptions }} infer how to extract the value
 * @property {MetadataType} type type to coerce the extracted value to
 */

/**
 * @param {ArrayBuffer | Buffer} buffer buffer of the image to extract EXIF data from
 * @param {ExifExtractionPlanItem[]} extractionPlan
 * @returns {Promise<Record<string, { value: unknown; confidence: number; alternatives: Record<string, unknown> }>>}
 */
export async function extractMetadata(buffer, extractionPlan) {
	const exif = exifParser.create(buffer).enableImageSize(false).parse();

	if (!exif) return {};
	console.debug('Starting EXIF Extraction', { extractionPlan, exif });

	const extract = match
		.case(
			{
				type: '"location"',
				infer: {
					latitude: { exif: 'string' },
					longitude: { exif: 'string' }
				}
			},
			({ infer }) => {
				if (!(infer.longitude.exif in exif.tags)) return undefined;
				if (!(infer.latitude.exif in exif.tags)) return undefined;

				return {
					confidence: 1,
					alternatives: {},
					value: {
						longitude: coerceExifValue(exif.tags[infer.longitude.exif], 'float'),
						latitude: coerceExifValue(exif.tags[infer.latitude.exif], 'float')
					}
				};
			}
		)
		.case(
			{
				type: Schemas.MetadataTypeSchema,
				infer: { exif: 'string' }
			},
			({ infer, type }) => {
				if (!(infer.exif in exif.tags)) return undefined;

				return {
					confidence: 1,
					alternatives: {},
					value: coerceExifValue(exif.tags[infer.exif], type)
				};
			}
		)
		.default(() => undefined);

	return Object.fromEntries(
		extractionPlan
			.map(({ key: id, ...option }) => {
				return /** @type {const} */ ([id, extract(option)]);
			})
			.filter(
				([, extracted]) =>
					extracted !== undefined &&
					!type({ latitude: 'number.NaN', longitude: 'number.NaN' }).allows(
						extracted.value
					) &&
					!Number.isNaN(extracted.value)
			)
	);
}

/**
 *
 * @template {import('./database.js').MetadataType} T
 * @param {unknown} value
 * @param {T} coerceTo
 * @returns {import('./metadata/index.js').RuntimeValue<T>}
 */
export function coerceExifValue(value, coerceTo) {
	switch (coerceTo) {
		case 'string':
			return value?.toString() ?? '';

		case 'boolean':
			return Boolean(value);

		case 'date':
			if (typeof value !== 'number') throw new Error('Date value must be a number');
			if (Number.isNaN(value)) throw new Error('Date value is invalid');
			return new Date(value * 1e3);

		case 'boundingbox':
			throw new Error('Bounding box not supported in EXIF');

		case 'enum':
			if (typeof value !== 'string') throw new Error('Enum value must be a string');
			return value;

		case 'integer':
		case 'float':
			return Number(value);

		default:
			throw new Error(`Unknown type ${coerceTo}`);
	}
}

/**
 * Serialize a value to a string for EXIF writing
 * @param {unknown} value
 * @returns {string|any[]}
 */
export function serializeExifValue(value) {
	if (value instanceof Date) return dates.format(value, 'yyyy:MM:dd HH:mm:ss');
	// Let multivalued exif entries through
	if (Array.isArray(value)) return value;
	if (value === undefined) return 'undefined';
	if (value === null) return 'null';
	if (typeof value === 'object' && value !== null) {
		return Object.entries(value)
			.map(([key, val]) => `${key}=${val}`)
			.join(';');
	}
	return value?.toString() ?? '';
}

/**
 * Append EXIF metadata to the image's bytes
 * @param {ArrayBuffer|Buffer} bytes
 * @param {import('./database.js').Metadata[]} metadataDefs
 * @param {import('./database.js').MetadataValues} metadataValues
 * @returns {Uint8Array} the image with EXIF metadata added
 */
export function addExifMetadata(bytes, metadataDefs, metadataValues) {
	const ExifMetadata = Schemas.Metadata.and({
		infer: [
			{ exif: 'string' },
			'|',
			{ latitude: { exif: 'string' }, longitude: { exif: 'string' } }
		]
	});

	const exifDict = { GPS: {}, Exif: {} };
	const setExifKey = (key, value) => {
		// @wc-ignore
		const category = Object.keys(EXIF_GPS_FIELDS).includes(key) ? 'GPS' : 'Exif';
		const serialized = serializeExifValue(value);
		if (serialized === undefined) return;
		exifDict[category][piexif[`${category}IFD`][key]] = serialized;
	};

	for (const def of metadataDefs.map((m) => ExifMetadata(m))) {
		if (def instanceof type.errors) continue;
		const value = metadataValues[def.id]?.value;
		if (value === undefined) continue;

		if (
			type({ latitude: { exif: 'string' }, longitude: { exif: 'string' } }).allows(
				def.infer
			) &&
			type({ latitude: 'number', longitude: 'number' }).allows(value)
		) {
			// XXX harcoded BS :/
			if (def.infer.latitude.exif === 'GPSLatitude') {
				setExifKey('GPSLatitudeRef', value.latitude >= 0 ? 'N' : 'S');
				setExifKey('GPSLatitude', piexif.GPSHelper.degToDmsRational(value.latitude));
			} else {
				setExifKey(def.infer.latitude.exif, value.latitude);
			}

			// XXX harcoded BS :/
			if (def.infer.longitude.exif === 'GPSLongitude') {
				setExifKey('GPSLongitudeRef', value.longitude >= 0 ? 'E' : 'W');
				setExifKey('GPSLongitude', piexif.GPSHelper.degToDmsRational(value.longitude));
			} else {
				setExifKey(def.infer.longitude.exif, value.longitude);
			}
		} else {
			setExifKey(def.infer.exif, value);
		}
	}

	// Piexif wants bytes _as a string_. why??? idk. but it seems like npm has no decent EXIF libraries that both support browsers and writing exif data.
	let bytesstr = '';
	// Build bytesstr in chunks, since String.fromCharCode is limited in characters size (see https://stackoverflow.com/q/76857530 and https://stackoverflow.com/a/22747272)
	let chunksize = 32_000;
	for (let i = 0; i < bytes.byteLength; i += chunksize) {
		const chunk = bytes.slice(i, i + chunksize);
		bytesstr += String.fromCharCode(...new Uint8Array(chunk));
	}
	const outputstr = piexif.insert(piexif.dump(exifDict), bytesstr);
	return new Uint8Array(Array.from(outputstr).map((c) => c.charCodeAt(0)));
}
