import { match, type } from 'arktype';
import { format } from 'date-fns';
import * as exifParser from 'exif-parser';
import piexif from 'piexifjs';
import { Schemas } from './database.js';
import { EXIF_GPS_FIELDS } from './exiffields.js';
import * as db from './idb.svelte.js';
import { storeMetadataValue } from './metadata.js';
import { toasts } from './toasts.svelte.js';
import { matches } from './utils.js';

/**
 *
 * @param {string} protocolId
 * @param {string} imageId
 * @param {ArrayBuffer} imageBytes
 * @param {{ type: string; name: string }} file
 */
export async function processExifData(protocolId, imageId, imageBytes, file) {
	const protocol = await db.tables.Protocol.get(protocolId);
	if (!protocol) {
		throw new Error(`Protocole ${protocolId} introuvable`);
	}
	const metadataOfProtocol = await db.tables.Metadata.list().then((defs) =>
		defs.filter((def) => protocol.metadata.includes(def.id))
	);
	const metadataFromExif = await extractMetadata(
		imageBytes,
		(metadataOfProtocol ?? [])
			.map((m) =>
				match
					.case(
						{
							infer: [
								{ exif: 'string' },
								'|',
								{ latitude: { exif: 'string' }, longitude: { exif: 'string' } }
							]
						},
						({ infer }) => /** @type {const} */ ([m.id, infer, m.type])
					)
					.default(() => undefined)(m)
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

	await db.openTransaction(['Image', 'Observation'], {}, async (tx) => {
		for (const [key, { value, confidence }] of Object.entries(metadataFromExif)) {
			await storeMetadataValue({
				tx,
				subjectId: imageId,
				metadataId: key,
				value,
				confidence
			});
		}
	});
}

/**
 * @param {ArrayBuffer} buffer buffer of the image to extract EXIF data from
 * @param {Array<readonly [string, import('./database.js').MetadataInferOptions, import('./database.js').MetadataType]>} extractionPlan
 * @returns {Promise<Record<string, { value: unknown; confidence: number; alternatives: Record<string, unknown> }>>}
 */
export async function extractMetadata(buffer, extractionPlan) {
	const exif = exifParser.create(buffer).enableImageSize(false).parse();

	if (!exif) return {};
	console.log({ extractionPlan, exif });

	return Object.fromEntries(
		extractionPlan
			.map(([id, infer, type]) => {
				return /** @type {const} */ ([
					id,
					{
						value:
							type === 'location'
								? {
										longitude: coerceExifValue(exif.tags[infer.longitude.exif], 'float'),
										latitude: coerceExifValue(exif.tags[infer.latitude.exif], 'float')
									}
								: coerceExifValue(exif.tags[infer.exif], type),
						confidence: 1,
						alternatives: {}
					}
				]);
			})
			.filter(
				(entry) =>
					entry !== undefined &&
					!matches(entry[1].value, { latitude: 'number.NaN', longitude: 'number.NaN' }) &&
					!Number.isNaN(entry[1].value)
			)
	);
}

/**
 *
 * @template {import('./database.js').MetadataType} T
 * @param {unknown} value
 * @param {T} coerceTo
 * @returns {import('./metadata.js').RuntimeValue<T>}
 */
function coerceExifValue(value, coerceTo) {
	switch (coerceTo) {
		case 'string':
			return value?.toString() ?? '';

		case 'boolean':
			return Boolean(value);

		case 'date':
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

function serializeExifValue(value) {
	if (value instanceof Date) return format(value, 'yyyy:MM:dd HH:mm:ss');
	// Let mutlivalued exif entries through
	if (Array.isArray(value)) return value;
	if (typeof value === 'object' && value !== null) {
		return Object.entries(value)
			.map(([key, val]) => `${key}=${val}`)
			.join(';');
	}
	return value?.toString() ?? '';
}

/**
 * Append EXIF metadata to the image's bytes
 * @param {ArrayBuffer} bytes
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
			matches(def.infer, { latitude: { exif: 'string' }, longitude: { exif: 'string' } }) &&
			matches(value, { latitude: 'number', longitude: 'number' })
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
	const bytesstr = String.fromCharCode(...new Uint8Array(bytes));
	console.log(bytesstr);
	const outputstr = piexif.insert(piexif.dump(exifDict), bytesstr);
	console.log(outputstr);
	return new Uint8Array(Array.from(outputstr).map((c) => c.charCodeAt(0)));
}
