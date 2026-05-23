import 'fake-indexeddb/auto';

import { afterEach, describe, expect, test, vi } from 'vitest';

import { tables } from './idb.svelte.js';
import * as storage from './metadata/storage.js';
import { findRawMetadataFieldByExifTag, isRawImage, processRawMetadata } from './raw.js';

describe('isRawImage', () => {
	test('detects raw images by media type', () => {
		const file = new File([], 'image.cr2', { type: 'image/CR2' });
		expect(isRawImage(file)).toBe(true);
	});

	test('detects raw images by file extension', () => {
		const file = new File([], 'image.nef', { type: 'application/octet-stream' });
		expect(isRawImage(file)).toBe(true);
	});

	test('returns false on non-raw images', () => {
		const file = new File([], 'image.jpg', { type: 'image/jpeg' });
		expect(isRawImage(file)).toBe(false);
	});
});

describe('findRawMetadataFieldByExifTag', () => {
	test('extracts common fields and GPS', () => {
		const mockMetadata = {
			width: 4770,
			height: 3178,
			raw_width: 4832,
			raw_height: 3204,
			top_margin: 26,
			left_margin: 62,
			camera_make: 'Canon',
			camera_model: 'EOS 500D',
			iso_speed: 3200,
			shutter: 0.009999999776482582,
			aperture: 5,
			focal_len: 70,
			timestamp: new Date('1970-01-21T03:43:23.387Z'),
			shot_order: 0,
			desc: '',
			artist: '',
			thumb_width: 4752,
			thumb_height: 3168,
			thumb_format: 'unknown' as const,
			gps_data: {
				latitude: [43, 36, 8.6] as [number, number, number],
				longitude: [1, 27, 22.8] as [number, number, number],
				altitude: 0,
			},
		};

		expect(findRawMetadataFieldByExifTag(mockMetadata, 'Make')).toBe('Canon');
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'Model')).toBe('EOS 500D');
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'ISOSpeed')).toBe(3200);
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'ShutterSpeedValue')).toBe(
			0.009999999776482582
		);
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'ApertureValue')).toBe(5);
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'FocalLength')).toBe(70);
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'DateTimeOriginal')).toStrictEqual(
			new Date('1970-01-21T03:43:23.387Z')
		);
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'ImageDescription')).toBe('');
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'Artist')).toBe('');
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'GPSAltitude')).toBe(0);
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'GPSLatitude')).toBeCloseTo(43.60239, 5);
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'GPSLongitude')).toBeCloseTo(
			1.456334,
			5
		);
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'ExposureIndex')).toBeUndefined();
		expect(findRawMetadataFieldByExifTag(mockMetadata, 'ColorSpace')).toBeUndefined();
	});
});

describe('processRawMetadata', () => {
	const origSessionGet = tables.Session.get;
	const origProtocolGet = tables.Protocol.get;
	const origMetadataList = tables.Metadata.list;
	const origImageList = tables.Image.list;

	type SessionGet = typeof origSessionGet;
	type ProtocolGet = typeof origProtocolGet;
	type MetadataList = typeof origMetadataList;
	type ImageList = typeof origImageList;

	afterEach(() => {
		tables.Session.get = origSessionGet;
		tables.Protocol.get = origProtocolGet;
		tables.Metadata.list = origMetadataList;
		tables.Image.list = origImageList;
		vi.restoreAllMocks();
	});

	test('throws when session not found', async () => {
		tables.Session.get = async () => undefined;
		await expect(processRawMetadata('sid-missing', 'file-x', {} as any)).rejects.toThrow(
			`Session with id sid-missing not found`
		);
	});

	test('throws when protocol not found', async () => {
		tables.Session.get = async () =>
			({ protocol: 'proto-1' }) as Awaited<ReturnType<SessionGet>>;
		tables.Protocol.get = async () => undefined;
		await expect(processRawMetadata('s1', 'file-x', {} as any)).rejects.toThrow(
			`Protocol with id proto-1 not found`
		);
	});

	test('resolves when protocol has no metadata to infer', async () => {
		tables.Session.get = async () =>
			({ protocol: 'proto-empty' }) as Awaited<ReturnType<SessionGet>>;
		tables.Protocol.get = async () =>
			({ id: 'proto-empty', metadata: [] }) as unknown as Awaited<ReturnType<ProtocolGet>>;
		tables.Metadata.list = async () => [] as Awaited<ReturnType<MetadataList>>;
		tables.Image.list = async () => [] as Awaited<ReturnType<ImageList>>;

		await expect(processRawMetadata('s-ok', 'file-x', {} as any)).resolves.toBeUndefined();
	});

	test('resolves when metadata definitions exist but no matching images', async () => {
		tables.Session.get = async () =>
			({ protocol: 'proto-2' }) as Awaited<ReturnType<SessionGet>>;
		tables.Protocol.get = async () =>
			({ id: 'proto-2', metadata: ['m1'] }) as unknown as Awaited<ReturnType<ProtocolGet>>;
		tables.Metadata.list = async () =>
			[
				{ id: 'm1', infer: { exif: 'Make' }, type: 'string' } as unknown as Awaited<
					ReturnType<MetadataList>
				>[number],
			] as unknown as Awaited<ReturnType<MetadataList>>;
		// No images for this session/file
		tables.Image.list = async () => [] as Awaited<ReturnType<ImageList>>;

		await expect(processRawMetadata('s-ok-2', 'file-x', {} as any)).resolves.toBeUndefined();
	});

	test('handles when images exist but nothing to infer', async () => {
		tables.Session.get = async () =>
			({ protocol: 'proto-3' }) as Awaited<ReturnType<SessionGet>>;
		tables.Protocol.get = async () =>
			({ id: 'proto-3', metadata: [] }) as unknown as Awaited<ReturnType<ProtocolGet>>;
		tables.Metadata.list = async () => [] as Awaited<ReturnType<MetadataList>>;
		// One image matches the provided fileId
		tables.Image.list = async () =>
			[
				{ id: 'img-1', fileId: 'file-x' } as Awaited<ReturnType<ImageList>>[number],
			] as Awaited<ReturnType<ImageList>>;

		await expect(processRawMetadata('s-img', 'file-x', {} as any)).resolves.toBeUndefined();
	});

	test('infers and stores metadata when definitions and images exist', async () => {
		tables.Session.get = async () =>
			({ protocol: 'proto-4' }) as Awaited<ReturnType<SessionGet>>;
		tables.Protocol.get = async () =>
			({ id: 'proto-4', metadata: ['m1'] }) as unknown as Awaited<ReturnType<ProtocolGet>>;
		tables.Metadata.list = async () =>
			[
				{ id: 'm1', infer: { exif: 'Make' }, type: 'string' } as unknown as Awaited<
					ReturnType<MetadataList>
				>[number],
			] as unknown as Awaited<ReturnType<MetadataList>>;
		tables.Image.list = async () =>
			[
				{ id: 'img-1', fileId: 'file-x' } as Awaited<ReturnType<ImageList>>[number],
			] as Awaited<ReturnType<ImageList>>;

		const spy = vi.spyOn(storage, 'storeMetadataValue').mockImplementation(async () => {});

		const meta = { camera_make: 'TestBrand' } as any;

		await processRawMetadata('s4', 'file-x', meta);

		expect(spy).toHaveBeenCalled();
		const call = spy.mock.calls[0][0];
		expect(call.metadataId).toBe('m1');
		expect(call.sessionId).toBe('s4');
		expect(call.subjectId).toBe('img-1');
	});
});
