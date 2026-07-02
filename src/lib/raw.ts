// @wc-ignore-file

import type { EXIFField } from './database.js';
import type { RuntimeValue } from './schemas/metadata.js';

import LibRaw from 'libraw-wasm';
import { GPSHelper } from 'piexifjs';

import { coerceExifValue } from './exif.js';
import { openDatabase, tables } from './idb.svelte.js';
import { resolveMetadataImport } from './metadata/namespacing.js';
import { storeMetadataValue } from './metadata/storage.js';
import { InferenceConfigs } from './schemas/metadata.js';

export const RAW_IMAGE_FILE_EXTENSIONS = [
	'.3fr',
	'.ari',
	'.arw',
	'.bay',
	'.braw',
	'.crw',
	'.cr2',
	'.cr3',
	'.cap',
	'.data',
	'.dcs',
	'.dcr',
	'.dng',
	'.drf',
	'.eip',
	'.erf',
	'.fff',
	'.gpr',
	'.iiq',
	'.k25',
	'.kdc',
	'.mdc',
	'.mef',
	'.mos',
	'.mrw',
	'.nef',
	'.nrw',
	'.obm',
	'.orf',
	'.pef',
	'.ptx',
	'.pxn',
	'.r3d',
	'.raf',
	'.raw',
	'.rwl',
	'.rw2',
	'.rwz',
	'.sr2',
	'.srf',
	'.srw',
	'.tif',
	'.x3f',
];

export const RAW_IMAGE_MEDIA_TYPES = [
	'image/CR2',
	'image/x-canon-cr2',
	'image/x-dcraw',
	'image/x-canon-crw',
	'image/x-kodak-dcr',
	'image/x-adobe-dng',
	'image/x-epson-erf',
	'image/x-kodak-k25',
	'image/x-kodak-kdc',
	'image/x-minolta-mrw',
	'image/x-nikon-nef',
	'image/x-olympus-orf',
	'image/x-pentax-pef',
	'image/x-fuji-raf',
	'image/x-panasonic-raw',
	'image/x-sony-sr2',
	'image/x-sony-srf',
	'image/x-sigma-x3f',
];

export function isRawImage(file: Pick<File, 'type' | 'name'>) {
	return (
		RAW_IMAGE_MEDIA_TYPES.includes(file.type) ||
		RAW_IMAGE_FILE_EXTENSIONS.some((ext) => file.name.toLocaleLowerCase().endsWith(ext))
	);
}

async function decodeRawPhoto(bytes: ArrayBuffer): Promise<{
	imageData: ImageData;
	metadata: import('libraw-wasm').Metadata | undefined;
}> {
	const raw = new LibRaw();
	await raw.open(new Uint8Array(bytes));
	const metadata = await raw.metadata(true);

	const decoded = await raw.imageData();
	if (!decoded) {
		throw new Error('Failed to decode raw photo');
	}

	const { width, height, data: pixels } = decoded;
	const imageData = new ImageData(width, height);

	// Fill imageData. Note that pixels stores in the following order: R/G/B first -> height -> width
	for (let i = 0; i < pixels.length / 3; i++) {
		imageData.data[i * 4 + 0] = pixels[i * 3 + 0];
		imageData.data[i * 4 + 1] = pixels[i * 3 + 1];
		imageData.data[i * 4 + 2] = pixels[i * 3 + 2];
		imageData.data[i * 4 + 3] = 255;
	}

	return { imageData, metadata };
}

/**
 * Transcode a raw photo into JPEG format.
 */
export async function transcodeRawPhotoToJPEG(bytes: ArrayBuffer): Promise<{
	bytes: ArrayBuffer;
	metadata: import('libraw-wasm').Metadata | undefined;
}> {
	const { imageData, metadata } = await decodeRawPhoto(bytes);

	console.debug('Decoded raw photo, got metadata:', metadata);

	const canvas = new OffscreenCanvas(imageData.width, imageData.height);
	const ctx = canvas.getContext('2d');
	ctx?.putImageData(imageData, 0, 0);

	const blob = await canvas.convertToBlob({ type: 'image/jpeg' });
	const buf = await blob.arrayBuffer();

	return { bytes: buf, metadata };
}

export async function processRawMetadata(
	sessionId: string,
	imageFileId: string,
	metadata: import('libraw-wasm').Metadata
) {
	const session = await tables.Session.get(sessionId);
	if (!session) {
		throw new Error(`Session with id ${sessionId} not found`);
	}

	const protocol = await tables.Protocol.get(session.protocol);
	if (!protocol) {
		throw new Error(`Protocol with id ${session.protocol} not found`);
	}

	const metadataDefs = await tables.Metadata.getMany(
		protocol.metadata.map((key) => resolveMetadataImport(protocol, key))
	);

	const images = await tables.Image.list('fileId', imageFileId);

	for (const { id: subjectId } of images) {
		for (const { id: metadataId, infer, type } of metadataDefs) {
			let value: RuntimeValue;
			if (!infer) continue;

			if ('latitude' in infer && 'longitude' in infer) {
				if (!InferenceConfigs.exif.allows(infer.latitude)) continue;
				if (!InferenceConfigs.exif.allows(infer.longitude)) continue;

				console.debug(
					`Inferring EXIF from RAW photo: ${infer.latitude.exif} & ${infer.longitude.exif} -> ${metadataId}`
				);

				const latitude = findRawMetadataFieldByExifTag(metadata, infer.latitude.exif);
				const longitude = findRawMetadataFieldByExifTag(metadata, infer.longitude.exif);

				// Skip if either latitude or longitude is missing
				if (latitude === undefined || longitude === undefined) {
					continue;
				}

				// Skip if both are 0
				if (!latitude && !longitude) {
					continue;
				}

				value = {
					latitude: coerceExifValue(latitude, 'float'),
					longitude: coerceExifValue(longitude, 'float'),
				};
			} else {
				if (!InferenceConfigs.exif.allows(infer)) continue;

				console.debug(`Inferring EXIF from RAW photo: ${infer.exif} -> ${metadataId}`);

				const rawValue = findRawMetadataFieldByExifTag(metadata, infer.exif);

				// Skip if the raw metadata field is not present
				if (rawValue === undefined) {
					console.warn(
						`EXIF tag ${infer.exif} not found in metadata for session ${sessionId}, subject ${subjectId}, skipping metadata ${metadataId}`
					);
					continue;
				}

				value = coerceExifValue(rawValue, type);
			}

			await storeMetadataValue({
				db: await openDatabase(),
				sessionId,
				subjectId,
				metadataId,
				type,
				value,
			});
		}
	}
}

export function findRawMetadataFieldByExifTag(
	metadata: import('libraw-wasm').Metadata,
	tag: EXIFField
): number | string | Date | undefined {
	switch (tag) {
		case 'Make':
			return metadata.camera_make;
		case 'Model':
			return metadata.camera_model;
		case 'ISOSpeed':
			return metadata.iso_speed;
		case 'ShutterSpeedValue':
			return metadata.shutter;
		case 'ApertureValue':
			return metadata.aperture;
		case 'FocalLength':
			return metadata.focal_len;
		case 'DateTimeOriginal':
			return metadata.timestamp;
		// XXX: Not sure about that one
		case 'ImageDescription':
			return metadata.desc;
		case 'Artist':
			return metadata.artist;
		case 'GPSAltitude':
			return metadata.gps_data?.altitude;
		// XXX: Find out if there's a way to get the LatitudeRef
		case 'GPSLatitude': {
			if (!metadata.gps_data) return undefined;
			return GPSHelper.dmsRationalToDeg(
				metadata.gps_data.latitude.map((v) => [v, 1] as const),
				'N'
			);
		}
		// XXX: Find out if there's a way to get the LongitudeRef
		case 'GPSLongitude': {
			if (!metadata.gps_data) return undefined;
			return GPSHelper.dmsRationalToDeg(
				metadata.gps_data.longitude.map((v) => [v, 1] as const),
				'E'
			);
		}
		case 'ExposureIndex':
			return metadata.metadata_common?.exifExposureIndex;
		case 'ColorSpace':
			return metadata.metadata_common?.ColorSpace;
	}
}
