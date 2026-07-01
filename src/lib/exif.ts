import type * as DB from './database.js';
import type { ExifFieldKey } from './exiffields.js';

import { match, type } from 'arktype';
import * as dates from 'date-fns';
import * as exifParser from 'exif-parser';
import piexif from 'piexifjs';

import { Schemas } from './database.js';
import { EXIF_FIELDS } from './exiffields.js';
import * as db from './idb.svelte.js';
import { resolveMetadataImport, storeMetadataValue } from './metadata/index.js';
import { toasts } from './toasts.svelte.js';
import { byteString, byteStringToArray } from './utils.js';

export async function processExifData(
	sessionId: string,
	imageFileId: string,
	imageBytes: ArrayBuffer | Buffer,
	file: { type: string; name: string }
) {
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

	const metadataFromExif = await extractMetadata(
		// 2^16 + 100 of margin
		// see https://www.npmjs.com/package/exif-parser#creating-a-parser
		imageBytes.slice(0, 2 ** 16 + 100),
		metadataOfProtocol ?? []
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

type ExifExtractionPlanItem = Pick<DB.Metadata, 'id' | 'infer' | 'type'>;

export async function extractMetadata(
	buffer: ArrayBuffer | Buffer,
	extractionPlan: ExifExtractionPlanItem[]
): Promise<Record<string, { value: unknown; confidence: number; alternatives: unknown[] }>> {
	const exif = exifParser.create(buffer).enableImageSize(false).parse();

	if (!exif) return {};
	console.debug('Starting EXIF Extraction', { extractionPlan, exif });

	const extract = match
		.case(
			{
				type: '"location"',
				infer: {
					latitude: { exif: 'string' },
					longitude: { exif: 'string' },
				},
			},
			({ infer }) => {
				if (!(infer.longitude.exif in exif.tags)) return undefined;
				if (!(infer.latitude.exif in exif.tags)) return undefined;

				return {
					confidence: 1,
					alternatives: [],
					value: {
						longitude: coerceExifValue(exif.tags[infer.longitude.exif], 'float'),
						latitude: coerceExifValue(exif.tags[infer.latitude.exif], 'float'),
					},
				};
			}
		)
		.case(
			{
				type: Schemas.MetadataTypeSchema,
				infer: { exif: 'string' },
			},
			({ infer, type }) => {
				if (!(infer.exif in exif.tags)) return undefined;

				return {
					confidence: 1,
					alternatives: [],
					value: coerceExifValue(exif.tags[infer.exif], type),
				};
			}
		)
		.default(() => undefined);

	return Object.fromEntries(
		extractionPlan
			.map(({ id, ...option }) => {
				return /** @type {const} */ [id, extract(option)];
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

export function coerceExifValue<T extends DB.MetadataType>(
	value: unknown,
	coerceTo: T
): import('./schemas/metadata.js').RuntimeValue<T> {
	switch (coerceTo) {
		case 'string':
			return value?.toString() ?? '';

		case 'boolean':
			return Boolean(value);

		case 'date':
			if (value instanceof Date) return value;
			if (typeof value !== 'number')
				throw new Error(`Date value must be a number, was ${typeof value}`);
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

	const exifDict = piexif.load(bytestring);

	// Prevent any write if no exif data changed
	let dirty = false;

	for (const [key, value] of Object.entries(changes)) {
		const field = EXIF_FIELDS[key];

		const [category] =
			Object.entries(exifDict).find(([, tags]) => tags && field in tags) ??
			Object.entries(piexif.TAGS).find(([cat, tags]) => cat !== 'Image' && field in tags) ??
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
}
