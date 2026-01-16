import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, test } from 'vitest';

import { cascadeLabels, computeCascades } from './cascades.js';
import { openDatabase } from './idb.svelte.js';
import { metadataOptionId, namespacedMetadataId } from './schemas/metadata.js';

/**
 * @param {string} id
 * @param {import('$lib/database').MetadataType} [type="enum"]
 * @returns {typeof import('$lib/database').Tables.Metadata.infer}
 */
const mockMetadata = (id, type = 'enum') => ({
	description: '',
	id: namespacedMetadataId('mockproto', id),
	label: '',
	mergeMethod: 'none',
	required: false,
	type
});

/**
 * @param {string} metadataId
 * @param {number} i
 * @returns {  typeof import('$lib/database').Tables.MetadataOption.infer } */
const mockOption = (metadataId, i) => ({
	metadataId,
	id: metadataOptionId(metadataId, i.toString()),
	description: '',
	key: i.toString(),
	label: `Option ${i}`,
	synonyms: []
});

beforeEach(async () => {
	const db = await openDatabase();
	await db.clear('Metadata');
	await db.clear('MetadataOption');
});

describe('complex case with multiple metadata in the cascades', () => {
	async function setup() {
		const db = await openDatabase();

		const [species, genus, difficulty] = [
			await db.add('Metadata', mockMetadata('species')),
			await db.add('Metadata', mockMetadata('genus')),
			await db.add('Metadata', mockMetadata('difficulty'))
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
			___
		] = options;

		species40.cascade = {
			[genus]: genus1.key
		};

		species41.cascade = {
			[genus]: genus1.key
		};

		species42.cascade = {
			[genus]: genus2.key,
			[difficulty]: difficulty3.key
		};

		species44.cascade = {
			[genus]: genus3.key,
			[difficulty]: difficulty1.key
		};

		genus1.cascade = {
			[difficulty]: difficulty2.key
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
			___
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
			alternatives: [
				{ value: species41.key, confidence: 0.3 },
				{ value: species42.key, confidence: 0.2 },
				{ value: species44.key, confidence: 0.1 }
			]
		});

		expect(result).toMatchObject([
			{
				metadataId: 'mockproto__genus',
				value: '1',
				confidence: 0.7,
				alternatives: [
					{
						confidence: 0.2,
						value: '2'
					},
					{
						confidence: 0.1,
						value: '3'
					}
				]
			},
			{
				metadataId: 'mockproto__difficulty',
				value: '3',
				confidence: 0.2,
				alternatives: [
					{
						confidence: 0.1,
						value: '1'
					}
				]
			}
		]);
	});

	test('cascadeLabels', async () => {
		const { species40 } = await setup();
		const db = await openDatabase();

		const result = await cascadeLabels({
			db,
			protocolId: 'mockproto',
			cache: {},
			option: species40
		});

		expect(result).toMatchObject({
			mockproto__difficulty: {
				color: undefined,
				depth: 1,
				icon: undefined,
				metadata: '',
				value: 'Option 2'
			},
			mockproto__genus: {
				color: undefined,
				depth: 0,
				icon: undefined,
				metadata: '',
				value: 'Option 1'
			}
		});
	});
});

describe('without any cascades', () => {
	async function setup() {
		const db = await openDatabase();

		const [species, genus, difficulty] = [
			await db.add('Metadata', mockMetadata('species')),
			await db.add('Metadata', mockMetadata('genus')),
			await db.add('Metadata', mockMetadata('difficulty'))
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
			alternatives: [
				{ value: 2, confidence: 0.3 },
				{ value: 3, confidence: 0.2 },
				{ value: 4, confidence: 0.1 }
			]
		});

		expect(result).toMatchObject([]);
	});

	test('cascadeLabels', async () => {
		const db = await openDatabase();
		const {
			options: [species41]
		} = await setup();

		const result = await cascadeLabels({
			db,
			protocolId: 'mockproto',
			cache: {},
			option: species41
		});

		expect(result).toMatchObject({});
	});
});
