import { ArkErrors } from 'arktype';

import { Tables } from '$lib/database.js';
import { tables, type DatabaseHandle } from '$lib/idb.svelte.js';
import {
	isNamespacedToProtocol,
	MetadataDefaultDynamicPayload,
	removeNamespaceFromMetadataId
} from '$lib/schemas/metadata.js';
import { toMetadataRecord } from '$lib/schemas/results.js';
import { toasts } from '$lib/toasts.svelte.js';
import { transformObject } from '$lib/utils.js';

import { serializeMetadataValue } from './serializing.js';
import { storeMetadataValue } from './storage.js';
import { getMetadataValue } from './types.js';

export async function resolveDefaults({
	db,
	sessionId,
	metadataToConsider,
	iterations = metadataToConsider.length
}: {
	db: DatabaseHandle;
	sessionId: string;
	metadataToConsider: string[];
	iterations?: number;
}) {
	// iterations ??= metadataToConsider.length;

	if (iterations <= 0) return;

	const session = await db
		.get('Session', sessionId)
		.then((session) => Tables.Session.assert(session));

	const defs = await tables.Metadata.getMany(metadataToConsider).then((defs) =>
		defs.filter((def) => def.default !== undefined)
	);

	// TODO for now it only works on session metadata

	const sessionMetadata = toMetadataRecord(session.metadata);

	const payload: typeof MetadataDefaultDynamicPayload.inferIn = {
		protocolMetadata: {},
		metadata: {},
		session: {
			createdAt: session.createdAt,
			metadata: sessionMetadata,
			protocolMetadata: transformObject(sessionMetadata, (key, value) => {
				if (!isNamespacedToProtocol(session.protocol, key)) return;

				return [removeNamespaceFromMetadataId(key), value];
			})
		}
	};

	const metadataToIterateFurtherOn = new Set<string>();

	for (const { default: defaultSpec, id, type } of defs) {
		if (defaultSpec === undefined) continue;

		const currentValue = getMetadataValue(session, type, id);

		if (currentValue && !currentValue.isDefault) continue;

		const value =
			typeof defaultSpec === 'object' && 'render' in defaultSpec
				? defaultSpec.render(payload)
				: defaultSpec;

		if (value instanceof ArkErrors) {
			toasts.warn(
				`La valeur par défaut de la métadonnée ${id} est invalide : ${value.toString()}`
			);
			continue;
		}

		console.debug('resolved default for', id, {
			defaultSpec,
			value,
			currentValue,
			serializeds: {
				new: serializeMetadataValue(value),
				current: serializeMetadataValue(currentValue?.value)
			}
		});

		if (serializeMetadataValue(value) === serializeMetadataValue(currentValue?.value)) continue;

		await storeMetadataValue({
			db,
			sessionId,
			metadataId: id,
			subjectId: sessionId,
			type,
			isDefault: true,
			value
		});

		metadataToIterateFurtherOn.add(id);
	}

	await resolveDefaults({
		db,
		sessionId,
		metadataToConsider: [...metadataToIterateFurtherOn],
		iterations: iterations - 1
	});
}

if (import.meta.vitest) {
	const { describe, it, expect, vi, beforeEach } = import.meta.vitest;

	vi.mock('$lib/database.js', () => ({
		Tables: { Session: { assert: vi.fn((v: unknown) => v) } }
	}));

	vi.mock('$lib/idb.svelte.js', () => ({
		tables: { Metadata: { getMany: vi.fn(async () => []) } }
	}));

	vi.mock('$lib/toasts.svelte.js', () => ({
		toasts: { warn: vi.fn() }
	}));

	vi.mock('./storage.js', () => ({
		storeMetadataValue: vi.fn(async () => {})
	}));

	// Module-level imports are now the mocks — cast for mock method access
	const _tables = tables as unknown as { Metadata: { getMany: ReturnType<typeof vi.fn> } };
	const _store = storeMetadataValue as unknown as ReturnType<typeof vi.fn>;
	const _toasts = toasts as unknown as { warn: ReturnType<typeof vi.fn> };

	function mockDb(session: Record<string, unknown>) {
		return { get: vi.fn(async () => session) } as unknown as DatabaseHandle;
	}

	function makeSession(
		metadata: Record<string, Record<string, unknown>> = {},
		protocol = 'proto'
	) {
		return { createdAt: '2024-01-01T00:00:00.000Z', protocol, metadata };
	}

	beforeEach(() => {
		vi.clearAllMocks();
		_tables.Metadata.getMany.mockResolvedValue([]);
	});

	describe('resolveDefaults', () => {
		it('returns immediately when iterations is 0', async () => {
			const db = mockDb({});
			await resolveDefaults({
				db,
				sessionId: 'sess1',
				metadataToConsider: [],
				iterations: 0
			});
			expect(db.get).not.toHaveBeenCalled();
		});

		it('returns immediately when metadataToConsider is empty (iterations defaults to 0)', async () => {
			const db = mockDb(makeSession());
			await resolveDefaults({ db, sessionId: 'sess1', metadataToConsider: [] });
			expect(db.get).not.toHaveBeenCalled();
		});

		it('does nothing when no metadata definitions have defaults', async () => {
			const db = mockDb(makeSession());
			_tables.Metadata.getMany.mockResolvedValue([{ id: 'proto__field1', type: 'string' }]);

			await resolveDefaults({
				db,
				sessionId: 'sess1',
				metadataToConsider: ['proto__field1']
			});

			expect(_store).not.toHaveBeenCalled();
		});

		it('stores a static default when no current value exists', async () => {
			const db = mockDb(makeSession());
			_tables.Metadata.getMany.mockResolvedValue([
				{ id: 'proto__field1', type: 'string', default: 'hello' }
			]);

			await resolveDefaults({
				db,
				sessionId: 'sess1',
				metadataToConsider: ['proto__field1']
			});

			expect(_store).toHaveBeenCalledWith(
				expect.objectContaining({
					db,
					sessionId: 'sess1',
					metadataId: 'proto__field1',
					subjectId: 'sess1',
					type: 'string',
					isDefault: true,
					value: 'hello'
				})
			);
		});

		it('skips metadata whose current value is not a default', async () => {
			const db = mockDb(
				makeSession({
					proto__field1: {
						value: 'existing',
						confidence: 1,
						confirmed: false,
						manuallyModified: false,
						isDefault: false,
						alternatives: {}
					}
				})
			);
			_tables.Metadata.getMany.mockResolvedValue([
				{ id: 'proto__field1', type: 'string', default: 'hello' }
			]);

			await resolveDefaults({
				db,
				sessionId: 'sess1',
				metadataToConsider: ['proto__field1']
			});

			expect(_store).not.toHaveBeenCalled();
		});

		it('overwrites a current default value with a different new default', async () => {
			const db = mockDb(
				makeSession({
					proto__field1: {
						value: 'old',
						confidence: 1,
						confirmed: false,
						manuallyModified: false,
						isDefault: true,
						alternatives: {}
					}
				})
			);
			_tables.Metadata.getMany.mockResolvedValue([
				{ id: 'proto__field1', type: 'string', default: 'new' }
			]);

			await resolveDefaults({
				db,
				sessionId: 'sess1',
				metadataToConsider: ['proto__field1']
			});

			expect(_store).toHaveBeenCalledWith(
				expect.objectContaining({ value: 'new', isDefault: true })
			);
		});

		it('does not store when new default equals current value', async () => {
			const db = mockDb(
				makeSession({
					proto__field1: {
						value: 'hello',
						confidence: 1,
						confirmed: false,
						manuallyModified: false,
						isDefault: true,
						alternatives: {}
					}
				})
			);
			_tables.Metadata.getMany.mockResolvedValue([
				{ id: 'proto__field1', type: 'string', default: 'hello' }
			]);

			await resolveDefaults({
				db,
				sessionId: 'sess1',
				metadataToConsider: ['proto__field1']
			});

			expect(_store).not.toHaveBeenCalled();
		});

		it('evaluates dynamic defaults via render()', async () => {
			const db = mockDb(makeSession());
			const renderFn = vi.fn(() => 'computed');
			_tables.Metadata.getMany.mockResolvedValue([
				{ id: 'proto__field1', type: 'string', default: { render: renderFn } }
			]);

			await resolveDefaults({
				db,
				sessionId: 'sess1',
				metadataToConsider: ['proto__field1']
			});

			expect(renderFn).toHaveBeenCalledWith(
				expect.objectContaining({
					session: expect.objectContaining({
						createdAt: '2024-01-01T00:00:00.000Z'
					})
				})
			);
			expect(_store).toHaveBeenCalledWith(
				expect.objectContaining({ value: 'computed', isDefault: true })
			);
		});

		it('warns and skips when dynamic default returns ArkErrors', async () => {
			const { type } = await import('arktype');
			const errors = type('number')('not a number');

			const db = mockDb(makeSession());
			_tables.Metadata.getMany.mockResolvedValue([
				{ id: 'proto__field1', type: 'string', default: { render: () => errors } }
			]);

			await resolveDefaults({
				db,
				sessionId: 'sess1',
				metadataToConsider: ['proto__field1']
			});

			expect(_toasts.warn).toHaveBeenCalled();
			expect(_store).not.toHaveBeenCalled();
		});

		it('recurses on metadata that was stored', async () => {
			const db = mockDb(makeSession());
			_tables.Metadata.getMany
				.mockResolvedValueOnce([{ id: 'proto__field1', type: 'string', default: 'hello' }])
				.mockResolvedValueOnce([]);

			await resolveDefaults({
				db,
				sessionId: 'sess1',
				metadataToConsider: ['proto__field1'],
				iterations: 2 // allow one level of recursion
			});

			// db.get called twice: initial + one recursive call
			expect(db.get).toHaveBeenCalledTimes(2);
			expect(_tables.Metadata.getMany).toHaveBeenCalledTimes(2);
			// Second call should be with the IDs that were stored
			expect(_tables.Metadata.getMany).toHaveBeenLastCalledWith(['proto__field1']);
		});

		it('handles multiple metadata definitions', async () => {
			const db = mockDb(makeSession());
			_tables.Metadata.getMany
				.mockResolvedValueOnce([
					{ id: 'proto__a', type: 'string', default: 'val-a' },
					{ id: 'proto__b', type: 'integer', default: 42 }
				])
				.mockResolvedValueOnce([]); // recursive call finds nothing new

			await resolveDefaults({
				db,
				sessionId: 'sess1',
				metadataToConsider: ['proto__a', 'proto__b']
			});

			expect(_store).toHaveBeenCalledWith(
				expect.objectContaining({ metadataId: 'proto__a', value: 'val-a' })
			);
			expect(_store).toHaveBeenCalledWith(
				expect.objectContaining({ metadataId: 'proto__b', value: 42 })
			);
		});

		it('passes session protocolMetadata with unnamespaced keys to render()', async () => {
			const db = mockDb(
				makeSession(
					{
						proto__species: {
							value: 'Apis mellifera',
							confidence: 1,
							confirmed: false,
							manuallyModified: false,
							isDefault: false,
							alternatives: {}
						}
					},
					'proto'
				)
			);
			const renderFn = vi.fn(
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				(_payload: typeof MetadataDefaultDynamicPayload.inferIn) => 'derived'
			);
			_tables.Metadata.getMany.mockResolvedValue([
				{ id: 'proto__label', type: 'string', default: { render: renderFn } }
			]);

			await resolveDefaults({
				db,
				sessionId: 'sess1',
				metadataToConsider: ['proto__label']
			});

			const payload = renderFn.mock.calls[0][0];
			// protocolMetadata should have the un-namespaced key
			expect(payload.session.protocolMetadata).toHaveProperty('species');
			// regular metadata keeps the full namespaced key
			expect(payload.session.metadata).toHaveProperty('proto__species');
		});
	});
}
