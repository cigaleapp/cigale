import 'fake-indexeddb/auto';

import type * as DB from './database.js';
import type { NamespacedMetadataID } from './schemas/common.js';

import { beforeEach, describe, expect, test } from 'vitest';

import { cascadeLabels, computeCascades } from './cascades.js';
import { Schemas } from './database.js';
import { openDatabase } from './idb.svelte.js';
import { metadataOptionId, namespacedMetadataId } from './schemas/metadata.js';

const mockMetadata = (id: string, type: DB.MetadataType = 'enum') =>
	Schemas.Metadata.in.assert({
		description: '',
		id: namespacedMetadataId('mockproto', id),
		label: '',
		mergeMethod: 'none',
		required: false,
		type,
		images: [],
		sortable: false,
		groupable: false,
	});

const mockOption = (metadataId: string, i: number) => ({
	metadataId: namespacedMetadataId('mockproto', metadataId),
	id: metadataOptionId(namespacedMetadataId('mockproto', metadataId), i.toString()),
	...Schemas.MetadataEnumVariant.in.assert({
		description: '',
		key: i.toString(),
		label: `Option ${i}`,
		synonyms: [],
	}),
});

beforeEach(async () => {
	const db = await openDatabase();
	await db.clear('Metadata');
	await db.clear('MetadataOption');
	await db.put('Protocol', {
		id: 'mockproto',
		metadata: ['mockproto__genus', 'mockproto__difficulty'],
		// TODO: test with imported metadata too
		importedMetadata: [],
		name: '',
		description: '',
		authors: [],
	});
});

describe('complex case with multiple metadata in the cascades', () => {
	async function setup() {
		const db = await openDatabase();

		const [species, genus, difficulty] = [
			await db.add('Metadata', mockMetadata('species')),
			await db.add('Metadata', mockMetadata('genus')),
			await db.add('Metadata', mockMetadata('difficulty')),
		];

		const options = [species, genus, difficulty].flatMap((mid) =>
			[1, 2, 3, 4].map((oi) => mockOption(mid, oi))
		);

		const [
			species40,
			species41,
			species42,
			species44,
			genus1,
			genus2,
			genus3,
			_,
			difficulty1,
			difficulty2,
			difficulty3,
			___,
		] = options;

		species40.cascade = {
			[genus]: [genus1.key],
		};

		species41.cascade = {
			[genus]: [genus1.key],
		};

		species42.cascade = {
			[genus]: [genus2.key],
			[difficulty]: [difficulty3.key],
		};

		species44.cascade = {
			[genus]: [genus3.key],
			[difficulty]: [difficulty1.key],
		};

		genus1.cascade = {
			[difficulty]: [difficulty2.key],
		};

		await Promise.all(options.map(async (opt) => db.add('MetadataOption', opt)));
		return {
			species,
			species40,
			species41,
			species42,
			species44,
			genus1,
			genus2,
			genus3,
			_,
			difficulty1,
			difficulty2,
			difficulty3,
			___,
		};
	}

	test('computeCascades', async () => {
		const { species, species40, species41, species42, species44 } = await setup();
		const db = await openDatabase();

		const result = await computeCascades({
			db,
			metadataId: species,
			value: species40.key,
			confidence: 0.4,
			confidences: [
				{ value: species41.key, confidence: 0.3 },
				{ value: species42.key, confidence: 0.2 },
				{ value: species44.key, confidence: 0.1 },
			],
		});

		expect(result).toMatchObject([
			{
				metadataId: 'mockproto__genus',
				value: '1',
				confidence: 0.7,
				confidences: [
					{
						confidence: 0.2,
						value: '2',
					},
					{
						confidence: 0.1,
						value: '3',
					},
				],
			},
			{
				metadataId: 'mockproto__difficulty',
				value: '3',
				confidence: 0.2,
				confidences: [
					{
						confidence: 0.1,
						value: '1',
					},
				],
			},
		]);
	});

	test('cascadeLabels', async () => {
		const { species40 } = await setup();
		const db = await openDatabase();

		const result = await cascadeLabels({
			db,
			protocolId: 'mockproto',
			option: species40,
		});

		expect(result).toMatchObject({
			mockproto__genus: [
				{
					_narrowableIn: [],
					cascade: {
						mockproto__difficulty: ['2'],
					},
					description: '',
					id: 'mockproto__genus:1',
					key: '1',
					label: 'Option 1',
					metadataId: 'mockproto__genus',
					synonyms: [],
				},
			],
		});
	});
});

describe('without any cascades', () => {
	async function setup() {
		const db = await openDatabase();

		const [species, genus, difficulty] = [
			await db.add('Metadata', mockMetadata('species')),
			await db.add('Metadata', mockMetadata('genus')),
			await db.add('Metadata', mockMetadata('difficulty')),
		];

		const options = [species, genus, difficulty].flatMap((mid) =>
			[1, 2, 3, 4].map((oi) => mockOption(mid, oi))
		);

		await Promise.all(options.map(async (opt) => db.add('MetadataOption', opt)));

		return { species, genus, options, difficulty };
	}

	test('computeCascades', async () => {
		const db = await openDatabase();
		const { species } = await setup();

		const result = await computeCascades({
			db,
			metadataId: species,
			value: '1',
			confidence: 0.4,
			confidences: [
				{ value: 2, confidence: 0.3 },
				{ value: 3, confidence: 0.2 },
				{ value: 4, confidence: 0.1 },
			],
		});

		expect(result).toMatchObject([]);
	});

	test('cascadeLabels', async () => {
		const db = await openDatabase();
		const {
			options: [species41],
		} = await setup();

		const result = await cascadeLabels({
			db,
			protocolId: 'mockproto',
			option: species41,
		});

		expect(result).toMatchObject({});
	});
});
