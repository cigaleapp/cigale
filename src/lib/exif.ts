import type * as DB from './database.js';
import type { ExifFieldKey } from './exiffields.js';
import type { NamespacedMetadataID } from './schemas/common.js';
import type { RuntimeValue } from './schemas/metadata.js';

import { type } from 'arktype';
import * as dates from 'date-fns';
import * as exifParser from 'exif-parser';
import piexif from 'piexifjs';

import { Schemas } from './database.js';
import { SANE_ISO_DATE_FORMATS, tryParseDate } from './date.js';
import { EXIF_FIELDS, exifParserKeyToRealKey } from './exiffields.js';
import {
	geolocationAccuracyFromMake,
	geolocationAccuracyToConfidence,
	gpsDilutionOfPrecisionToConfidence,
} from './geolocation.js';
import { errorMessage } from './i18n.js';
import * as db from './idb.svelte.js';
import { resolveMetadataImport, storeMetadataValue } from './metadata/index.js';
import { toasts } from './toasts.svelte.js';
import { byteString, byteStringToArray, throwError, transformObject } from './utils.js';

export async function processExifData({
	sessionId,
	imageFileId,
	imageBytes,
	file,
	extra,
}: {
	sessionId: string;
	imageFileId: string;
	imageBytes: ArrayBuffer | Buffer;
	file: { type: string; name: string };
	extra?: { [K in ExifFieldKey]?: unknown };
}) {
	const session = await db.tables.Session.get(sessionId);
	if (!session) {
		throw new Error(`Session ${sessionId} introuvable`);
	}

	const protocol = await db.tables.Protocol.get(session.protocol);
	if (!protocol) {
		throw new Error(`Protocole ${session.protocol} introuvable`);
	}
	const metadataOfProtocol = await db.tables.Metadata.getMany(
		protocol.metadata.map((key) => resolveMetadataImport(protocol, key))
	);

	const metadataFromExif = {} as Record<NamespacedMetadataID, DB.MetadataValue>;

	try {
		const fields = {
			...extra,
			...(await parseExif(imageBytes, file.type)),
		};

		console.debug('Processing EXIF fields', fields);

		for (const def of metadataOfProtocol ?? []) {
			if (!def.infer) continue;

			let coerced: RuntimeValue | undefined;
			let confidence = 1;

			if (def.type === 'location') {
				if (!def.infer.longitude?.exif) continue;
				if (!def.infer.latitude?.exif) continue;

				const lngref = `${def.infer.longitude.exif}Ref` as const;
				const latref = `${def.infer.latitude.exif}Ref` as const;

				coerced = coerceExifValue('location', {
					longitude: fields[def.infer.longitude.exif],
					longitudeRef: lngref in fields ? fields[lngref as ExifFieldKey] : undefined,
					latitude: fields[def.infer.latitude.exif],
					latitudeRef: latref in fields ? fields[latref as ExifFieldKey] : undefined,
				});

				// TODO: could also work with other GPS-related keys, such as GPSDest*
				if (
					def.infer.longitude.exif === 'GPSLongitude' &&
					def.infer.latitude.exif === 'GPSLatitude'
				) {
					const dop = coerceExifValue('float', fields.GPSDOP);
					const herr =
						coerceExifValue('float', fields.GPSHPositioningError) ??
						geolocationAccuracyFromMake(coerceExifValue('string', fields.Make));

					confidence = Math.min(
						herr !== undefined ? geolocationAccuracyToConfidence(herr) : 1,
						dop !== undefined ? gpsDilutionOfPrecisionToConfidence(dop) : 1
					);
				}

				if (!coerced) {
					console.warn(
						`Couldn't coerce EXIF fields to ${def.type}:`,
						def.infer.longitude.exif,
						'=',
						fields[def.infer.longitude.exif],
						def.infer.latitude.exif,
						'=',
						fields[def.infer.latitude.exif]
					);
				}
			} else {
				if (!('exif' in def.infer)) continue;
				if (!def.infer.exif) continue;

				coerced = coerceExifValue(def.type, fields[def.infer.exif]);

				if (!coerced) {
					console.warn(
						`Couldn't coerce EXIF field(s) to ${def.type}:`,
						def.infer.exif,
						'=',
						fields[def.infer.exif]
					);
				}
			}

			if (!coerced) continue;

			metadataFromExif[def.id] = {
				confidence,
				alternatives: [],
				value: coerced,
				confirmed: false,
				manuallyModified: false,
				isDefault: false,
				confidences: {},
			};
		}
	} catch (e) {
		console.warn(e);
		if (file.type === 'image/jpeg') {
			toasts.warn(
				`Impossible d'extraire les métadonnées EXIF de ${file.name}: ${e?.toString() ?? 'Erreur inattendue'}`
			);
		}
		return {};
	}

	const images = await db
		.listByIndex('Image', 'sessionId', sessionId)
		.then((imgs) => imgs.filter((img) => img.fileId === imageFileId));

	for (const { id: subjectId } of images) {
		for (const [key, { value, confidence }] of Object.entries(metadataFromExif)) {
			await storeMetadataValue({
				db: db.databaseHandle(),
				subjectId,
				sessionId: session.id,
				metadataId: key,
				value,
				confidence,
			});
		}
	}
}

async function parseExif(buffer: ArrayBuffer | Buffer, contentType: string) {
	if (contentType !== 'image/jpeg') return;

	const exif = exifParser
		.create(
			// 2^16 + 100 of margin
			// see https://www.npmjs.com/package/exif-parser#creating-a-parser
			buffer.slice(0, 2 ** 16 + 100)
		)
		.enableImageSize(false)
		.parse();

	console.debug('Finished parsing EXIF data from bytes', exif);

	return transformObject(exif.tags, (key, value) => {
		try {
			return [exifParserKeyToRealKey(key), value];
		} catch (e) {
			console.warn(
				`Couldn't translate exif-parser field ${key} to a standard EXIF field:`,
				e
			);
			return undefined;
		}
	});
}

export function coerceExifValue<T extends DB.MetadataType>(
	coerceTo: T,
	value: unknown
): import('./schemas/metadata.js').RuntimeValue<T> | undefined {
	if (value === undefined) return undefined;
	if (value === null) return undefined;

	switch (coerceTo) {
		case 'string':
			return value?.toString() ?? '';

		case 'boolean':
			return Boolean(value);

		case 'date':
			if (value instanceof Date) return value;

			if (typeof value === 'string') {
				return (
					tryParseDate(
						value,
						...SANE_ISO_DATE_FORMATS,
						// EXIF also has some weird date format standards
						'yyyy:MM:dd HH:mm:SS',
						'yyyy:MM:dd'
					) ?? throwError('Date format is invalid')
				);
			}

			if (typeof value !== 'number') {
				throw new Error(
					`Unexpected type ${typeof value} for a date, cannot coerce exif value`
				);
			}

			if (Number.isNaN(value)) throw new Error('Date value is invalid');

			return new Date(value * 1e3);

		case 'boundingbox':
			throw new Error('Bounding box not supported in EXIF');

		case 'enum':
			if (typeof value !== 'string') throw new Error('Enum value must be a string');
			return value;

		case 'integer':
		case 'float': {
			if (type(['number', 'number']).array().allows(value)) {
				const [[num, denom]] = value;
				return num / denom;
			}

			return Number(value);
		}

		case 'location': {
			if (!value) return;
			if (typeof value !== 'object') return;
			if (!('longitude' in value)) return;
			if (!('latitude' in value)) return;

			function coerceCoordinate(coord: unknown, ref: unknown, refFallback: string) {
				if (type(['number', 'number']).array().allows(coord)) {
					return piexif.GPSHelper.dmsRationalToDeg(
						coord,
						typeof ref === 'string' ? ref : refFallback
					);
				}

				return coerceExifValue('float', coord);
			}

			const lng = coerceCoordinate(value.longitude, value.longitudeRef, 'E');
			const lat = coerceCoordinate(value.latitude, value.latitudeRef, 'N');

			if (!lng || !lat) return;

			return { longitude: lng, latitude: lat };
		}

		default:
			throw new Error(`Unknown type ${coerceTo}`);
	}
}

/**
 * Serialize a value to a string for EXIF writing
 */
export function serializeExifValue(value: unknown): string | unknown[] {
	if (value instanceof Date) return dates.format(value, 'yyyy:MM:dd HH:mm:ss');
	// Let multivalued exif entries through
	if (Array.isArray(value)) return value;
	if (typeof value === 'number') return [value];
	if (value === undefined) return 'undefined';
	if (value === null) return 'null';
	if (typeof value === 'object' && value !== null) {
		return Object.entries(value)
			.map(([key, val]) => `${key}=${val}`)
			.join(';');
	}
	return value?.toString() ?? '';
}

export function addExifMetadata(
	bytes: ArrayBuffer | Buffer,
	metadataDefs: DB.Metadata[],
	metadataValues: DB.MetadataValues
): Uint8Array {
	const ExifMetadata = Schemas.Metadata.and({
		infer: [
			{ exif: 'string' },
			'|',
			{ latitude: { exif: 'string' }, longitude: { exif: 'string' } },
		],
	});

	const changes: Partial<Record<ExifFieldKey, unknown>> = {};

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
				changes['GPSLatitudeRef'] = value.latitude >= 0 ? 'N' : 'S';
				changes['GPSLatitude'] = piexif.GPSHelper.degToDmsRational(value.latitude);
			} else {
				changes[def.infer.latitude.exif] = value.latitude;
			}

			// XXX harcoded BS :/
			if (def.infer.longitude.exif === 'GPSLongitude') {
				changes['GPSLongitudeRef'] = value.longitude >= 0 ? 'E' : 'W';
				changes['GPSLongitude'] = piexif.GPSHelper.degToDmsRational(value.longitude);
			} else {
				changes[def.infer.longitude.exif] = value.longitude;
			}
		} else {
			changes[def.infer.exif] = value;
		}
	}

	return setExifFields(bytes, changes);
}

export function setExifFields(bytes: ArrayBuffer, changes: Partial<Record<ExifFieldKey, unknown>>) {
	const bytestring = byteString(new Uint8Array(bytes));

	try {
		const exifDict = piexif.load(bytestring);

		// Prevent any write if no exif data changed
		let dirty = false;

		for (const [key, value] of Object.entries(changes)) {
			const field = EXIF_FIELDS[key];

			const [category] =
				Object.entries(exifDict).find(([, tags]) => tags && field in tags) ??
				Object.entries(piexif.TAGS).find(
					([cat, tags]) => cat !== 'Image' && field in tags
				) ??
				[];

			if (!category) continue;

			const serialized = serializeExifValue(value);
			if (serialized === undefined) continue;
			if (serialized === exifDict[category][field]) continue;
			exifDict[category][field] = serialized;
			dirty = true;
		}

		if (!dirty) return new Uint8Array(bytes);

		const outputstr = piexif.insert(piexif.dump(exifDict), bytestring);
		return byteStringToArray(outputstr);
	} catch (error) {
		toasts.warn(errorMessage(error, 'Impossible de modifier les données EXIF'));
		return new Uint8Array(buffer);
	}
}
