import 'fake-indexeddb/auto';

import { readFileSync } from 'node:fs';
import exif from 'exif-parser';
import { beforeEach, describe, expect, test } from 'vitest';

import {
	addExifMetadata,
	coerceExifValue,
	extractMetadata,
	processExifData,
	serializeExifValue
} from './exif.js';
import * as db from './idb.svelte.js';
import { imageId } from './images.js';
import { namespacedMetadataId } from './schemas/metadata.js';

/**
 * Read a file from ./tests/fixtures
 * @param {string} filename
 * @returns {Promise<Buffer>} the contents
 */
async function readImageBytes(filename) {
	return readFileSync(`./tests/fixtures/${filename}`);
}

describe('processExifData', () => {
	beforeEach(async () => {
		db.nukeDatabase();

		const metadataField = /** @type {const} */ ({
			description: '',
			mergeMethod: 'none',
			required: false,
			learnMore: 'https://example.com',
			label: ''
		});

		await db.tables.Metadata.set({
			...metadataField,
			id: namespacedMetadataId('com.example.test.protocol', 'date'),
			type: 'date',
			infer: { exif: 'DateTimeOriginal' }
		});

		await db.tables.Metadata.set({
			...metadataField,
			id: namespacedMetadataId('com.example.test.protocol', 'location'),
			type: 'location',
			infer: { latitude: { exif: 'GPSLatitude' }, longitude: { exif: 'GPSLongitude' } }
		});

		await db.tables.Metadata.set({
			...metadataField,
			id: namespacedMetadataId('com.example.test.protocol', 'no_exif'),
			type: 'string'
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
				metadata: 'com.example.test.protocol.crop'
			}
		});

		await db.tables.Image.set({
			id: imageId(0, 0),
			sessionId: 'testing',
			addedAt: '2023-10-01T00:00:00Z',
			fileId: 'quoicoubaka',
			dimensions: { width: 100, height: 100 },
			contentType: 'image/jpeg',
			filename: 'test.jpg',
			metadata: {}
		});

		await db.tables.Session.set({
			id: 'testing',
			protocol: 'com.example.test.protocol',
			createdAt: '2023-10-01T00:00:00Z',
			openedAt: '2023-10-01T00:00:00Z',
			description: '',
			metadata: {},
			name: 'Testing Session'
		});
	});

	test('extracts from image without GPS', async () => {
		const imageBytes = await readImageBytes('lil-fella.jpeg');

		await processExifData('testing', 'quoicoubaka', imageBytes, {
			type: 'image/jpeg',
			name: 'test.jpg'
		});

		const image = await db.tables.Image.get(imageId(0, 0));
		expect(image?.metadata).toEqual({
			[namespacedMetadataId('com.example.test.protocol', 'date')]: {
				value: new Date('2025-04-25T12:38:36.000Z'),
				manuallyModified: false,
				confirmed: false,
				isDefault: false,
				confidence: 1,
				alternatives: {}
			}
		});
	});

	test('extracts from image with GPS', async () => {
		const imageBytes = await readImageBytes('with-exif-gps.jpeg');

		await processExifData('testing', 'quoicoubaka', imageBytes, {
			type: 'image/jpeg',
			name: 'test.jpg'
		});

		const image = await db.tables.Image.get(imageId(0, 0));
		expect(image?.metadata).toEqual({
			[namespacedMetadataId('com.example.test.protocol', 'date')]: {
				value: new Date('2008-10-22T16:29:49.000Z'),
				manuallyModified: false,
				confidence: 1,
				confirmed: false,
				isDefault: false,
				alternatives: {}
			},
			[namespacedMetadataId('com.example.test.protocol', 'location')]: {
				value: {
					latitude: 43.46715666666389,
					longitude: 11.885394999997223
				},
				manuallyModified: false,
				confidence: 1,
				confirmed: false,
				isDefault: false,
				alternatives: {}
			}
		});
	});
});

describe('extractMetadata', () => {
	const plan = /** @type {const} */ ([
		{
			key: 'date',
			infer: { exif: 'DateTimeOriginal' },
			type: 'date'
		},
		{
			key: 'location',
			infer: {
				latitude: { exif: 'GPSLatitude' },
				longitude: { exif: 'GPSLongitude' }
			},
			type: 'location'
		},
		{
			key: 'make',
			infer: { exif: 'Make' },
			type: 'string'
		},
		{
			key: 'model',
			infer: { exif: 'Model' },
			type: 'string'
		}
	]);

	test('extracts from image without GPS', async () => {
		const imageBytes = await readImageBytes('lil-fella.jpeg');
		const extraction = await extractMetadata(imageBytes, [...plan]);

		expect(extraction).toEqual({
			date: {
				value: new Date('2025-04-25T12:38:36.000Z'),
				alternatives: {},
				confidence: 1
			},
			make: {
				alternatives: {},
				confidence: 1,
				value: 'Canon'
			},
			model: {
				alternatives: {},
				confidence: 1,
				value: 'Canon EOS RP'
			}
		});
	});

	test('extracts from image with GPS', async () => {
		const imageBytes = await readImageBytes('with-exif-gps.jpeg');
		const extraction = await extractMetadata(imageBytes, [...plan]);

		expect(extraction).toEqual({
			date: {
				confidence: 1,
				alternatives: {},
				value: new Date('2008-10-22T16:29:49.000Z')
			},
			location: {
				confidence: 1,
				alternatives: {},
				value: {
					latitude: 43.46715666666389,
					longitude: 11.885394999997223
				}
			},
			make: {
				confidence: 1,
				alternatives: {},
				value: 'NIKON'
			},
			model: {
				confidence: 1,
				alternatives: {},
				value: 'COOLPIX P6000'
			}
		});
	});

	test('does not extract GPS even if possible if not in extraction plan', async () => {
		const imageBytes = await readImageBytes('with-exif-gps.jpeg');
		const extraction = await extractMetadata(imageBytes, [
			{
				key: 'date',
				infer: { exif: 'DateTimeOriginal' },
				type: 'date'
			}
		]);

		expect(extraction).toEqual({
			date: {
				confidence: 1,
				alternatives: {},
				value: new Date('2008-10-22T16:29:49.000Z')
			}
		});
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
				`[Error: Date value must be a number]`
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
	test('leaves arrays intact', () => {
		expect(serializeExifValue([1, '2', true])).toEqual([1, '2', true]);
	});
	test('from object', () => {
		// FIXME: end of formatted string is locale-dependent
		expect(serializeExifValue({ a: 1, b: '2', c: true, v: new Date(7) })).toMatch(
			/^a=1;b=2;c=true;v=Thu Jan 01 1970 00:00:00/
		);
	});
});

describe('addExifMetadata', () => {
	/**
	 * @type {Array<import('./database.js').Metadata>}
	 */
	const metadataDefs = [
		{
			id: 'proto__gps',
			type: /** @type {const} */ ('location'),
			description: 'GPS',
			label: '',
			mergeMethod: /** @type {const} */ ('none'),
			required: false,
			sortable: false,
			groupable: false,
			infer: /** @type {const} */ ({
				latitude: { exif: 'GPSLatitude' },
				longitude: { exif: 'GPSLongitude' }
			})
		},
		{
			id: 'proto__date',
			type: /** @type {const} */ ('date'),
			description: 'Date',
			label: '',
			mergeMethod: /** @type {const} */ ('none'),
			required: false,
			sortable: false,
			groupable: false,
			infer: /** @type {const} */ ({
				exif: 'DateTimeOriginal'
			})
		},
		{
			id: 'proto__non_exif',
			type: /** @type {const} */ ('string'),
			description: 'Not a EXIF-infered field',
			label: '',
			mergeMethod: /** @type {const} */ ('none'),
			required: false,
			sortable: false,
			groupable: false,
		}
	];
	const metadataValues = {
		proto__gps: {
			value: {
				latitude: 43.46715666666389,
				longitude: 11.885394999997223
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
		}
	};

	// FIXME kinda slow, idk why
	test('without prior GPS location', async () => {
		const imageBytes = await readImageBytes('cyan.jpeg');

		const resultBytes = addExifMetadata(imageBytes, metadataDefs, metadataValues);

		const { tags } = exif.create(resultBytes.buffer).enableImageSize(false).parse();

		expect(tags).toEqual({
			GPSLatitude: 43.46715555555556,
			GPSLatitudeRef: 'N',
			GPSLongitude: 11.885394444444444,
			GPSLongitudeRef: 'E',
			DateTimeOriginal: 1696161600
		});
	});

	test('with prior GPS location', async () => {
		const imageBytes = await readImageBytes('with-exif-gps.jpeg');
		const resultBytes = addExifMetadata(imageBytes, metadataDefs, metadataValues);

		const { tags } = exif.create(resultBytes.buffer).enableImageSize(false).parse();

		expect(tags).toEqual({
			GPSLatitude: 43.46715555555556,
			GPSLatitudeRef: 'N',
			GPSLongitude: 11.885394444444444,
			GPSLongitudeRef: 'E',
			DateTimeOriginal: 1696161600
		});
	});
});
