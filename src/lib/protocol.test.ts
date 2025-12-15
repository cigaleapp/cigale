import { describe, expect, it, test, vi } from 'vitest';

import { metadataOptionsKeyRange } from '$lib/metadata.js';
import {
	compareProtocolWithUpstream,
	hasUpgradeAvailable,
	jsonSchemaURL,
	toExportedProtocol
} from '$lib/protocols.js';
import { Protocol } from '$lib/schemas/protocols.js';
import { pick } from '$lib/utils.js';

import 'fake-indexeddb/auto';

test('jsonSchemaURL', () => {
	// Mock window.location.origin
	const originalLocation = window.location;
	Object.defineProperty(window, 'location', {
		value: { origin: 'https://example.com' },
		writable: true
	});

	expect(jsonSchemaURL('')).toBe('https://example.com/protocol.schema.json');
	expect(jsonSchemaURL('/app')).toBe('https://example.com/app/protocol.schema.json');
	expect(jsonSchemaURL('/some/path')).toBe('https://example.com/some/path/protocol.schema.json');

	// Restore original location
	Object.defineProperty(window, 'location', {
		value: originalLocation,
		writable: true
	});
});

test('toExportedProtocol', async () => {
	const db = {
		getAll: vi.fn(
			/**
			 * @returns {Promise<Array<import('$lib/database').Metadata | import('$lib/database').MetadataEnumVariant & {metadataId: string}>>}
			 */
			async (table, _range) => {
				if (table === 'MetadataOption') {
					return [
						{
							id: 'protocol1__meta1:opt1',
							metadataId: 'protocol1__meta1',
							key: 'opt1',
							label: 'Option 1',
							description: 'Desc 1',
							synonyms: []
						},
						{
							id: 'protocol1__meta1:opt2',
							metadataId: 'protocol1__meta1',
							key: 'opt2',
							label: 'Option 2',
							description: 'Desc 2',
							synonyms: []
						},
						{
							id: 'protocol1__meta2:opt1',
							metadataId: 'protocol1__meta2',
							key: 'opt1',
							label: 'Option A',
							description: 'Desc A',
							synonyms: []
						}
					];
				} else if (table === 'Metadata') {
					return [
						{
							id: 'protocol1__meta1',
							type: 'enum',
							key: 'meta1',
							description: 'Metadata 1 description',
							label: 'Metadata 1',
							mergeMethod: 'max',
							required: false
						},
						{
							id: 'protocol1__meta2',
							type: 'enum',
							key: 'meta2',
							label: 'Metadata 2',
							description: 'Metadata 2 description',
							mergeMethod: 'max',
							required: false
						},
						{
							id: 'protocol1__meta3',
							type: 'enum',
							key: 'meta3',
							label: 'Metadata 3',
							description: 'Metadata 3 description',
							mergeMethod: 'max',
							required: false
						}
					];
				}
				return [];
			}
		)
	};
	const protocol = Protocol.assert({
		id: 'protocol1',
		name: 'Test Protocol',
		version: 1,
		metadata: ['protocol1__meta1', 'protocol1__meta2', 'protocol1__meta3'],
		sessionMetadata: ['protocol1__meta3'],
		authors: [],
		description: 'A test protocol',
		crop: {
			metadata: 'meta1',
			confirmationMetadata: 'meta2'
		},
		exports: {
			metadata: {
				json: 'analysis.json',
				csv: 'metadata.csv'
			},
			images: {
				cropped: 'cropped/{{sequence}}.{{extension image.filename}}',
				original: 'original/{{sequence}}.{{extension image.filename}}'
			}
		}
	});
	const exported = await toExportedProtocol(db, protocol);

	expect.soft(db.getAll).toHaveBeenCalledTimes(2);
	expect
		.soft(db.getAll)
		.toHaveBeenCalledWith('MetadataOption', metadataOptionsKeyRange('protocol1', null));
	expect.soft(db.getAll).toHaveBeenCalledWith('Metadata');

	expect(exported).toEqual({
		...pick(protocol, 'id', 'name', 'version', 'description', 'authors', 'crop'),
		sessionMetadata: {
			protocol1__meta3: {
				key: 'meta3',
				label: 'Metadata 3',
				type: 'enum',
				description: 'Metadata 3 description',
				mergeMethod: 'max',
				required: false,
				options: []
			}
		},
		metadata: {
			protocol1__meta1: {
				key: 'meta1',
				label: 'Metadata 1',
				type: 'enum',
				description: 'Metadata 1 description',
				mergeMethod: 'max',
				required: false,
				options: [
					{
						index: 0,
						key: 'opt1',
						label: 'Option 1',
						description: 'Desc 1',
						synonyms: []
					},
					{
						index: 1,
						key: 'opt2',
						label: 'Option 2',
						description: 'Desc 2',
						synonyms: []
					}
				]
			},
			protocol1__meta2: {
				key: 'meta2',
				label: 'Metadata 2',
				description: 'Metadata 2 description',
				mergeMethod: 'max',
				required: false,
				type: 'enum',
				options: [
					{
						index: 0,
						key: 'opt1',
						label: 'Option A',
						description: 'Desc A',
						synonyms: []
					}
				]
			}
		},
		exports: {
			metadata: {
				json: 'analysis.json',
				csv: 'metadata.csv'
			},
			images: {
				cropped: 'cropped/{{sequence}}.{{extension image.filename}}',
				original: 'original/{{sequence}}.{{extension image.filename}}'
			}
		}
	});
});

describe('compareProtocolWithUpstream', () => {
	it('should return empty diffs if the protocol has no source', async () => {
		const db = {
			/**
			 * @returns {Promise<typeof import('$lib/database').Tables.Protocol.inferIn>}
			 */
			get: async (_table, _id) => ({
				id: 'protocol1',
				name: 'Test Protocol',
				version: 1,
				metadata: [],
				sessionMetadata: [],
				authors: [],
				description: 'A test protocol',
				// no source:
				crop: {
					metadata: 'feur',
					confirmationMetadata: 'quoicoubaka',
					padding: '0px'
				},
				exports: {
					metadata: {
						json: 'analysis.json',
						csv: 'metadata.csv'
					},
					images: {
						cropped: 'cropped/{{sequence}}.{{extension image.filename}}',
						original: 'original/{{sequence}}.{{extension image.filename}}'
					}
				}
			}),

			count: async () => 0
		};

		const diffs = await compareProtocolWithUpstream(db, 'protocol1', {
			onProgress: () => {}
		});

		expect(diffs).toEqual([]);
	});

	it('should correctly compare two identical protocols', async () => {
		const db = {
			/**
			 * @returns {Promise<typeof import('$lib/database').Tables.Protocol.inferIn>}
			 */
			get: async (_table, _id) => ({
				id: 'protocol1',
				name: 'Test Protocol',
				version: 1,
				metadata: [],
				authors: [],
				sessionMetadata: [],
				description: 'A test protocol',
				source: 'https://example.com/protocol.json',
				crop: {
					metadata: 'feur',
					confirmationMetadata: 'quoicoubaka',
					padding: '0px'
				},
				exports: {
					metadata: {
						json: 'analysis.json',
						csv: 'metadata.csv'
					},
					images: {
						cropped: 'cropped/{{sequence}}.{{extension image.filename}}',
						original: 'original/{{sequence}}.{{extension image.filename}}'
					}
				}
			}),

			count: async () => 0,
			getAll: async () => []
		};

		const fetch = vi.fn(async () => ({
			json: async () => ({
				id: 'protocol1',
				name: 'Test Protocol',
				version: 1,
				metadata: {},
				authors: [],
				description: 'A test protocol',
				source: 'https://example.com/protocol.json',
				crop: {
					metadata: 'feur',
					confirmationMetadata: 'quoicoubaka',
					padding: '0px'
				},
				exports: {
					metadata: {
						json: 'analysis.json',
						csv: 'metadata.csv'
					},
					images: {
						cropped: 'cropped/{{sequence}}.{{extension image.filename}}',
						original: 'original/{{sequence}}.{{extension image.filename}}'
					}
				}
			})
		}));

		vi.stubGlobal('fetch', fetch);

		const diffs = await compareProtocolWithUpstream(db, 'protocol1', {
			onProgress: () => {}
		});

		expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/protocol.json'), {
			headers: {}
		});

		expect(diffs).toEqual([]);
	});

	it('should correctly identify differences between local and remote protocols', async () => {
		const db = {
			/**
			 * @returns {Promise<typeof import('$lib/database').Tables.Protocol.inferIn>}
			 */
			get: async (_table, _id) => ({
				id: 'protocol1',
				name: 'Test Protocol',
				version: 2,
				metadata: ['protocol1__meta1', 'protocol1__meta2'],
				authors: [],
				description: 'A test protocol',
				source: 'https://example.com/protocol.json',
				crop: {
					metadata: 'feur',
					confirmationMetadata: 'quoicoubaka',
					padding: '0px'
				},
				exports: {
					metadata: {
						json: 'analysis.json',
						csv: 'metadata.csv'
					},
					images: {
						cropped: 'cropped/{{sequence}}.{{extension image.filename}}',
						original: 'original/{{sequence}}.{{extension image.filename}}'
					}
				}
			}),

			count: async () => 2,

			/**
			 * @returns {Promise<Array<import('$lib/database').Metadata | import('$lib/database').MetadataEnumVariant & {metadataId: string}>>}
			 */
			getAll: async (table, _range) => {
				if (table === 'MetadataOption') {
					return [
						{
							id: 'protocol1__meta1:opt1',
							metadataId: 'protocol1__meta1',
							key: 'opt1',
							label: 'Option 1',
							description: 'Desc 1',
							synonyms: []
						},
						{
							id: 'protocol1__meta1:opt2',
							metadataId: 'protocol1__meta1',
							key: 'opt2',
							label: 'Option 2',
							description: 'Desc 2',
							synonyms: []
						},
						{
							id: 'protocol1__meta2:opt1',
							metadataId: 'protocol1__meta2',
							key: 'opt1',
							label: 'Option A',
							description: 'Desc A',
							synonyms: []
						}
					];
				} else if (table === 'Metadata') {
					return [
						{
							id: 'protocol1__meta1',
							type: 'enum',
							description: 'Metadata 1 description',
							label: 'Metadata 1',
							mergeMethod: 'max',
							required: false
						},
						{
							id: 'protocol1__meta2',
							type: 'enum',
							label: 'Metadata 2',
							description: 'Metadata 2 description',
							mergeMethod: 'max',
							required: false
						},
						{
							id: 'protocol1__meta4',
							type: 'boolean',
							label: 'Metadata 4',
							description: 'Metadata 4 description',
							mergeMethod: 'max',
							required: false
						}
					];
				}
				return [];
			}
		};

		const fetch = vi.fn(async () => ({
			/**
			 * @returns {Promise<typeof import('$lib/schemas/protocols').ExportedProtocol.inferIn>}
			 */
			json: async () => ({
				id: 'protocol1',
				name: 'Test Protocol Updated',
				version: 2,
				crop: {
					metadata: 'feur',
					confirmationMetadata: 'quoicoubaka',
					padding: '0px'
				},
				metadata: {
					protocol1__meta1: {
						label: 'Metadata 1',
						type: 'enum',
						description: 'Metadata 1 description updated',
						mergeMethod: 'max',
						required: false,
						options: [
							{ key: 'opt1', label: 'Option 1', description: 'Desc 1' },
							// opt2 removed
							{ key: 'opt3', label: 'Option 3', description: 'Desc 3' } // new option
						]
					},
					protocol1__meta2: {
						label: 'Metadata 2',
						description: 'Metadata 2 description',
						mergeMethod: 'max',
						required: false,
						type: 'enum',
						options: [
							{ key: 'opt1', label: 'Option A', description: 'Desc A' },
							{ key: 'opt2', label: 'Option B', description: 'Desc B' } // new option
						]
					},
					// meta4 removed
					protocol1__meta3: {
						// new metadata
						label: 'Metadata 3',
						description: 'Metadata 3 description',
						mergeMethod: 'max',
						required: false,
						type: 'enum',
						options: [{ key: 'opt1', label: 'Option X', description: 'Desc X' }]
					}
				},
				authors: [],
				description: 'A test protocol updated',
				exports: {
					metadata: {
						json: 'analysis.json',
						csv: 'metadata_v2.csv' // changed
					},
					images: {
						cropped: 'cropped/{{sequence}}.{{extension image.filename}}',
						original: 'original/{{sequence}}.{{extension image.filename}}'
					}
				}
			})
		}));

		vi.stubGlobal('fetch', fetch);

		const onProgress = vi.fn((/** @type {number} */ _progress) => {});

		const diffs = await compareProtocolWithUpstream(db, 'protocol1', { onProgress });

		expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/protocol.json'), {
			headers: {}
		});

		// Each option counts as 1 step, so we should have 4 (options) + 250 (fetchAndConvert) + 25 (microdiff) + 2 (postProcess)
		const progressTotal = 4 + 250 + 25 + 2;
		let assertingCallNumber = 0;
		const expectProgressCall = (expectedProgressAbsolute) => {
			assertingCallNumber++;
			return expect
				.soft(onProgress)
				.toHaveBeenNthCalledWith(
					assertingCallNumber,
					expect.closeTo(expectedProgressAbsolute / progressTotal, 0.01)
				);
		};

		expect.soft(onProgress).toHaveBeenCalledTimes(9); // 9 steps
		// initial
		expectProgressCall(0);
		// after fetch+convert
		expectProgressCall(250);
		// after microdiff
		expectProgressCall(250 + 25);
		// after first option
		expectProgressCall(250 + 25 + 1);
		// after second option
		expectProgressCall(250 + 25 + 2);
		// after third option
		expectProgressCall(250 + 25 + 3);
		// after fourth option
		expectProgressCall(250 + 25 + 4);
		// after postProcess
		expectProgressCall(250 + 25 + 4 + 2);
		// final
		expectProgressCall(progressTotal);

		// Sort diffs by path for easier testing
		const sortedDiffs = diffs.sort((a, b) => {
			const pathA = a.path.join('.');
			const pathB = b.path.join('.');
			return pathA < pathB ? -1 : pathA > pathB ? 1 : 0;
		});

		expect(sortedDiffs).toMatchObject([
			{
				oldValue: 'A test protocol updated',
				path: ['description'],
				type: 'CHANGE',
				value: 'A test protocol'
			},
			{
				oldValue: 'metadata_v2.csv',
				path: ['exports', 'metadata', 'csv'],
				type: 'CHANGE',
				value: 'metadata.csv'
			},
			{
				oldValue: 'Metadata 1 description updated',
				path: ['metadata', 'protocol1__meta1', 'description'],
				type: 'CHANGE',
				value: 'Metadata 1 description'
			},
			{
				path: ['metadata', 'protocol1__meta1', 'options', 1],
				type: 'CREATE',
				value: {
					description: 'Desc 2',
					key: 'opt2',
					label: 'Option 2'
				}
			},
			{
				oldValue: {
					description: 'Desc 3',
					key: 'opt3',
					label: 'Option 3'
				},
				path: ['metadata', 'protocol1__meta1', 'options', 2],
				type: 'REMOVE'
			},
			{
				oldValue: {
					description: 'Desc B',
					key: 'opt2',
					label: 'Option B'
				},
				path: ['metadata', 'protocol1__meta2', 'options', 1],
				type: 'REMOVE'
			},
			{
				oldValue: {
					description: 'Metadata 3 description',
					label: 'Metadata 3',
					mergeMethod: 'max',
					options: [
						{
							description: 'Desc X',
							key: 'opt1',
							label: 'Option X'
						}
					],
					required: false,
					type: 'enum'
				},
				path: ['metadata', 'protocol1__meta3'],
				type: 'REMOVE'
			},
			{
				oldValue: 'Test Protocol Updated',
				path: ['name'],
				type: 'CHANGE',
				value: 'Test Protocol'
			},
			{
				path: ['source'],
				type: 'CREATE',
				value: 'https://example.com/protocol.json'
			}
		]);
	});
});

describe('hasUpgradeAvailable', () => {
	test('should return upToDate: false if the version is lower', async () => {
		const fetch = vi.fn(async () => ({
			json: async () => ({
				version: 2,
				id: 'mon-protocole'
			})
		}));

		vi.stubGlobal('fetch', fetch);

		const result = await hasUpgradeAvailable({
			version: 1,
			source: 'https://example.com/protocol.json',
			id: 'mon-protocole'
		});

		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining('https://example.com/protocol.json?v='),
			{
				headers: {
					Accept: 'application/json'
				}
			}
		);
		expect(result).toEqual({ upToDate: false, newVersion: 2 });
	});

	test('should return upToDate: true if the version is the same', async () => {
		const fetch = vi.fn(async () => ({
			json: async () => ({
				version: 1,
				id: 'mon-protocole'
			})
		}));

		vi.stubGlobal('fetch', fetch);

		const result = await hasUpgradeAvailable({
			version: 1,
			source: 'https://example.com/protocol.json',
			id: 'mon-protocole'
		});

		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining('https://example.com/protocol.json?v='),
			{
				headers: {
					Accept: 'application/json'
				}
			}
		);
		expect(result).toEqual({ upToDate: true, newVersion: 1 });
	});

	test('should throw an error if the protocol ID is different', async () => {
		const fetch = vi.fn(async () => ({
			json: async () => ({
				version: 2,
				id: 'autre-protocole'
			})
		}));

		vi.stubGlobal('fetch', fetch);

		await expect(
			hasUpgradeAvailable({
				version: 1,
				source: 'https://example.com/protocol.json',
				id: 'mon-protocole'
			})
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Le protocole a changé d'identifiant]`
		);
	});

	test('should throw an error if the remote protocol has no version', async () => {
		const fetch = vi.fn(async () => ({
			json: async () => ({
				id: 'mon-protocole'
			})
		}));

		vi.stubGlobal('fetch', fetch);

		await expect(
			hasUpgradeAvailable({
				version: 1,
				source: 'https://example.com/protocol.json',
				id: 'mon-protocole'
			})
		).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Le protocole n'a plus de version]`);
	});

	test('should throw an error if the protocol has no source', async () => {
		await expect(
			// @ts-expect-error
			hasUpgradeAvailable({
				version: 1,
				source: undefined,
				id: 'mon-protocole'
			})
		).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Le protocole n'a pas de source]`);
	});

	test('should throw an error if the local protocol has no version', async () => {
		await expect(
			// @ts-expect-error
			hasUpgradeAvailable({
				version: undefined,
				source: 'https://example.com/protocol.json',
				id: 'mon-protocole'
			})
		).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Le protocole n'a pas de version]`);
	});

	test('should throw an error if the protocol has no ID', async () => {
		await expect(
			// @ts-expect-error
			hasUpgradeAvailable({
				version: 1,
				source: 'https://example.com/protocol.json'
			})
		).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Le protocole n'a pas d'identifiant]`);
	});
});
