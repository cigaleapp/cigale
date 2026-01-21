import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, test } from 'vitest';

import * as db from './idb.svelte.js';
import { imageId } from './images.js';
import { namespacedMetadataId } from './schemas/metadata.js';
import { deleteSession } from './sessions.js';

describe('deleteSession', () => {
	beforeEach(async () => {
		db.nukeDatabase();

		const imgid = (/** @type {string} */ id) => imageId(id.toUpperCase().padStart(26, '0'), 0);

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

		await db.tables.Session.set({
			id: 'session1',
			name: 'Session 1',
			description: '',
			protocol: 'protocol1',
			createdAt: new Date().toISOString(),
			openedAt: new Date().toISOString(),
			metadata: {
				[namespacedMetadataId('com.example.test.protocol', 'no_exif')]: {
					alternatives: {},
					value: '"oui"',
					confidence: 1
				}
			}
		});

		await db.tables.Image.set({
			id: imgid('image1'),
			sessionId: 'session1',
			filename: 'image1.jpg',
			contentType: 'image/jpeg',
			dimensions: { width: 100, height: 100 },
			fileId: 'file_image1',
			addedAt: new Date().toISOString(),
			metadata: {}
		});

		await db.tables.Image.set({
			id: imgid('image2'),
			sessionId: 'session1',
			filename: 'image2.jpg',
			contentType: 'image/jpeg',
			dimensions: { width: 100, height: 100 },
			fileId: 'file_image2',
			addedAt: new Date().toISOString(),
			metadata: {}
		});

		// Image from other session

		await db.tables.Image.set({
			id: imgid('image3'),
			sessionId: 'session2',
			filename: 'image3.jpg',
			contentType: 'image/jpeg',
			dimensions: { width: 100, height: 100 },
			fileId: 'file_image3',
			addedAt: '2025-12-09T11:57:15.440Z',
			metadata: {}
		});

		await db.tables.Observation.set({
			id: 'observation1',
			sessionId: 'session1',
			label: 'Observation 1',
			images: [imgid('image1')],
			addedAt: '2025-12-09T11:57:15.440Z',
			metadataOverrides: {}
		});

		await db.tables.Observation.set({
			id: 'observation2',
			sessionId: 'session2',
			label: 'Observation 2',
			images: [imgid('image3')],
			addedAt: '2025-12-09T11:57:15.440Z',
			metadataOverrides: {}
		});
	});

	test('deletes session and related data', async () => {
		await deleteSession('session1');

		expect(await db.tables.Protocol.list()).toMatchInlineSnapshot(`
			[
			  {
			    "authors": [],
			    "crop": {
			      "metadata": "com.example.test.protocol.crop",
			      "padding": "0px",
			    },
			    "description": "Test Protocol",
			    "dirty": false,
			    "id": "com.example.test.protocol",
			    "learnMore": "https://example.com",
			    "metadata": [
			      "com.example.test.protocol__date",
			      "com.example.test.protocol__location",
			      "com.example.test.protocol__no_exif",
			    ],
			    "name": "Test Protocol",
			    "sessionMetadata": [],
			    "updates": "manual",
			  },
			]
		`);
		expect(await db.tables.Metadata.list()).toMatchInlineSnapshot(`
			[
			  {
			    "description": "",
			    "id": "com.example.test.protocol__date",
			    "infer": {
			      "exif": "DateTimeOriginal",
			    },
			    "label": "",
			    "learnMore": "https://example.com",
			    "mergeMethod": "none",
			    "required": false,
			    "type": "date",
			  },
			  {
			    "description": "",
			    "id": "com.example.test.protocol__location",
			    "infer": {
			      "latitude": {
			        "exif": "GPSLatitude",
			      },
			      "longitude": {
			        "exif": "GPSLongitude",
			      },
			    },
			    "label": "",
			    "learnMore": "https://example.com",
			    "mergeMethod": "none",
			    "required": false,
			    "type": "location",
			  },
			  {
			    "description": "",
			    "id": "com.example.test.protocol__no_exif",
			    "label": "",
			    "learnMore": "https://example.com",
			    "mergeMethod": "none",
			    "required": false,
			    "type": "string",
			  },
			]
		`);
		expect(await db.tables.Session.list()).toMatchInlineSnapshot(`[]`);
		expect(await db.tables.Image.list()).toMatchInlineSnapshot(`
			[
			  {
			    "addedAt": 2025-12-09T11:57:15.440Z,
			    "boundingBoxesAnalyzed": false,
			    "contentType": "image/jpeg",
			    "dimensions": {
			      "aspectRatio": 1,
			      "height": 100,
			      "width": 100,
			    },
			    "fileId": "file_image3",
			    "filename": "image3.jpg",
			    "id": "00000000000000000000IMAGE3_000000",
			    "metadata": {},
			    "sessionId": "session2",
			  },
			]
		`);
		expect(await db.tables.Observation.list()).toMatchInlineSnapshot(`
			[
			  {
			    "addedAt": 2025-12-09T11:57:15.440Z,
			    "id": "observation2",
			    "images": [
			      "00000000000000000000IMAGE3_000000",
			    ],
			    "label": "Observation 2",
			    "metadataOverrides": {},
			    "sessionId": "session2",
			  },
			]
		`);
	});
});
