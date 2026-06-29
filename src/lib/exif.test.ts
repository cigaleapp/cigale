import 'fake-indexeddb/auto';

import { readFileSync } from 'node:fs';
import type * as DB from './database.js';

import { beforeEach, describe, expect, test } from 'vitest';

import {
	addExifMetadata,
	coerceExifValue,
	extractExifData,
	extractMetadata,
	processExifData,
	serializeExifValue,
} from './exif.js';
import * as db from './idb.svelte.js';
import { imageId } from './images.js';
import { namespacedMetadataId } from './schemas/metadata.js';

function readImageBytes(filename: string) {
	return readFileSync(`./tests/fixtures/${filename}`);
}

describe('processExifData', () => {
	beforeEach(async () => {
		db.nukeDatabase();

		const metadataField = {
			description: '',
			mergeMethod: 'none',
			required: false,
			learnMore: 'https://example.com',
			label: '',
		} as const;

		await db.tables.Metadata.set({
			...metadataField,
			id: namespacedMetadataId('com.example.test.protocol', 'date'),
			type: 'date',
			infer: { exif: 'DateTimeOriginal' },
		});

		await db.tables.Metadata.set({
			...metadataField,
			id: namespacedMetadataId('com.example.test.protocol', 'location'),
			type: 'location',
			infer: { latitude: { exif: 'GPSLatitude' }, longitude: { exif: 'GPSLongitude' } },
		});

		await db.tables.Metadata.set({
			...metadataField,
			id: namespacedMetadataId('com.example.test.protocol', 'no_exif'),
			type: 'string',
		});

		await db.tables.Protocol.set({
			id: 'com.example.test.protocol',
			name: 'Test Protocol',
			metadata: ['date', 'location', 'no_exif'].map((id) =>
				namespacedMetadataId('com.example.test.protocol', id)
			),
			authors: [],
			description: 'Test Protocol',
			learnMore: 'https://example.com',
			crop: {
				metadata: 'com.example.test.protocol.crop',
			},
		});

		await db.tables.Image.set({
			id: imageId(0, 0),
			sessionId: 'testing',
			addedAt: '2023-10-01T00:00:00Z',
			fileId: 'quoicoubaka',
			dimensions: { width: 100, height: 100 },
			contentType: 'image/jpeg',
			filename: 'test.jpg',
			metadata: {},
		});

		await db.tables.Session.set({
			id: 'testing',
			protocol: 'com.example.test.protocol',
			createdAt: '2023-10-01T00:00:00Z',
			openedAt: '2023-10-01T00:00:00Z',
			description: '',
			metadata: {},
			name: 'Testing Session',
		});
	});

	test('extracts from image without GPS', async () => {
		const imageBytes = readImageBytes('lil-fella.jpeg');

		await processExifData({
			sessionId: 'testing',
			imageFileId: 'quoicoubaka',
			exifData: await extractExifData(imageBytes),
			file: {
				type: 'image/jpeg',
				name: 'test.jpg',
			},
		});

		const image = await db.tables.Image.get(imageId(0, 0));
		expect(image?.metadata).toMatchInlineSnapshot(`
			{
			  "com.example.test.protocol__date": {
			    "alternatives": [],
			    "confidence": 1,
			    "confidences": {
			      ""2025-04-25T12:38:36"": 1,
			    },
			    "confirmed": false,
			    "isDefault": false,
			    "manuallyModified": false,
			    "value": 2025-04-25T12:38:36.000Z,
			  },
			}
		`);
	});

	test('extracts from image with GPS', async () => {
		const imageBytes = readImageBytes('with-exif-gps.jpeg');

		await processExifData({
			sessionId: 'testing',
			imageFileId: 'quoicoubaka',
			exifData: await extractExifData(imageBytes),
			file: {
				type: 'image/jpeg',
				name: 'test.jpg',
			},
		});

		const image = await db.tables.Image.get(imageId(0, 0));
		expect(image?.metadata).toMatchInlineSnapshot(`
			{
			  "com.example.test.protocol__date": {
			    "alternatives": [],
			    "confidence": 1,
			    "confidences": {
			      ""2008-10-22T16:29:49"": 1,
			    },
			    "confirmed": false,
			    "isDefault": false,
			    "manuallyModified": false,
			    "value": 2008-10-22T16:29:49.000Z,
			  },
			  "com.example.test.protocol__location": {
			    "alternatives": [],
			    "confidence": 1,
			    "confidences": {
			      "{"longitude":11.885394999997223,"latitude":43.46715666666389}": 1,
			    },
			    "confirmed": false,
			    "isDefault": false,
			    "manuallyModified": false,
			    "value": {
			      "latitude": 43.46715666666389,
			      "longitude": 11.885394999997223,
			    },
			  },
			}
		`);
	});
});

describe('extractMetadata', () => {
	const plan = [
		{
			key: 'date',
			infer: { exif: 'DateTimeOriginal' },
			type: 'date',
		},
		{
			key: 'location',
			infer: {
				latitude: { exif: 'GPSLatitude' },
				longitude: { exif: 'GPSLongitude' },
			},
			type: 'location',
		},
		{
			key: 'make',
			infer: { exif: 'Make' },
			type: 'string',
		},
		{
			key: 'model',
			infer: { exif: 'Model' },
			type: 'string',
		},
	] as const;

	test('extracts from image without GPS', async () => {
		const imageBytes = readImageBytes('lil-fella.jpeg');
		const exif = await extractExifData(imageBytes);
		const extraction = await extractMetadata(exif, [...plan]);

		expect(extraction).toMatchObject([
			{
				metadataId: 'date',
				value: new Date('2025-04-25T12:38:36.000Z'),
				alternatives: [],
				confidence: 1,
			},
			{
				metadataId: 'make',
				alternatives: [],
				confidence: 1,
				value: 'Canon',
			},
			{
				metadataId: 'model',
				alternatives: [],
				confidence: 1,
				value: 'Canon EOS RP',
			},
		]);
	});

	test('extracts from image with GPS', async () => {
		const imageBytes = readImageBytes('with-exif-gps.jpeg');
		const exif = await extractExifData(imageBytes);
		const extraction = await extractMetadata(exif, [...plan]);

		expect(extraction).toMatchObject([
			{
				metadataId: 'date',
				confidence: 1,
				alternatives: [],
				value: new Date('2008-10-22T16:29:49.000Z'),
			},
			{
				metadataId: 'location',
				confidence: 1,
				alternatives: [],
				value: {
					latitude: 43.46715666666389,
					longitude: 11.885394999997223,
				},
			},
			{
				metadataId: 'make',
				confidence: 1,
				alternatives: [],
				value: 'NIKON',
			},
			{
				metadataId: 'model',
				confidence: 1,
				alternatives: [],
				value: 'COOLPIX P6000',
			},
		]);
	});

	test('does not extract GPS even if possible if not in extraction plan', async () => {
		const imageBytes = readImageBytes('with-exif-gps.jpeg');
		const exif = await extractExifData(imageBytes);
		const extraction = await extractMetadata(exif, [
			{
				key: 'date',
				infer: { exif: 'DateTimeOriginal' },
				type: 'date',
			},
		]);

		expect(extraction).toEqual([
			{
				confidence: 1,
				alternatives: [],
				value: new Date('2008-10-22T16:29:49.000Z'),
				metadataId: 'date',
			},
		]);
	});
});

describe('coerceExifValue', () => {
	test('to string', () => {
		expect(coerceExifValue('test', 'string')).toEqual('test');
	});

	describe('to date', () => {
		test('valid date', () => {
			expect(
				coerceExifValue(new Date('2023-10-01T12:00:00Z').valueOf() * 1e-3, 'date')
			).toEqual(new Date('2023-10-01T12:00:00Z'));
		});
		test('NaN-valued date', () => {
			expect(() => coerceExifValue(NaN, 'date')).toThrowErrorMatchingInlineSnapshot(
				`[Error: Date value is invalid]`
			);
		});
		test('malformed date', () => {
			expect(() => coerceExifValue('test', 'date')).toThrowErrorMatchingInlineSnapshot(
				`[Error: Date value "test" is not a valid date string]`
			);
		});
	});

	test('to float', () => {
		expect(coerceExifValue('1.23', 'float')).toEqual(1.23);
	});

	test('to int', () => {
		expect(coerceExifValue('123', 'integer')).toEqual(123);
	});

	test('to boundingbox', () => {
		expect(() => coerceExifValue('123', 'boundingbox')).toThrowError(/not supported/);
	});

	describe('to enum', () => {
		test('valid value', () => {
			expect(coerceExifValue('test', 'enum')).toEqual('test');
		});
		test('invalid value', () => {
			expect(() => coerceExifValue(123, 'enum')).toThrowError(/must be a string/);
		});
	});
});

describe('serializeExifValue', () => {
	describe('from date', () => {
		test('valid date', () => {
			expect(serializeExifValue(new Date('2023-10-01T12:00:00Z'))).toEqual(
				'2023:10:01 12:00:00'
			);
		});
		test('invalid date', () => {
			expect(() => serializeExifValue(new Date(NaN))).toThrowErrorMatchingInlineSnapshot(
				`[RangeError: Invalid time value]`
			);
		});
	});
	test('from string', () => {
		expect(serializeExifValue('test')).toEqual('test');
	});
	test('from number', () => {
		expect(serializeExifValue(123)).toEqual('123');
	});
	test('from boolean', () => {
		expect(serializeExifValue(true)).toEqual('true');
	});
	test('from null', () => {
		expect(serializeExifValue(null)).toEqual('null');
	});
	test('from undefined', () => {
		expect(serializeExifValue(undefined)).toEqual('undefined');
	});
	test('from array', () => {
		expect(serializeExifValue([1, '2', true])).toEqual(['1', '2', 'true']);
	});
	test('from object', () => {
		// FIXME: end of formatted string is locale-dependent
		expect(serializeExifValue({ a: 1, b: '2', c: true, v: new Date(7) })).toMatch(
			/^a=1;b=2;c=true;v=Thu Jan 01 1970 00:00:00/
		);
	});
});

describe('addExifMetadata', () => {
	const metadataDefs: DB.Metadata[] = [
		{
			id: 'proto__gps',
			type: 'location' as const,
			description: 'GPS',
			label: '',
			mergeMethod: 'none' as const,
			required: false,
			sortable: false,
			groupable: false,
			images: [],
			infer: {
				latitude: { exif: 'GPSLatitude' },
				longitude: { exif: 'GPSLongitude' },
			} as const,
		},
		{
			id: 'proto__date',
			type: 'date' as const,
			description: 'Date',
			label: '',
			mergeMethod: 'none' as const,
			required: false,
			sortable: false,
			groupable: false,
			images: [],
			infer: /** @type {const} */ {
				exif: 'DateTimeOriginal',
			},
		},
		{
			id: 'proto__non_exif',
			type: 'string' as const,
			description: 'Not a EXIF-infered field',
			label: '',
			mergeMethod: 'none' as const,
			required: false,
			sortable: false,
			groupable: false,
			images: [],
		},
	];
	const metadataValues = {
		proto__gps: {
			value: {
				latitude: 43.46715666666389,
				longitude: 11.885394999997223,
			},
			manuallyModified: false,
			confidence: 1,
			alternatives: {},
		},
		proto__date: {
			value: new Date('2023-10-01T12:00:00Z'),
			manuallyModified: false,
			confidence: 1,
			alternatives: {},
		},
		proto__non_exif: {
			value: 'test',
			manuallyModified: false,
			confidence: 1,
			alternatives: {},
		},
	};

	// FIXME kinda slow, idk why
	test('without prior GPS location', async () => {
		const before = readImageBytes('cyan.jpeg');

		expect(await extractExifData(before)).not.toHaveProperty('GPSLatitude');

		const after = await addExifMetadata(before, metadataDefs, metadataValues);

		expect(await extractExifData(after)).toMatchObject({
			DateTimeOriginal: '2023:10:01 12:00:00',
			GPSLatitude: '43/1 28/1 176/100',
			GPSLatitudeRef: 'N',
			GPSLongitude: '11/1 53/1 742/100',
			GPSLongitudeRef: 'E',
			GPSTag: '58',
		});
	});

	test('with prior GPS location', async () => {
		const before = readImageBytes('with-exif-gps.jpeg');

		expect(await extractExifData(before)).toMatchObject({
			GPSLatitude: 'feur',
		});

		const after = await addExifMetadata(before, metadataDefs, metadataValues);

		expect(await extractExifData(after)).toMatchObject({
			DateTimeOriginal: '2023:10:01 12:00:00',
			GPSLatitude: '43/1 28/1 176/100',
			GPSLatitudeRef: 'N',
			GPSLongitude: '11/1 53/1 742/100',
			GPSLongitudeRef: 'E',
			// Verify that it keeps existing data
			ColorSpace: '1',
			ComponentsConfiguration: '1 2 3 0',
			Compression: '6',
		});
	});
});
