import type { DatabaseHandle } from '$lib/idb.svelte.js';
import type { NamespacedMetadataID } from '$lib/schemas/common.js';
import { namespaceOfMetadataId } from '$lib/schemas/metadata.js';
import { ExportedProtocol, ProtocolRegistry } from '$lib/schemas/protocols.js';

let PROTOCOLS_REGISTRY: typeof ProtocolRegistry.infer | null = null;

/**
 * Downloads (recursively) all the protocols needed to import the given protocol
 */
export async function resolveProtocolImports(
	db: DatabaseHandle,
	protocolId: string,
	imports: (typeof ExportedProtocol.inferOut)['importedMetadata'],
	/** Resolved imports  */
	resolved = new Map<string, typeof ExportedProtocol.infer>()
): Promise<(typeof ExportedProtocol.infer)[]> {
	if (imports.length === 0) {
		return [];
	}

	if (!PROTOCOLS_REGISTRY) {
		PROTOCOLS_REGISTRY = await fetch(
			'https://raw.githubusercontent.com/cigaleapp/cigale/main/protocols/registry.json'
		)
			.then((res) => res.json())
			.then((data) => ProtocolRegistry.assert(data));
	}

	const importedProtocolIds = new Set(imports.map((imp) => namespaceOfMetadataId(imp.source)));

	for (const from of importedProtocolIds) {
		if (resolved.has(from)) {
			continue;
		}

		if (await db.get('Protocol', from)) {
			// Protocol already in the database, we can skip it
			continue;
		}

		const registryEntry = PROTOCOLS_REGISTRY?.protocols.find((entry) => entry.id === from);

		if (!registryEntry) {
			throw new Error(`Protocol ${protocolId} inherits from unknown protocol ${from}`);
		}

		const parentProtocol = await fetch(registryEntry.url)
			.then((res) => res.json())
			.then((data) => ExportedProtocol.assert(data));

		// TODO resolve parentProtocol.importedMetadata in case there's a >2-depth import. We can also detect import cycles there

		resolved.set(from, parentProtocol);

		await resolveProtocolImports(
			db,
			parentProtocol.id,
			parentProtocol.importedMetadata,
			resolved
		);
	}

	return [...resolved.values()];
}

if (import.meta.vitest) {
	const { test, expect, describe, beforeEach, vi } = import.meta.vitest;

	/** Helper to create a mock DatabaseHandle with a configurable `get` */
	function mockDb(existing: Record<string, Record<string, unknown>> = {}) {
		return {
			get: vi.fn(async (store: string, key: string) => existing[store]?.[key] ?? undefined)
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
				sessionMetadata: sessionMetadata ?? []
			}))
		};
	}

	describe('resolveProtocolImports', () => {
		beforeEach(() => {
			// Reset module-level cache
			PROTOCOLS_REGISTRY = null;
			vi.restoreAllMocks();
		});

		test('returns empty array when imports is empty', async () => {
			const result = await resolveProtocolImports(mockDb(), 'my-protocol', []);
			expect(result).toEqual([]);
		});

		test('fetches registry and resolves a single import', async () => {
			const parentInput = fakeExportedProtocol('parent-protocol');

			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => ({
					json: async () => {
						if (url.includes('registry.json')) {
							return { protocols: [{ id: 'parent-protocol', url: 'https://example.com/parent.json' }] };
						}
						return parentInput;
					}
				}))
			);

			const result = await resolveProtocolImports(
				mockDb(),
				'my-protocol',
				[imp('parent-protocol__field1', 'my-protocol__field1')]
			);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('parent-protocol');
		});

		test('skips protocols already resolved', async () => {
			const alreadyResolved = new Map([
				['parent-protocol', { id: 'parent-protocol' } as typeof ExportedProtocol.infer]
			]);

			vi.stubGlobal(
				'fetch',
				vi.fn(async () => ({
					json: async () => ({ protocols: [{ id: 'parent-protocol', url: 'https://example.com/parent.json' }] })
				}))
			);

			const result = await resolveProtocolImports(
				mockDb(),
				'my-protocol',
				[imp('parent-protocol__field1', 'my-protocol__field1')],
				alreadyResolved
			);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('parent-protocol');
			// fetch should only have been called once (for the registry), not for the protocol itself
			expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
		});

		test('skips protocols already in the database', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn(async () => ({
					json: async () => ({ protocols: [{ id: 'parent-protocol', url: 'https://example.com/parent.json' }] })
				}))
			);

			const db = mockDb({ Protocol: { 'parent-protocol': { id: 'parent-protocol' } } });

			const result = await resolveProtocolImports(
				db,
				'my-protocol',
				[imp('parent-protocol__field1', 'my-protocol__field1')]
			);

			expect(result).toEqual([]);
			expect(db.get).toHaveBeenCalledWith('Protocol', 'parent-protocol');
		});

		test('throws for unknown protocol in registry', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn(async () => ({
					json: async () => ({ protocols: [] }) // empty registry
				}))
			);

			await expect(
				resolveProtocolImports(
					mockDb(),
					'my-protocol',
					[imp('unknown-protocol__field1', 'my-protocol__field1')]
				)
			).rejects.toThrow('inherits from unknown protocol unknown-protocol');
		});

		test('deduplicates imports from the same protocol', async () => {
			const parentInput = fakeExportedProtocol('parent-protocol');

			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => ({
					json: async () => {
						if (url.includes('registry.json')) {
							return { protocols: [{ id: 'parent-protocol', url: 'https://example.com/parent.json' }] };
						}
						return parentInput;
					}
				}))
			);

			const result = await resolveProtocolImports(
				mockDb(),
				'my-protocol',
				[
					imp('parent-protocol__field1', 'my-protocol__field1'),
					imp('parent-protocol__field2', 'my-protocol__field2'),
				]
			);

			expect(result).toHaveLength(1);
			// registry fetch + one protocol fetch = 2 calls total
			expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
		});

		test('resolves recursive imports', async () => {
			const grandparentInput = fakeExportedProtocol('grandparent');
			const parentInput = fakeExportedProtocol('parent', [
				{ from: 'grandparent', metadata: ['field'] }
			]);

			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => ({
					json: async () => {
						if (url.includes('registry.json')) {
							return {
								protocols: [
									{ id: 'parent', url: 'https://example.com/proto-parent.json' },
									{ id: 'grandparent', url: 'https://example.com/proto-grandparent.json' }
								]
							};
						}
						if (url.includes('proto-grandparent.json')) return grandparentInput;
						if (url.includes('proto-parent.json')) return parentInput;
						throw new Error(`Unexpected fetch: ${url}`);
					}
				}))
			);

			const result = await resolveProtocolImports(
				mockDb(),
				'child',
				[imp('parent__field', 'child__field')]
			);

			expect(result).toHaveLength(2);
			const ids = result.map((p) => p.id);
			expect(ids).toContain('parent');
			expect(ids).toContain('grandparent');
		});
	});
}
