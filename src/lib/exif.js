import * as exifParser from 'exif-parser';
import * as db from './idb.svelte.js';
import { storeMetadataValue } from './metadata.js';
import { toasts } from './toasts.svelte.js';

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
		Object.fromEntries(
			(metadataOfProtocol ?? [])
				.map((m) => {
					if (!m.infer) return undefined;
					if (!('exif' in m.infer)) return undefined;
					return [m.infer.exif, m];
				})
				.filter((entry) => entry !== undefined)
		)
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
 * @param {Partial<Record<import('./database.js').EXIFField, { type: import('./database.js').MetadataType, id: string }>>} extractionPlan
 * @returns {Promise<Record<string, { value: unknown; confidence: number; alternatives: Record<string, unknown> }>>}
 */
export async function extractMetadata(buffer, extractionPlan) {
	const exif = exifParser.create(buffer).enableImageSize(false).parse();

	if (!exif) return {};

	return Object.fromEntries(
		Object.entries(extractionPlan ?? {})
			.map(([tagname, { type, id }]) => {
				if (!exif.tags[tagname]) return undefined;
				return [
					id,
					{
						value:
							type === 'location'
								? {
										longitude: coerceExifValue(exif.tags[tagname].longitude, 'float'),
										latitude: coerceExifValue(exif.tags[tagname].latitude, 'float')
									}
								: coerceExifValue(exif.tags[tagname], type),
						confidence: 1,
						alternatives: {}
					}
				];
			})
			.filter((entry) => entry !== undefined)
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
