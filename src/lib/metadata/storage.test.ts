import { openDatabase, type DatabaseHandle } from '$lib/idb.svelte.js';
import { namespacedMetadataId, metadataOptionId, MetadataType } from '$lib/schemas/metadata.js';

import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, test } from 'vitest';

import { storeMetadataValue, storeMetadataErrors, deleteMetadataValue } from './storage.js';

const PROTOCOL_ID = 'testproto';
const SESSION_ID = 'sess001';

function nsId(id: string) {
	return namespacedMetadataId(PROTOCOL_ID, id);
}

function mockMetadata(id: string, metadataType: MetadataType = 'enum') {
	return {
		id: nsId(id),
		label: `Label ${id}`,
		description: '',
		mergeMethod: 'none',
		required: false,
		type: metadataType
	} as const;
}

function mockImage(id: string, sessionId = SESSION_ID, fileId = 'file001') {
	return {
		id,
		filename: `${id}.jpg`,
		addedAt: new Date().toISOString(),
		dimensions: { width: 100, height: 100 },
		metadata: {},
		metadataErrors: {},
		contentType: 'image/jpeg',
		fileId,
		sessionId,
		boundingBoxesAnalyzed: false
	};
}

function mockObservation(id: string, imageIds: string[], sessionId = SESSION_ID) {
	return {
		id,
		sessionId,
		label: `Observation ${id}`,
		addedAt: new Date().toISOString(),
		metadataOverrides: {},
		metadataErrors: {},
		images: imageIds
	};
}

function mockSession(id = SESSION_ID) {
	return {
		id,
		name: 'Test Session',
		createdAt: new Date().toISOString(),
		openedAt: new Date().toISOString(),
		description: '',
		protocol: PROTOCOL_ID,
		metadata: {}
	};
}

let db: DatabaseHandle;

beforeEach(async () => {
	db = await openDatabase();
	await db.clear('Image');
	await db.clear('Observation');
	await db.clear('Session');
	await db.clear('Metadata');
	await db.clear('MetadataOption');
});

// ─── storeMetadataValue ──────────────────────────────────────────────

describe('storeMetadataValue', () => {
	test('stores a string metadata value on an image', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'string'));
		await db.add('Image', mockImage('1'));

		await storeMetadataValue({
			db,
			subjectId: '1',
			metadataId,
			type: 'string',
			value: 'Rosalia alpina',
			sessionId: SESSION_ID
		});

		const img = await db.get('Image', '1');
		expect(img?.metadata[metadataId]).toMatchObject({
			value: '"Rosalia alpina"',
			confidence: 1,
			confirmed: false,
			manuallyModified: false
		});
	});

	test('stores an enum metadata value on an image', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'enum'));
		await db.add('Image', mockImage('1'));

		await storeMetadataValue({
			db,
			subjectId: '1',
			metadataId,
			type: 'enum',
			value: 'option1',
			confidence: 0.8,
			sessionId: SESSION_ID
		});

		const img = await db.get('Image', '1');
		expect(img?.metadata[metadataId]).toMatchObject({
			value: '"option1"',
			confidence: 0.8
		});
	});

	test('stores metadata value on an observation', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'string'));
		await db.add('Observation', mockObservation('o1', ['1']));

		await storeMetadataValue({
			db,
			subjectId: 'o1',
			metadataId,
			value: 'Lamia textor',
			sessionId: SESSION_ID
		});

		const obs = await db.get('Observation', 'o1');
		expect(obs?.metadataOverrides[metadataId]).toMatchObject({
			value: '"Lamia textor"'
		});
	});

	test('stores metadata value on a session', async () => {
		const metadataId = nsId('location');
		await db.add('Metadata', mockMetadata('location', 'string'));
		await db.add('Session', mockSession());

		await storeMetadataValue({
			db,
			subjectId: SESSION_ID,
			metadataId,
			value: 'Forest',
			sessionId: SESSION_ID
		});

		const session = await db.get('Session', SESSION_ID);
		expect(session?.metadata[metadataId]).toMatchObject({
			value: '"Forest"'
		});
	});

	test('stores alternatives and excludes the main value from them', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'enum'));
		await db.add('Image', mockImage('1'));

		await storeMetadataValue({
			db,
			subjectId: '1',
			metadataId,
			value: 'a',
			confidence: 0.6,
			alternatives: [
				{ value: 'a', confidence: 0.6 },
				{ value: 'b', confidence: 0.3 },
				{ value: 'c', confidence: 0.1 }
			],
			sessionId: SESSION_ID
		});

		const img = await db.get('Image', '1');
		const stored = img?.metadata[metadataId];
		// The main value "a" should NOT appear in alternatives
		expect(stored?.alternatives).not.toHaveProperty('"a"');
		expect(stored?.alternatives).toHaveProperty('"b"');
		expect(stored?.alternatives).toHaveProperty('"c"');
	});

	test('caps confidence > 1 to 1', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'string'));
		await db.add('Image', mockImage('1'));

		await storeMetadataValue({
			db,
			subjectId: '1',
			metadataId,
			value: 'test',
			confidence: 5,
			sessionId: SESSION_ID
		});

		const img = await db.get('Image', '1');
		expect(img?.metadata[metadataId]?.confidence).toBe(1);
	});

	test('caps alternative confidence > 1 to 1', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'enum'));
		await db.add('Image', mockImage('1'));

		await storeMetadataValue({
			db,
			subjectId: '1',
			metadataId,
			value: 'a',
			alternatives: [{ value: 'b', confidence: 2.5 }],
			sessionId: SESSION_ID
		});

		const img = await db.get('Image', '1');
		expect(img?.metadata[metadataId]?.alternatives['"b"']).toBe(1);
	});

	test('throws if metadataId is not namespaced', async () => {
		await db.add('Metadata', mockMetadata('species'));
		await db.add('Image', mockImage('1'));

		await expect(
			storeMetadataValue({
				db,
				subjectId: '1',
				metadataId: 'species', // not namespaced
				value: 'test',
				sessionId: SESSION_ID
			})
		).rejects.toThrow("n'est pas namespacé");
	});

	test('throws if metadata does not exist in db', async () => {
		await db.add('Image', mockImage('1'));

		await expect(
			storeMetadataValue({
				db,
				subjectId: '1',
				metadataId: nsId('nonexistent'),
				value: 'test',
				sessionId: SESSION_ID
			})
		).rejects.toThrow('inconnue');
	});

	test('throws on type mismatch', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'string'));
		await db.add('Image', mockImage('1'));

		await expect(
			storeMetadataValue({
				db,
				subjectId: '1',
				metadataId,
				type: 'integer',
				value: 42,
				sessionId: SESSION_ID
			})
		).rejects.toThrow('incorrect');
	});

	test('clears metadataErrors by default when storing on image', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'string'));
		await db.add('Image', {
			...mockImage('1'),
			metadataErrors: {
				[metadataId]: [
					{
						message: 'previous error',
						details: null,
						stack: '',
						ignored: false,
						happenedAt: new Date().toISOString(),
						kind: 'inference'
					}
				]
			}
		});

		await storeMetadataValue({
			db,
			subjectId: '1',
			metadataId,
			value: 'fixed',
			sessionId: SESSION_ID
		});

		const img = await db.get('Image', '1');
		expect(img?.metadataErrors?.[metadataId]).toBeUndefined();
	});

	test('preserves metadataErrors when clearErrors=false', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'string'));
		await db.add('Image', {
			...mockImage('1'),
			metadataErrors: {
				[metadataId]: [
					{
						message: 'keep me',
						details: null,
						stack: '',
						ignored: false,
						happenedAt: new Date().toISOString(),
						kind: 'inference'
					}
				]
			}
		});

		await storeMetadataValue({
			db,
			subjectId: '1',
			metadataId,
			value: 'updated',
			clearErrors: false,
			sessionId: SESSION_ID
		});

		const img = await db.get('Image', '1');
		expect(img?.metadataErrors?.[metadataId]).toHaveLength(1);
	});

	test('sets manuallyModified and confirmed flags', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'string'));
		await db.add('Image', mockImage('1'));

		await storeMetadataValue({
			db,
			subjectId: '1',
			metadataId,
			value: 'manual',
			manuallyModified: true,
			confirmed: true,
			sessionId: SESSION_ID
		});

		const img = await db.get('Image', '1');
		expect(img?.metadata[metadataId]).toMatchObject({
			manuallyModified: true,
			confirmed: true
		});
	});

	test('throws if subject does not exist', async () => {
		await db.add('Metadata', mockMetadata('species'));

		await expect(
			storeMetadataValue({
				db,
				subjectId: 'nonexistent',
				metadataId: nsId('species'),
				value: 'test',
				sessionId: SESSION_ID
			})
		).rejects.toThrow();
	});

	test('aborts when abortSignal is already aborted', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'string'));
		await db.add('Image', mockImage('1'));

		const controller = new AbortController();
		controller.abort();

		await expect(
			storeMetadataValue({
				db,
				subjectId: '1',
				metadataId,
				value: 'nope',
				abortSignal: controller.signal,
				sessionId: SESSION_ID
			})
		).rejects.toThrow();
	});

	test('stores value on all images matching a fileId when subjectId is the fileId', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'string'));
		// Two images sharing the same fileId
		await db.add('Image', mockImage('1', SESSION_ID, 'sharedFile'));
		await db.add('Image', mockImage('2', SESSION_ID, 'sharedFile'));
		// One with a different fileId
		await db.add('Image', mockImage('3', SESSION_ID, 'otherFile'));

		await storeMetadataValue({
			db,
			subjectId: 'sharedFile',
			metadataId,
			value: 'shared value',
			sessionId: SESSION_ID
		});

		const img1 = await db.get('Image', '1');
		const img2 = await db.get('Image', '2');
		const img3 = await db.get('Image', '3');

		expect(img1?.metadata[metadataId]?.value).toBe('"shared value"');
		expect(img2?.metadata[metadataId]?.value).toBe('"shared value"');
		expect(img3?.metadata[metadataId]).toBeUndefined();
	});

	test('cascades metadata through enum options', async () => {
		const speciesId = nsId('species');
		const genusId = nsId('genus');

		await db.add('Metadata', mockMetadata('species', 'enum'));
		await db.add('Metadata', mockMetadata('genus', 'enum'));
		await db.add('Image', mockImage('1'));

		// Set up cascade: species option "1" cascades to genus "2"
		await db.add('MetadataOption', {
			metadataId: speciesId,
			id: metadataOptionId(speciesId, '1'),
			key: '1',
			label: 'Species 1',
			synonyms: [],
			cascade: { [genusId]: '2' }
		});
		await db.add('MetadataOption', {
			metadataId: genusId,
			id: metadataOptionId(genusId, '2'),
			key: '2',
			label: 'Genus 2',
			synonyms: []
		});

		await storeMetadataValue({
			db,
			subjectId: '1',
			metadataId: speciesId,
			value: '1',
			confidence: 0.9,
			sessionId: SESSION_ID
		});

		const img = await db.get('Image', '1');
		// The cascaded genus metadata should have been stored
		expect(img?.metadata[genusId]).toBeDefined();
		expect(img?.metadata[genusId]?.value).toBe('"2"');
	});

	test('overwrites previously stored metadata', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'string'));
		await db.add('Image', mockImage('1'));

		await storeMetadataValue({
			db,
			subjectId: '1',
			metadataId,
			value: 'first',
			sessionId: SESSION_ID
		});

		await storeMetadataValue({
			db,
			subjectId: '1',
			metadataId,
			value: 'second',
			confidence: 0.5,
			sessionId: SESSION_ID
		});

		const img = await db.get('Image', '1');
		expect(img?.metadata[metadataId]?.value).toBe('"second"');
		expect(img?.metadata[metadataId]?.confidence).toBe(0.5);
	});
});

// ─── storeMetadataErrors ─────────────────────────────────────────────

describe('storeMetadataErrors', () => {
	test('stores errors on an image', async () => {
		const metadataId = nsId('species');
		await db.add('Image', mockImage('1'));

		await storeMetadataErrors(
			{ db, subjectId: '1', sessionId: SESSION_ID, metadataId },
			{
				message: 'Inference failed',
				details: { reason: 'timeout' },
				kind: 'inference'
			}
		);

		const img = await db.get('Image', '1');
		expect(img?.metadataErrors?.[metadataId]).toHaveLength(1);
		expect(img?.metadataErrors?.[metadataId]?.[0]).toMatchObject({
			message: 'Inference failed',
			kind: 'inference'
		});
	});

	test('stores errors on an observation', async () => {
		const metadataId = nsId('species');
		await db.add('Observation', mockObservation('o1', ['1']));

		await storeMetadataErrors(
			{ db, subjectId: 'o1', sessionId: SESSION_ID, metadataId },
			{
				message: 'Bad value',
				details: null,
				kind: 'inference'
			}
		);

		const obs = await db.get('Observation', 'o1');
		expect(obs?.metadataErrors?.[metadataId]).toHaveLength(1);
		expect(obs?.metadataErrors?.[metadataId]?.[0]).toMatchObject({
			message: 'Bad value'
		});
	});

	test('stores multiple errors at once', async () => {
		const metadataId = nsId('species');
		await db.add('Image', mockImage('1'));

		await storeMetadataErrors(
			{ db, subjectId: '1', sessionId: SESSION_ID, metadataId },
			{ message: 'Error 1', details: null, kind: 'inference' },
			{ message: 'Error 2', details: 'info', kind: 'inference' }
		);

		const img = await db.get('Image', '1');
		expect(img?.metadataErrors?.[metadataId]).toHaveLength(2);
	});

	test('handles non-JSONable details gracefully', async () => {
		const metadataId = nsId('species');
		await db.add('Image', mockImage('1'));

		const circular: Record<string, unknown> = {};
		circular.self = circular;

		await storeMetadataErrors(
			{ db, subjectId: '1', sessionId: SESSION_ID, metadataId },
			{ message: 'Bad details', details: circular, kind: 'inference' }
		);

		const img = await db.get('Image', '1');
		const stored = img?.metadataErrors?.[metadataId]?.[0];
		expect(stored?.details).toContain('Non-JSONable');
	});

	test('stores errors on images matching fileId', async () => {
		const metadataId = nsId('species');
		await db.add('Image', mockImage('1', SESSION_ID, 'sharedFile'));
		await db.add('Image', mockImage('2', SESSION_ID, 'sharedFile'));
		await db.add('Image', mockImage('3', SESSION_ID, 'otherFile'));

		await storeMetadataErrors(
			{ db, subjectId: 'sharedFile', sessionId: SESSION_ID, metadataId },
			{ message: 'File error', details: null, kind: 'inference' }
		);

		const img1 = await db.get('Image', '1');
		const img2 = await db.get('Image', '2');
		const img3 = await db.get('Image', '3');

		expect(img1?.metadataErrors?.[metadataId]).toHaveLength(1);
		expect(img2?.metadataErrors?.[metadataId]).toHaveLength(1);
		expect(img3?.metadataErrors?.[metadataId]).toBeUndefined();
	});

	test('throws if subject does not exist', async () => {
		await expect(
			storeMetadataErrors(
				{ db, subjectId: 'nope', sessionId: SESSION_ID, metadataId: nsId('x') },
				{ message: 'err', details: null, kind: 'inference' }
			)
		).rejects.toThrow();
	});
});

// ─── deleteMetadataValue ─────────────────────────────────────────────

describe('deleteMetadataValue', () => {
	test('deletes metadata from an image', async () => {
		const metadataId = nsId('species');
		await db.add('Metadata', mockMetadata('species', 'string'));
		await db.add('Image', {
			...mockImage('1'),
			metadata: {
				[metadataId]: {
					value: '"Rosalia alpina"',
					confidence: 1,
					confirmed: false,
					manuallyModified: false,
					alternatives: {}
				}
			}
		});

		await deleteMetadataValue({
			db,
			subjectId: '1',
			metadataId,
			sessionId: SESSION_ID
		});

		const img = await db.get('Image', '1');
		expect(img?.metadata[metadataId]).toBeUndefined();
	});

	test('deletes metadata from a session', async () => {
		const metadataId = nsId('location');
		await db.add('Session', {
			...mockSession(),
			metadata: {
				[metadataId]: {
					value: '"Forest"',
					confidence: 1,
					confirmed: false,
					manuallyModified: false,
					alternatives: {}
				}
			}
		});

		await deleteMetadataValue({
			db,
			subjectId: SESSION_ID,
			metadataId,
			sessionId: SESSION_ID
		});

		const session = await db.get('Session', SESSION_ID);
		expect(session?.metadata[metadataId]).toBeUndefined();
	});

	test('deletes metadata from an observation', async () => {
		const metadataId = nsId('species');
		await db.add('Observation', {
			...mockObservation('o1', ['1']),
			metadataOverrides: {
				[metadataId]: {
					value: '"test"',
					confidence: 1,
					confirmed: false,
					manuallyModified: false,
					alternatives: {}
				}
			}
		});

		await deleteMetadataValue({
			db,
			subjectId: 'o1',
			metadataId,
			sessionId: SESSION_ID
		});

		const obs = await db.get('Observation', 'o1');
		expect(obs?.metadataOverrides[metadataId]).toBeUndefined();
	});

	test('recursively deletes from observation images', async () => {
		const metadataId = nsId('species');
		const metaValue = {
			value: '"val"',
			confidence: 1,
			confirmed: false,
			manuallyModified: false,
			alternatives: {}
		};

		await db.add('Image', {
			...mockImage('1'),
			metadata: { [metadataId]: metaValue }
		});
		await db.add('Image', {
			...mockImage('2'),
			metadata: { [metadataId]: metaValue }
		});
		await db.add('Observation', {
			...mockObservation('o1', ['1', '2']),
			metadataOverrides: { [metadataId]: metaValue }
		});

		await deleteMetadataValue({
			db,
			subjectId: 'o1',
			metadataId,
			recursive: true,
			sessionId: SESSION_ID
		});

		const obs = await db.get('Observation', 'o1');
		const img1 = await db.get('Image', '1');
		const img2 = await db.get('Image', '2');

		expect(obs?.metadataOverrides[metadataId]).toBeUndefined();
		expect(img1?.metadata[metadataId]).toBeUndefined();
		expect(img2?.metadata[metadataId]).toBeUndefined();
	});

	test('deletes from images matching fileId', async () => {
		const metadataId = nsId('species');
		const metaValue = {
			value: '"val"',
			confidence: 1,
			confirmed: false,
			manuallyModified: false,
			alternatives: {}
		};

		await db.add('Image', {
			...mockImage('1', SESSION_ID, 'sharedFile'),
			metadata: { [metadataId]: metaValue }
		});
		await db.add('Image', {
			...mockImage('2', SESSION_ID, 'sharedFile'),
			metadata: { [metadataId]: metaValue }
		});

		await deleteMetadataValue({
			db,
			subjectId: 'sharedFile',
			metadataId,
			sessionId: SESSION_ID
		});

		const img1 = await db.get('Image', '1');
		const img2 = await db.get('Image', '2');
		expect(img1?.metadata[metadataId]).toBeUndefined();
		expect(img2?.metadata[metadataId]).toBeUndefined();
	});

	test('throws if subject does not exist', async () => {
		await expect(
			deleteMetadataValue({
				db,
				subjectId: 'nonexistent',
				metadataId: nsId('species'),
				sessionId: SESSION_ID
			})
		).rejects.toThrow();
	});

	test('does not delete other metadata on the same subject', async () => {
		const speciesId = nsId('species');
		const genusId = nsId('genus');
		const metaValue = {
			value: '"val"',
			confidence: 1,
			confirmed: false,
			manuallyModified: false,
			alternatives: {}
		};

		await db.add('Image', {
			...mockImage('1'),
			metadata: {
				[speciesId]: metaValue,
				[genusId]: metaValue
			}
		});

		await deleteMetadataValue({
			db,
			subjectId: '1',
			metadataId: speciesId,
			sessionId: SESSION_ID
		});

		const img = await db.get('Image', '1');
		expect(img?.metadata[speciesId]).toBeUndefined();
		expect(img?.metadata[genusId]).toBeDefined();
	});
});
