// @wc-ignore-file

import type { EXIFField } from './database.js';
import type { RuntimeValue } from './schemas/metadata.js';

import LibRaw from 'libraw-wasm';
import { GPSHelper } from 'piexifjs';

import { apertureValueToFNumber, coerceExifValue } from './exif.js';
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
			let value: RuntimeValue | undefined;
			if (!infer) continue;

			if ('latitude' in infer && 'longitude' in infer) {
				if (!InferenceConfigs.exif.allows(infer.latitude)) continue;
				if (!InferenceConfigs.exif.allows(infer.longitude)) continue;

				console.debug(
					`Inferring EXIF from RAW photo: ${infer.latitude.exif} & ${infer.longitude.exif} -> ${metadataId}`
				);

				value = coerceExifValue('location', {
					latitude: findRawMetadataFieldByExifTag(metadata, infer.latitude.exif),
					longitude: findRawMetadataFieldByExifTag(metadata, infer.longitude.exif),
				});
			} else {
				if (!InferenceConfigs.exif.allows(infer)) continue;

				console.debug(`Inferring EXIF from RAW photo: ${infer.exif} -> ${metadataId}`);

				value = coerceExifValue(
					type,
					findRawMetadataFieldByExifTag(metadata, infer.exif),
					infer.exif
				);
			}

			// This means the coercion decided the value had to be thrown out
			// for example, cameras that store "-1000°C" for temperatures when
			// the value is not available (looking at you, Canon...)
			if (value === undefined) continue;

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
	// Useful links:
	// https://gist.github.com/gwennlbh/b907a5fc4e139f12ddb2c677984a4a83 (example contents of "output" variable)
	// https://github.com/ybouane/LibRaw-Wasm/blob/main/libraw_wrapper.cpp#L47
	// https://www.libraw.org/docs/API-datastruct-eng.html#libraw_iparams_t
	// https://exiv2.org/tags.html

	console.debug(`Finding EXIF ${tag} in RAW metadata`, metadata);
	// TODO: ExposureTime
	// TODO: Find if theres a way to expose CameraTemperature to exif data?
	// is it reasonable to put it as the AmbientTemperature? idk...
	// but we cant let the user choose a fallback since it's not a proper EXIF tag either
	// seems like it's the default CR2 tag for Sensor temperature (see https://www.otelescope.com/forums/topic/462-which-exif-data-does-bye-use-to-identify-the-camera-temperature/#comment-3390_wrap:~:text=The%20%22CameraTemperature%22%20tag%20name%20*is*%20the%20default%20%2Ecr2%20tag%20name%20for%20the%20sensor%20temperature%2E)
	// but like, sensor != ambiant obviously well except most of the time when theres no overheating or sth.
	// but theres also no Sensor temperature tag in exif data, snif
	switch (tag) {
		case 'ImageWidth':
			return metadata.raw_width;
		case 'ImageLength':
			return metadata.raw_height;
		case 'Orientation':
			return metadata.flip;
		case 'Make':
			return metadata.camera_make;
		case 'LensModel':
			return metadata.lens?.Lens || metadata.lens?.makernotes.Lens;
		case 'LensMake':
			return metadata.lens?.LensMake;
		case 'Model':
			return metadata.camera_model;
		case 'ISOSpeedRatings':
			return metadata.iso_speed;
		case 'ShutterSpeedValue':
			// It seems like metadata.shutter is the ExposureTime and not the APEX value, see https://www.libraw.org/node/2876
			// See https://www.dpreview.com/forums/threads/exif-data-exposure-time-vs-shutter-speed.2215331/#js-XFUniqueId8:~:text=The%20Apex%20shutter%20time%20is%20%2Dlog2%28exposure%20time%29%2E
			return -1 * Math.log2(metadata.shutter);
		case 'ExposureTime':
			// It seems like metadata.shutter is the ExposureTime and not the APEX value, see https://www.libraw.org/node/2876
			return metadata.shutter;
		case 'ApertureValue':
			return metadata.aperture;
		case 'FNumber':
			return apertureValueToFNumber(metadata.aperture);
		case 'FocalLength':
			return metadata.focal_len;
		case 'FocalLengthIn35mmFilm':
			return (
				metadata.lens?.FocalLengthIn35mmFormat ||
				metadata.lens?.makernotes.FocalLengthIn35mmFormat
			);
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
