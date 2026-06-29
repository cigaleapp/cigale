import type * as DB from './database.js';
import type { MetadataType } from './database.js';
import type { ExifFieldKey } from './exiffields.js';
import type { NamespacedMetadataID } from './schemas/common.js';
import type { EXIFInference } from './schemas/metadata.js';
import type { Exiv2Metadata, Exiv2Module } from 'exiv2-wasm';

import { match, type } from 'arktype';
import * as dates from 'date-fns';
import  createExiv2Module  from 'exiv2-wasm/dist/exiv2.esm.js';

import { Schemas } from './database.js';
import { FIELDS } from './exiffields.js';
import { degToDmsString, dmsRationalToDeg } from './gps.js';
import * as db from './idb.svelte.js';
import { resolveMetadataImport } from './metadata/imports.js';
import { storeMetadataValue } from './metadata/index.js';
import { EXIFField } from './schemas/metadata.js';
import { toasts } from './toasts.svelte.js';
import { ensureArray, nonnull, transformObject } from './utils.js';

let exiv2: Exiv2Module;

type ExifData = { [K in ExifFieldKey]?: unknown };

function findExifFieldFromExiv2Key(exiv2key: keyof NonNullable<Exiv2Metadata['exif']>) {
	// "The second part of the Exiv2 key of an IFD1 tag is Thumbnail (instead of Image), the other two parts of the key are the same as for IFD0 tags"
	// See https://exiv2.org/tags.html

	let [, ifd, key] = exiv2key.split('.');
	if (ifd === 'Thumbnail') ifd = 'Image';

	return FIELDS.find((field) => field.ifd === ifd && field.key === key);
}

export async function extractExifData(imageBytes: ArrayBuffer): Promise<ExifData> {
	exiv2 ??= await createExiv2Module();

	const metadata = exiv2.read(new Uint8Array(imageBytes));

	console.debug('Extracted EXIF metadata:', metadata);

	console.log('orientation is', exiv2.readTagBytes(new Uint8Array(imageBytes), "Exif.Image.Orientation"))

	return transformObject(metadata.exif ?? {}, (key, value) => {
		const field = findExifFieldFromExiv2Key(key);
		return [
			field?.key ?? key.replace(/^Exif\./, ''),
			typeof value === 'string' ? value.trim() : value,
		];
	});
}

export async function eraseExifOrientation(imageBytes: ArrayBuffer): Promise<ArrayBuffer> {
	exiv2 ??= await createExiv2Module();

	const erased = exiv2.writeBytes(
		new Uint8Array(imageBytes),
		'Exif.Image.Orientation',
		new Uint8Array([1])
	);

	return erased.buffer as ArrayBuffer;
}

export async function processExifData({
	sessionId,
	imageFileId,
	file,
	exifData,
}: {
	sessionId: string;
	exifData: ExifData;
	imageFileId: string;
	file: { type: string; name: string };
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

	const metadataFromExif = await extractMetadata(
		exifData,
		(metadataOfProtocol ?? [])
			.map(({ infer, type, id }) =>
				match
					.case(
						[
							{ exif: EXIFField },
							'|',
							{ latitude: { exif: EXIFField }, longitude: { exif: EXIFField } },
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
		return [];
	});

	const images = await db
		.listByIndex('Image', 'sessionId', sessionId)
		.then((imgs) => imgs.filter((img) => img.fileId === imageFileId));

	for (const { id: subjectId } of images) {
		for (const { metadataId, value, confidence } of metadataFromExif) {
			await storeMetadataValue({
				db: db.databaseHandle(),
				sessionId: session.id,
				subjectId,
				metadataId,
				value,
				confidence,
			});
		}
	}
}

interface ExifExtractionPlanItem {
	key: NamespacedMetadataID;
	infer:
		| { exif: EXIFInference }
		| { latitude: { exif: EXIFInference }; longitude: { exif: EXIFInference } };
	type: MetadataType;
}

export async function extractMetadata(tags: ExifData, extractionPlan: ExifExtractionPlanItem[]) {
	console.debug('Starting EXIF Extraction', { extractionPlan, tags });

	const extract = match
		.case(
			{
				type: '"location"',
				infer: {
					latitude: { exif: EXIFField },
					longitude: { exif: EXIFField },
				},
			},
			({ infer }) => {
				if (!(infer.longitude.exif in tags)) return undefined;
				if (!(infer.latitude.exif in tags)) return undefined;

				const coords = {
					longitude: coerceExifValue(tags[infer.longitude.exif], 'float', {
						// @ts-expect-error this key access could lead to undefined, it's handled
						dmsRef: tags[infer.longitude.exif + 'Ref'] ?? 'N',
					}),
					latitude: coerceExifValue(tags[infer.latitude.exif], 'float', {
						// @ts-expect-error this key access could lead to undefined, it's handled
						dmsRef: tags[infer.longitude.exif + 'Ref'] ?? 'E',
					}),
				};

				return {
					confidence: 1,
					alternatives: [],
					value: coords,
				};
			}
		)
		.case(
			{
				type: Schemas.MetadataTypeSchema,
				infer: { exif: EXIFField },
			},
			({ infer, type }) => {
				if (!(infer.exif in tags)) return undefined;

				return {
					confidence: 1,
					alternatives: [],
					value: coerceExifValue(tags[infer.exif], type),
				};
			}
		)
		.default(() => undefined);

	return extractionPlan
		.map(({ key, ...option }) => ({
			metadataId: key,
			value: undefined,
			...extract(option),
		}))
		.filter((extracted) => extracted.value !== undefined)
		.filter(
			({ value }) =>
				!type({ latitude: 'number.NaN', longitude: 'number.NaN' }).allows(value) &&
				!Number.isNaN(value)
		);
}

export function coerceExifValue<T extends DB.MetadataType>(
	value: unknown,
	coerceTo: T,
	extra?: { dmsRef: 'N' | 'S' | 'E' | 'W' }
): import('./schemas/metadata.js').RuntimeValue<T> {
	switch (coerceTo) {
		case 'string':
			return value?.toString() ?? '';

		case 'boolean':
			return Boolean(value);

		case 'date':
			if (value instanceof Date) return new Date(value.getTime() * 1e3);
			// 2026:05:18 16:41:58
			if (typeof value === 'string' && /\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}/.test(value))
				return dates.parse(value, 'yyyy:MM:dd HH:mm:ss', new Date());
			if (typeof value === 'string') {
				const parsed = new Date(value);
				if (!dates.isValid(parsed)) {
					throw new Error(`Date value ${JSON.stringify(value)} is not a valid date string`)
				}

				return parsed
			}
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
			if (typeof value === 'string' && /^(\d+\/\d+ ?){3}$/.test(value)) {
				// DMS rational arrays, for example:
				// 43/1 28/1 176399999/100000000
				return dmsRationalToDeg(
					value
						.split(' ')
						.map((component) =>
							component.split('/').map(Number.parseFloat)
						) as DMSArray,
					extra?.dmsRef ?? 'N'
				);
			}

			// Rational value
			if (typeof value === 'string' && /^-?\d+\/-?\d+$/.test(value)) {
				const [numerator, denominator] = value.split('/').map(Number.parseFloat);
				return numerator / denominator;
			}

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
export function serializeExifValue(value: unknown): string | undefined | string[] {
	if (value instanceof Date) return dates.format(value, 'yyyy:MM:dd HH:mm:ss');
	if (Array.isArray(value)) return value.map(serializeExifValue).filter(nonnull);
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
export async function addExifMetadata(
	bytes: ArrayBuffer | Buffer,
	metadataDefs: import('./database.js').Metadata[],
	metadataValues: import('./database.js').MetadataValues
): Promise<ArrayBuffer> {
	exiv2 ??= await createExiv2Module();

	const ExifMetadata = Schemas.Metadata.and({
		infer: [
			{ exif: 'string' },
			'|',
			{ latitude: { exif: 'string' }, longitude: { exif: 'string' } },
		],
	});

	let out = new Uint8Array(bytes);

	async function setExifKey(key: ExifFieldKey, value: unknown) {
		const field = FIELDS.find((f) => f.key === key);
		const serialized = serializeExifValue(value);
		if (!serialized) {
			console.warn(`Cannot set EXIF field ${key} because the value can't be serialized`, {
				field,
				value,
			});
			return;
		}

		for (const value of ensureArray(serialized)) {
			// Everything can be written as a string, see https://exiv2.org/doc/classExiv2_1_1Exifdatum.html#a0f3b559fcc8f44e1a77efe4e15ed335c
			const added = exiv2.writeString(out, `Exif.${field?.ifd ?? 'Image'}.${key}`, value);

			if (added) {
				out = added as Uint8Array<ArrayBuffer>;
			} else {
				console.error(
					`Cannot add EXIF field ${key} with value ${JSON.stringify(serialized)}: exiv2.writeString returned unexpected empty buffer `
				);
			}
		}
	}

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
			// XXX hardcoded BS :/
			if (def.infer.latitude.exif === 'GPSLatitude') {
				await setExifKey('GPSLatitudeRef', value.latitude >= 0 ? 'N' : 'S');
				await setExifKey('GPSLatitude', degToDmsString(value.latitude));
			} else {
				await setExifKey(def.infer.latitude.exif, value.latitude);
			}

			// XXX hardcoded BS :/
			if (def.infer.longitude.exif === 'GPSLongitude') {
				await setExifKey('GPSLongitudeRef', value.longitude >= 0 ? 'E' : 'W');
				await setExifKey('GPSLongitude', degToDmsString(value.longitude));
			} else {
				await setExifKey(def.infer.longitude.exif, value.longitude);
			}
		} else {
			await setExifKey(def.infer.exif, value);
		}
	}

	return out.buffer;
}
