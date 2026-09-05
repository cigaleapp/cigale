import type * as DB from '$lib/database.js';
import type { DatabaseHandle } from '$lib/idb.svelte.js';
import type { NamespacedMetadataID } from '$lib/schemas/common.js';
import type { MetadataType } from '$lib/schemas/metadata.js';

import { openDatabase } from '$lib/idb.svelte.js';
import { namespacedMetadataId } from '$lib/schemas/metadata.js';

import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { httpInferencesToRefresh, inferHttp } from './http.js';

const PROTOCOL_ID = 'testproto';

function nsId(id: string) {
	return namespacedMetadataId(PROTOCOL_ID, id);
}

function mockMetadata(
	id: string,
	metadataType: MetadataType = 'string',
	extra: Record<string, unknown> = {}
) {
	return {
		id: nsId(id),
		label: `Label ${id}`,
		description: '',
		mergeMethod: 'none',
		required: false,
		type: metadataType,
		...extra,
	};
}

/** A stored metadata value (as found in DB.Image/Observation/Session `metadata`) */
function mockValue(value: unknown) {
	return {
		value: JSON.stringify(value),
		confidence: 1,
		confirmed: false,
		manuallyModified: false,
		isDefault: false,
		alternatives: [],
		confidences: {},
	};
}

let db: DatabaseHandle;

beforeEach(async () => {
	db = await openDatabase();
	await db.clear('Protocol');
	await db.clear('Metadata');
});

afterEach(() => {
	vi.unstubAllGlobals();
});

// ─── inferHttp ────────────────────────────────────────────────────────

describe('inferHttp', () => {
	beforeEach(async () => {
		await db.put('Protocol', {
			id: PROTOCOL_ID,
			name: 'Test protocol',
			authors: [],
			description: '',
			metadata: ['testproto__species'],
		});
	});

	test('fetches the rendered URL and returns the jsonata-selected value', async () => {
		const fetchMock = vi.fn(async () => ({
			json: async () => ({ result: 42 }),
		}));
		vi.stubGlobal('fetch', fetchMock);

		const config = mockMetadata('weight', 'integer', {
			infer: {
				http: {
					needs: ['species'],
					from: 'https://api.example.org/weight?name={{ species.value }}',
					select: 'result',
				},
			},
		});

		const values = {
			[nsId('species')]: mockValue('vulpesvulpes'),
			// Not listed in `needs`: should be excluded from the payload/URL
			[nsId('unused')]: mockValue('should-not-appear'),
		} as Record<NamespacedMetadataID, DB.MetadataValue>;

		const result = await inferHttp(db, PROTOCOL_ID, config as DB.Metadata, values);

		expect(result).toBe(42);
		expect(fetchMock).toHaveBeenCalledWith('https://api.example.org/weight?name=vulpesvulpes');
	});

	test('strips whitespace/newlines from multi-line URL templates', async () => {
		const fetchMock = vi.fn(async () => ({ json: async () => ({ result: 'ok' }) }));
		vi.stubGlobal('fetch', fetchMock);

		const config = mockMetadata('species', 'string', {
			infer: {
				http: {
					needs: [],
					from: 'https://api.example.org/\n  path\n  ?x=1',
					select: 'result',
				},
			},
		});

		await inferHttp(db, PROTOCOL_ID, config as any, {});

		expect(fetchMock).toHaveBeenCalledWith('https://api.example.org/path?x=1');
	});

	test('returns undefined without fetching when the metadata has no http inference config', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		const config = mockMetadata('weight', 'integer');

		const result = await inferHttp(db, PROTOCOL_ID, config as any, {});

		expect(result).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test('returns undefined without fetching when the rendered URL is not a valid URL', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		const config = mockMetadata('weight', 'integer', {
			infer: {
				http: {
					needs: [],
					from: 'not-a-real-url',
					select: 'result',
				},
			},
		});

		const result = await inferHttp(db, PROTOCOL_ID, config as any, {});

		expect(result).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

// ─── httpInferencesToRefresh ─────────────────────────────────────────

describe('httpInferencesToRefresh', () => {
	test('flags metadata whose http-inference dependency changed (no granularity set)', async () => {
		const speciesId = nsId('species');
		const weightId = nsId('weight');

		await db.put('Protocol', {
			id: PROTOCOL_ID,
			metadata: [speciesId, weightId],
			importedMetadata: [],
		});
		await db.add('Metadata', mockMetadata('species', 'string'));
		await db.add(
			'Metadata',
			mockMetadata('weight', 'integer', {
				infer: {
					http: {
						needs: ['species'],
						from: 'https://api.example.org/weight',
						select: 'result',
					},
				},
			})
		);

		const toRefresh = await httpInferencesToRefresh(db, PROTOCOL_ID, {
			[speciesId]: ['Vulpes vulpes', 'Rosalia alpina'],
		});

		expect(toRefresh.map((m) => m.id)).toEqual([weightId]);
	});

	test('does not flag metadata when the dependency value did not change', async () => {
		const speciesId = nsId('species');
		const weightId = nsId('weight');

		await db.put('Protocol', {
			id: PROTOCOL_ID,
			metadata: [speciesId, weightId],
			importedMetadata: [],
		});
		await db.add('Metadata', mockMetadata('species', 'string'));
		await db.add(
			'Metadata',
			mockMetadata('weight', 'integer', {
				infer: {
					http: {
						needs: ['species'],
						from: 'https://api.example.org/weight',
						select: 'result',
					},
				},
			})
		);

		const toRefresh = await httpInferencesToRefresh(db, PROTOCOL_ID, {
			[speciesId]: ['Vulpes vulpes', 'Vulpes vulpes'],
		});

		expect(toRefresh).toEqual([]);
	});

	test('ignores metadata that has no http inference config', async () => {
		const speciesId = nsId('species');
		const genusId = nsId('genus');

		await db.put('Protocol', {
			id: PROTOCOL_ID,
			metadata: [speciesId, genusId],
			importedMetadata: [],
		});
		await db.add('Metadata', mockMetadata('species', 'string'));
		// `genus` has no `infer` at all
		await db.add('Metadata', mockMetadata('genus', 'string'));

		const toRefresh = await httpInferencesToRefresh(db, PROTOCOL_ID, {
			[speciesId]: ['a', 'b'],
		});

		expect(toRefresh).toEqual([]);
	});

	test('only flags a metadata with numeric granularity once the change exceeds the threshold', async () => {
		const speciesId = nsId('species');
		const weightId = nsId('weight');

		await db.put('Protocol', {
			id: PROTOCOL_ID,
			metadata: [speciesId, weightId],
			importedMetadata: [],
		});
		await db.add('Metadata', mockMetadata('species', 'integer'));
		await db.add(
			'Metadata',
			mockMetadata('weight', 'integer', {
				infer: {
					http: {
						needs: ['species'],
						from: 'https://api.example.org/weight',
						select: 'result',
						granularities: { species: 5 },
					},
				},
			})
		);

		const belowThreshold = await httpInferencesToRefresh(db, PROTOCOL_ID, {
			[speciesId]: [10, 13],
		});
		expect(belowThreshold).toEqual([]);

		const aboveThreshold = await httpInferencesToRefresh(db, PROTOCOL_ID, {
			[speciesId]: [10, 16],
		});
		expect(aboveThreshold.map((m) => m.id)).toEqual([weightId]);
	});
});
