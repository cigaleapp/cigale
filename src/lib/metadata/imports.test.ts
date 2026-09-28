import type { DatabaseHandle } from '$lib/idb.svelte.js';
import type { NamespacedMetadataID } from '$lib/schemas/common.js';

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ExportedProtocol, ProtocolRegistry } from '$lib/schemas/protocols.js';

import { resolveProtocolImports } from './imports.js';

const mocked = vi.hoisted(() => ({
	registry: undefined as (typeof ProtocolRegistry)['inferIn'] | undefined,
}));

vi.mock(import('$lib/protocols/registry.js'), async (original) => ({
	...(await original()),
	fetchProtocolRegistry: async () => mocked.registry!,
}));

function mockRegistry(registry: (typeof ProtocolRegistry)['inferIn']) {
	mocked.registry = registry;
}

/** Helper to create a mock DatabaseHandle with a configurable `get` */
function mockDb(existing: Record<string, Record<string, unknown>> = {}) {
	return {
		get: vi.fn(async (store: string, key: string) => existing[store]?.[key] ?? undefined),
	} as unknown as DatabaseHandle;
}

/** Helper to build an importedMetadata entry */
function imp(source: NamespacedMetadataID, target: NamespacedMetadataID, sessionwide = false) {
	return { source, target, sessionwide };
}

/**
 * Minimal fake exported protocol input (shape that passes ExportedProtocol.assert).
 * `imports` uses the ExportedProtocol input format: `{ from, metadata, sessionMetadata }`.
 */
function fakeExportedProtocol(
	id: string,
	imports: { from: string; metadata: string[]; sessionMetadata?: string[] }[] = []
) {
	return {
		id,
		name: `Protocol ${id}`,
		description: `Description of ${id}`,
		authors: [{ name: 'Test Author' }],
		metadata: {},
		imports: imports.map(({ from, metadata, sessionMetadata }) => ({
			from,
			metadata: metadata,
			sessionMetadata: sessionMetadata ?? [],
		})),
	};
}

describe('resolveProtocolImports', () => {
	beforeEach(() => {
		// Reset module-level cache
		vi.restoreAllMocks();
	});

	test('returns empty array when imports is empty', async () => {
		const result = await resolveProtocolImports(mockDb(), {
			id: 'my-protocol',
			importedMetadata: [],
			importedMetadataGroups: [],
		});
		expect(result).toEqual([]);
	});

	test('fetches registry and resolves a single import', async () => {
		const parentInput = fakeExportedProtocol('parent-protocol');

		mockRegistry({
			protocols: [
				{
					name: 'Parent',
					id: 'parent-protocol',
					url: 'https://example.com/parent.json',
				},
			],
		});

		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({
				json: async () => parentInput,
			}))
		);

		const result = await resolveProtocolImports(mockDb(), {
			id: 'my-protocol',
			importedMetadata: [imp('parent-protocol__field1', 'my-protocol__field1')],
			importedMetadataGroups: [],
		});

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('parent-protocol');
	});

	test('skips protocols already resolved', async () => {
		const alreadyResolved = new Map([
			['parent-protocol', { id: 'parent-protocol' } as typeof ExportedProtocol.infer],
		]);

		mockRegistry({
			protocols: [
				{
					name: 'Parent',
					id: 'parent-protocol',
					url: 'https://example.com/parent.json',
				},
			],
		});

		const result = await resolveProtocolImports(
			mockDb(),
			{
				id: 'my-protocol',
				importedMetadata: [imp('parent-protocol__field1', 'my-protocol__field1')],
				importedMetadataGroups: [],
			},
			alreadyResolved
		);

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('parent-protocol');
	});

	test('skips protocols already in the database', async () => {
		mockRegistry({
			protocols: [
				{
					name: 'Parent',
					id: 'parent-protocol',
					url: 'https://example.com/parent.json',
				},
			],
		});

		const db = mockDb({ Protocol: { 'parent-protocol': { id: 'parent-protocol' } } });

		const result = await resolveProtocolImports(db, {
			id: 'my-protocol',
			importedMetadata: [imp('parent-protocol__field1', 'my-protocol__field1')],
			importedMetadataGroups: [],
		});

		expect(result).toEqual([]);
		expect(db.get).toHaveBeenCalledWith('Protocol', 'parent-protocol');
	});

	test('throws for unknown protocol in registry', async () => {
		mockRegistry({ protocols: [] }); // empty registry

		await expect(
			resolveProtocolImports(mockDb(), {
				id: 'my-protocol',
				importedMetadata: [imp('unknown-protocol__field1', 'my-protocol__field1')],
				importedMetadataGroups: [],
			})
		).rejects.toThrow('inherits from unknown protocol unknown-protocol');
	});

	test('deduplicates imports from the same protocol', async () => {
		const parentInput = fakeExportedProtocol('parent-protocol');

		mockRegistry({
			protocols: [
				{
					name: 'Parent',
					id: 'parent-protocol',
					url: 'https://example.com/parent.json',
				},
			],
		});

		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({
				json: async () => parentInput,
			}))
		);

		const result = await resolveProtocolImports(mockDb(), {
			id: 'my-protocol',
			importedMetadata: [
				imp('parent-protocol__field1', 'my-protocol__field1'),
				imp('parent-protocol__field2', 'my-protocol__field2'),
			],
			importedMetadataGroups: [],
		});

		expect(result).toHaveLength(1);
		// one protocol fetch
		expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
	});

	test('resolves recursive imports', async () => {
		const grandparentInput = fakeExportedProtocol('grandparent');
		const parentInput = fakeExportedProtocol('parent', [
			{ from: 'grandparent', metadata: ['field'] },
		]);

		mockRegistry({
			protocols: [
				{
					name: 'Parent',
					id: 'parent',
					url: 'https://example.com/proto-parent.json',
				},
				{
					name: 'Grandparent',
					id: 'grandparent',
					url: 'https://example.com/proto-grandparent.json',
				},
			],
		});

		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: string) => ({
				json: async () => {
					if (url.includes('proto-grandparent.json')) return grandparentInput;
					if (url.includes('proto-parent.json')) return parentInput;
					throw new Error(`Unexpected fetch: ${url}`);
				},
			}))
		);

		const result = await resolveProtocolImports(mockDb(), {
			id: 'child',
			importedMetadata: [imp('parent__field', 'child__field')],
			importedMetadataGroups: [],
		});

		expect(result).toHaveLength(2);
		const ids = result.map((p) => p.id);
		expect(ids).toContain('parent');
		expect(ids).toContain('grandparent');
	});
});
