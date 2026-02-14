import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, test } from 'vitest';

import { nukeDatabase, openDatabase, tables } from './idb.svelte.js';
import * as idb from './idb.svelte.js';
import { imageId } from './images.js';
import { keys } from './utils.js';

beforeEach(() => {
	nukeDatabase();
	for (const key of keys(idb._tablesState)) {
		idb._tablesState[key] = [];
	}
});
test('openDatabase', async () => {
	const db = await openDatabase();
	expect(window).toHaveProperty('DB');
	expect(window).toHaveProperty('refreshDB');
	expect(db.name).toMatchInlineSnapshot(`"database"`);
	expect(db.version).toMatchInlineSnapshot(`5`);
	expect(db.objectStoreNames).toMatchInlineSnapshot(`
		FakeDOMStringList {
		  "0": "Image",
		  "1": "ImageFile",
		  "2": "ImagePreviewFile",
		  "3": "Metadata",
		  "4": "MetadataOption",
		  "5": "Observation",
		  "6": "Protocol",
		  "7": "Session",
		  "8": "Settings",
		  "_values": [
		    "Image",
		    "ImageFile",
		    "ImagePreviewFile",
		    "Metadata",
		    "MetadataOption",
		    "Observation",
		    "Protocol",
		    "Session",
		    "Settings",
		  ],
		}
	`);

	const count = await Promise.all([...db.objectStoreNames].map((name) => db.count(name))).then(
		(counts) => counts.reduce((total, count) => total + count, 0)
	);

	expect(count).toBe(0);
});

test('nukeDatabase', async () => {
	const db = await openDatabase();
	await db.put('ImageFile', {
		id: 'flint and steel',
		sessionId: 'testing',
		bytes: new ArrayBuffer(),
		filename: 'ha',
		contentType: 'image/png',
		dimensions: { width: 1, height: 1 }
	});
	const items = await db.getAll('ImageFile');
	expect(items).toHaveLength(1);
	nukeDatabase();
	const itemsAfter = await openDatabase().then((db) => db.getAll('ImageFile'));
	expect(itemsAfter).toHaveLength(0);
});

describe('operations', () => {
	describe('set', () => {
		test('regular case', async () => {
			await idb.set('Metadata', {
				id: 'test',
				description: '',
				label: 'Test',
				mergeMethod: 'none',
				required: false,
				type: 'string'
			});
			const object = await idb.get('Metadata', 'test');
			expect(object).toEqual({
				id: 'test',
				description: '',
				label: 'Test',
				mergeMethod: 'none',
				required: false,
				sortable: false,
				groupable: false,
				type: 'string'
			});
		});
		test('with transformations (tables that have fields with defaults or pipes)', async () => {
			const db = await openDatabase();
			const addedAt = new Date();
			await idb.set('Image', {
				id: imageId(0, 0),
				sessionId: 'testing',
				addedAt: addedAt.toISOString(),
				fileId: 'quoicoubaka',
				dimensions: { width: 100, height: 100 },
				contentType: 'what/ever',
				filename: 'THE NETHER',
				metadata: {
					water: {
						value: '"bucket"',
						alternatives: {
							'"release!!!!"': 0.3
						}
					}
				}
			});

			const serialized = await db.get('Image', imageId(0, 0));
			expect(serialized).toEqual({
				id: imageId(0, 0),
				sessionId: 'testing',
				addedAt: addedAt.toISOString(),
				fileId: 'quoicoubaka',
				dimensions: { width: 100, height: 100 },
				contentType: 'what/ever',
				filename: 'THE NETHER',
				metadata: {
					water: {
						value: '"bucket"',
						alternatives: {
							'"release!!!!"': 0.3
						}
					}
				}
			});

			const deserialized = await idb.get('Image', imageId(0, 0));
			expect(deserialized).toEqual({
				id: imageId(0, 0),
				sessionId: 'testing',
				addedAt,
				fileId: 'quoicoubaka',
				boundingBoxesAnalyzed: false,
				dimensions: { width: 100, height: 100, aspectRatio: 1 },
				contentType: 'what/ever',
				filename: 'THE NETHER',
				metadataErrors: {},
				metadata: {
					water: {
						value: 'bucket',
						confidence: 1,
						confirmed: false,
						manuallyModified: false,
						isDefault: false,
						alternatives: {
							'"release!!!!"': 0.3
						}
					}
				}
			});
		});
	});
	test('clear', async () => {
		const db = await openDatabase();
		for (const i of [0, 1, 2]) {
			await db.put('Observation', {
				id: `test${i}`,
				sessionId: 'testing',
				addedAt: new Date().toISOString(),
				images: [],
				label: 'Test',
				metadataOverrides: {},
				metadataErrors: {}
			});
		}
		for (const i of [0, 1, 2]) {
			await db.put('ImageFile', {
				id: `test${i}`,
				sessionId: 'testing',
				bytes: new ArrayBuffer(0),
				filename: 'ha',
				contentType: 'image/png',
				dimensions: { width: 1, height: 1 }
			});
		}

		await idb.clear('ImageFile');

		expect(await db.count('ImageFile')).toBe(0);
		expect(await db.count('Observation')).toBe(3);
	});
	test('get', async () => {
		const db = await openDatabase();
		const addedAt = new Date();
		await db.put('Image', {
			id: imageId(0, 0),
			sessionId: 'testing',
			addedAt: addedAt.toISOString(),
			fileId: 'quoicoubaka',
			dimensions: { width: 100, height: 100 },
			contentType: 'what/ever',
			filename: 'THE NETHER',
			metadataErrors: {},
			metadata: {
				water: {
					value: '"bucket"',
					alternatives: {
						'"release!!!!"': 0.3
					}
				}
			}
		});
		await db.put('Image', {
			id: imageId(0, 1),
			sessionId: 'testing',
			addedAt: addedAt.toISOString(),
			fileId: 'quoicoubaka',
			dimensions: { width: 100, height: 100 },
			contentType: 'the ehehhe',
			filename: 'ogrjoigrejo',
			metadataErrors: {},
			metadata: {
				water: {
					value: '"ogjroe"',
					alternatives: {
						'"release!!!!"': 0.3
					}
				}
			}
		});
		expect(await idb.get('Image', imageId(0, 0))).toEqual({
			id: imageId(0, 0),
			sessionId: 'testing',
			addedAt,
			fileId: 'quoicoubaka',
			boundingBoxesAnalyzed: false,
			dimensions: { width: 100, height: 100, aspectRatio: 1 },
			contentType: 'what/ever',
			filename: 'THE NETHER',
			metadataErrors: {},
			metadata: {
				water: {
					value: 'bucket',
					confidence: 1,
					confirmed: false,
					manuallyModified: false,
					isDefault: false,
					alternatives: {
						'"release!!!!"': 0.3
					}
				}
			}
		});
	});
	test('list', async () => {
		const db = await openDatabase();
		const addedAt = new Date();
		for (const i of [0, 1, 2]) {
			await db.put('Observation', {
				id: `test${i}`,
				sessionId: 'testing',
				addedAt: addedAt.toISOString(),
				images: [],
				label: 'Test',
				metadataErrors: {},
				metadataOverrides: {}
			});
		}
		const items = await idb.list('Observation');
		expect(items).toHaveLength(3);
		expect(items.map(({ id }) => id)).toEqual(['test0', 'test1', 'test2']);
	});
	test('drop', async () => {
		const db = await openDatabase();
		const addedAt = new Date();
		for (const i of [0, 1, 2]) {
			await db.put('Observation', {
				id: `test${i}`,
				sessionId: 'testing',
				addedAt: addedAt.toISOString(),
				images: [],
				label: 'Test',
				metadataErrors: {},
				metadataOverrides: {}
			});
		}
		await idb.drop('Observation', 'test1');
		const items = await idb.list('Observation');
		expect(items).toHaveLength(2);
		expect(items.map(({ id }) => id)).toEqual(['test0', 'test2']);
	});
	test('iterator', async () => {
		const db = await openDatabase();
		const addedAt = new Date();
		const observation = (/** @type {number} */ i) => ({
			id: `test${i}`,
			sessionId: 'testing',
			addedAt: addedAt.toISOString(),
			images: [],
			label: 'Test',
			metadataErrors: {},
			metadataOverrides: {}
		});

		for (const i of [0, 1, 2]) {
			await db.put('Observation', observation(i));
		}

		const iterator = idb.iterator('Observation');
		expect(await iterator.next()).toEqual({
			done: false,
			value: { ...observation(0), addedAt }
		});
		expect(await iterator.next()).toEqual({
			done: false,
			value: { ...observation(1), addedAt }
		});
		expect(await iterator.next()).toEqual({
			done: false,
			value: { ...observation(2), addedAt }
		});
		expect(await iterator.next()).toEqual({
			done: true,
			value: undefined
		});
		expect(await iterator.next()).toEqual({
			done: true,
			value: undefined
		});
	});
});

describe('wrangler', () => {
	const addedAt = new Date();
	const observation = (/** @type {number} */ i) => ({
		id: `test${i}`,
		sessionId: 'testing',
		addedAt: addedAt.toISOString(),
		images: [],
		label: 'Test',
		metadataErrors: {},
		metadataOverrides: {}
	});

	const image = (/** @type {number} */ i) => ({
		id: imageId('0', i),
		sessionId: 'testing',
		addedAt: addedAt.toISOString(),
		fileId: 'quoicoubaka',
		dimensions: { width: 100, height: 100 },
		contentType: 'what/ever',
		filename: 'THE NETHER',
		metadataErrors: {},
		metadata: {
			water: {
				value: '"bucket"',
				alternatives: {
					'"release!!!!"': 0.3
				}
			}
		}
	});

	test('initialize', async () => {
		await idb.set('Observation', observation(0));
		await tables.initialize('testing');
		expect(idb._tablesState).toEqual({
			Observation: [
				{
					...observation(0),
					addedAt
				}
			],
			Image: [],
			Session: [],
			Metadata: [],
			Protocol: [],
			Settings: []
		});
	});
	describe('refresh', () => {
		test('with session', async () => {
			await idb.set('Observation', observation(0));
			await tables.initialize('testing');
			expect(tables.Observation.state).toHaveLength(1);
			await idb.set('Observation', observation(1));
			await idb.set('Observation', observation(2));
			expect(tables.Observation.state).toHaveLength(1);
			await tables.Observation.refresh('testing');
			expect(tables.Observation.state).toHaveLength(3);
		});

		test('with another session', async () => {
			await idb.set('Observation', observation(0));
			await tables.initialize('testing');
			expect(tables.Observation.state).toHaveLength(1);
			await idb.set('Observation', observation(1));
			await idb.set('Observation', observation(2));
			await tables.Observation.refresh('anotherSession');
			expect(tables.Observation.state).toHaveLength(0);
		});

		test('without session', async () => {
			await idb.set('Metadata', {
				id: 'test',
				label: 'Test',
				description: '',
				mergeMethod: 'none',
				required: false,
				type: 'string'
			});

			await idb.set('Observation', observation(0));

			await tables.initialize('testing');
			expect(tables.Metadata.state).toHaveLength(1);
			expect(tables.Observation.state).toHaveLength(1);

			await tables.Observation.refresh(null);
			expect(tables.Observation.state).toHaveLength(0);

			await tables.Metadata.refresh(null);
			expect(tables.Metadata.state).toHaveLength(1);
		});
	});

	describe('individual tables', () => {
		beforeEach(async () => {
			await tables.initialize('testing');
		});

		test('get', async () => {
			expect(await tables.Observation.get('test0')).toBeUndefined();
			await idb.set('Observation', observation(0));
			expect(await tables.Observation.get('test0')).toEqual({
				...observation(0),
				addedAt
			});
		});

		test('set', async () => {
			await tables.Observation.set(observation(0));

			expect(tables.Observation.state).toEqual([
				{
					...observation(0),
					addedAt
				}
			]);

			expect(await idb.get('Observation', 'test0')).toEqual({
				...observation(0),
				addedAt
			});

			await tables.Observation.set(observation(1));

			expect(tables.Observation.state).toEqual([
				{
					...observation(0),
					addedAt
				},
				{
					...observation(1),
					addedAt
				}
			]);

			expect(await idb.get('Observation', 'test1')).toEqual({
				...observation(1),
				addedAt
			});
			expect(await idb.get('Observation', 'test0')).toEqual({
				...observation(0),
				addedAt
			});
		});

		test('update', async () => {
			await tables.Observation.set(observation(0));
			expect(tables.Observation.state).toEqual([
				{
					...observation(0),
					addedAt
				}
			]);
			await tables.Observation.update('test0', 'label', 'Updated');
			expect(tables.Observation.state).toEqual([
				{
					...observation(0),
					addedAt,
					label: 'Updated'
				}
			]);
			expect(await idb.get('Observation', 'test0')).toEqual({
				...observation(0),
				addedAt,
				label: 'Updated'
			});
		});

		test('add', async () => {
			const observation = {
				addedAt: addedAt.toISOString(),
				sessionId: 'testing',
				images: [],
				label: 'Test',
				metadataErrors: {},
				metadataOverrides: {}
			};
			const { id } = await tables.Observation.add(observation);

			expect(tables.Observation.state).toEqual([
				{
					...observation,
					addedAt,
					id
				}
			]);

			expect(await idb.get('Observation', id)).toEqual({
				...observation,
				addedAt,
				id
			});
		});

		test('clear', async () => {
			await tables.Observation.set(observation(0));
			await tables.Image.set(image(0));
			await tables.Image.set(image(1));
			await tables.Observation.set(observation(1));
			expect(tables.Observation.state).toHaveLength(2);
			expect(await idb.list('Observation')).toHaveLength(2);
			await tables.Observation.clear();
			expect(tables.Observation.state).toHaveLength(0);
			expect(await idb.list('Observation')).toHaveLength(0);
		});

		test('remove', async () => {
			await tables.Observation.set(observation(0));
			await tables.Image.set(image(0));
			await tables.Image.set(image(1));
			await tables.Observation.set(observation(1));
			expect(tables.Observation.state).toHaveLength(2);
			expect(await idb.list('Observation')).toHaveLength(2);
			await tables.Observation.remove('test0');
			expect(tables.Observation.state).toEqual([
				{
					...observation(1),
					addedAt
				}
			]);
			expect(await idb.list('Image')).toEqual([
				expect.objectContaining({
					id: imageId('0', 0)
				}),
				expect.objectContaining({
					id: imageId('0', 1)
				})
			]);
			expect(await idb.list('Observation')).toEqual([
				{
					...observation(1),
					addedAt
				}
			]);
			expect(await idb.get('Observation', 'test0')).toBeUndefined();
			expect(await idb.list('Image')).toEqual([
				expect.objectContaining({
					id: imageId('0', 0)
				}),
				expect.objectContaining({
					id: imageId('0', 1)
				})
			]);
		});

		// TODO: test .do()
		// TODO: test .getMany()

		test('list', async () => {
			await tables.Observation.set(observation(0));
			await tables.Image.set(image(0));
			await tables.Image.set(image(1));
			await tables.Observation.set(observation(1));

			const items = await tables.Observation.list();

			expect(items).toEqual([
				{ ...observation(0), addedAt },
				{ ...observation(1), addedAt }
			]);
		});

		test('all', async () => {
			await tables.Observation.set(observation(0));
			await tables.Image.set(image(0));
			await tables.Image.set(image(1));
			await tables.Observation.set(observation(1));

			const items = tables.Observation.all();

			expect(await items.next()).toEqual({
				done: false,
				value: { ...observation(0), addedAt }
			});
			expect(await items.next()).toEqual({
				done: false,
				value: { ...observation(1), addedAt }
			});
			expect(await items.next()).toEqual({ done: true, value: undefined });
			expect(await items.next()).toEqual({ done: true, value: undefined });
		});
		describe('raw', () => {
			test('set', async () => {
				await tables.Image.raw.set(image(0));
				await tables.Image.raw.set({
					...image(1),
					metadata: {
						water: {
							value: '"bucket"',
							alternatives: {
								'"release!!!!"': 0.3
							}
						}
					}
				});
				expect(tables.Image.state).toHaveLength(0);
				await tables.Image.refresh('testing');
				expect(tables.Image.state).toEqual([
					{
						...image(0),
						boundingBoxesAnalyzed: false,
						dimensions: { width: 100, height: 100, aspectRatio: 1 },
						addedAt,
						metadata: {
							water: {
								value: 'bucket',
								confidence: 1,
								confirmed: false,
								manuallyModified: false,
								isDefault: false,
								alternatives: {
									'"release!!!!"': 0.3
								}
							}
						}
					},
					{
						...image(1),
						boundingBoxesAnalyzed: false,
						dimensions: { width: 100, height: 100, aspectRatio: 1 },
						addedAt,
						metadata: {
							water: {
								value: 'bucket',
								confidence: 1,
								confirmed: false,
								manuallyModified: false,
								isDefault: false,
								alternatives: {
									'"release!!!!"': 0.3
								}
							}
						}
					}
				]);
			});

			test('get', async () => {
				await tables.Image.set(image(0));
				await tables.Image.set(image(1));
				expect(await tables.Image.get(imageId('0', 0))).toEqual({
					...image(0),
					addedAt,
					dimensions: { width: 100, height: 100, aspectRatio: 1 },
					boundingBoxesAnalyzed: false,
					metadata: {
						water: {
							value: 'bucket',
							confidence: 1,
							confirmed: false,
							manuallyModified: false,
							isDefault: false,
							alternatives: {
								'"release!!!!"': 0.3
							}
						}
					}
				});
				expect(await tables.Image.raw.get(imageId('0', 1))).toEqual({
					...image(1),
					addedAt: addedAt.toISOString(),
					metadata: {
						water: {
							value: '"bucket"',
							alternatives: {
								'"release!!!!"': 0.3
							}
						}
					}
				});
			});
		});
	});
});

test('dependencyURI', () => {
	expect(idb.dependencyURI('Protocol', 'sixseven')).toBe('idb://Protocol/sixseven');
	expect(idb.dependencyURI('Metadata', '')).toBe('idb://Metadata');
	expect(idb.dependencyURI('Settings', 'quoi', 'coubeh')).toBe('idb://Settings/quoi/coubeh');
	expect(idb.dependencyURI('Settings', 'quoi', 'coubeh', 'feur/aussi')).toBe(
		'idb://Settings/quoi/coubeh/feur/aussi'
	);
});
