import * as exifParser from 'exif-parser';
import * as db from './idb.svelte.js';
import { storeMetadataValue } from './metadata.js';
import { toasts } from './toasts.svelte.js';
import { BUILTIN_METADATA_IDS } from './database';

/**
 *
 * @param {string} imageId
 * @param {ArrayBuffer} imageBytes
 * @param {{ type: string; name: string }} file
 */
export async function processExifData(imageId, imageBytes, file) {
	const metadataFromExif = await extractMetadata(imageBytes).catch((e) => {
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
 */
export async function extractMetadata(buffer) {
	const exif = exifParser.create(buffer).enableImageSize(false).parse();
	/** @typedef {keyof typeof import('./database.js').BUILTIN_METADATA_IDS} BuiltinMetadataKeys  */
	/** @type {{[K in BuiltinMetadataKeys]?: import('./database.js').MetadataValues[K]}} */
	const output = {};

	if (!exif) return output;

	if (exif.tags.DateTimeOriginal) {
		output[BUILTIN_METADATA_IDS.shoot_date] = new Date(exif.tags.DateTimeOriginal);
	}

	if (exif.tags.GPSLatitude && exif.tags.GPSLongitude) {
		output[BUILTIN_METADATA_IDS.shoot_location] = {
			latitude: /** @type {number} */ (exif.tags.GPSLatitude),
			longitude: /** @type {number} */ (exif.tags.GPSLongitude)
		};
	}

	return Object.fromEntries(
		Object.entries(output).map(([key, value]) => [key, { value, alternatives: {}, confidence: 1 }])
	);
}
