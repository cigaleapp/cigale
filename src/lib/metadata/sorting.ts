import * as dates from 'date-fns';

import type * as DB from '$lib/database.js';
import type { RuntimeValue } from '$lib/schemas/metadata.js';
import type { Comparator } from '$lib/utils.js';

import { switchOnMetadataType } from './index.js';

/**
 * Returns a comparator function to sort metadata values according to their runtime value.
 * @param  args
 * @param  args.metadata the metadata to sort with
 * @param args.options the options of the metadata, if it's an enum
 * @returns
 */
function compareMetadataValues({
	type,
	options = []
}: {
	type: DB.MetadataType;
	options?: DB.MetadataEnumVariant[];
}): Comparator<RuntimeValue> {
	return (a, b) =>
		switchOnMetadataType<number>(type, [a, b], {
			boolean: (a, b) => Number(a) - Number(b),
			integer: (a, b) => a - b,
			float: (a, b) => a - b,
			date: (a, b) => dates.compareAsc(new Date(a), new Date(b)),
			string: (a, b) => a.localeCompare(b),
			location: (a, b) => a.latitude - b.latitude || a.longitude - b.longitude,
			boundingbox: (a, b) => a.x - b.x || a.y - b.y || a.w - b.w || a.h - b.h,
			enum: (a, b) => {
				const optionA = options.find((opt) => opt.key === a);
				const optionB = options.find((opt) => opt.key === b);
				if (optionA?.index !== undefined && optionB?.index !== undefined) {
					return optionA.index - optionB.index;
				} else if (optionA) {
					return -1;
				} else if (optionB) {
					return 1;
				} else {
					return a.toString().localeCompare(b.toString());
				}
			}
		});
}

/**
 * Compare observation or images by their value of a given metadata
 * @param {object} args
 * @param {DB.Metadata} args.metadata the metadata to sort with
 * @param {DB.MetadataEnumVariant[]} [args.options] the options of the metadata, if it's an enum
 * @returns {(a: { metadata: DB.MetadataValues }, b: { metadata: DB.MetadataValues }) => number}
 */
export function compareByMetadataValue({
	metadata,
	options = []
}: {
	metadata: Pick<DB.Metadata, 'id' | 'type'>;
	options?: DB.MetadataEnumVariant[];
}): Comparator<{ metadata: DB.MetadataValues }> {
	const comparator = compareMetadataValues({ type: metadata.type, options });
	return (a, b) => {
		const valueA = a.metadata[metadata.id]?.value ?? null;
		const valueB = b.metadata[metadata.id]?.value ?? null;

		if (valueA === null && valueB === null) return 0;
		if (valueA === null) return -1;
		if (valueB === null) return 1;

		return comparator(valueA, valueB);
	};
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;
	const { items, metadatas } = await import('./_testdata.js');

	describe('compareByMetadataValue', () => {
		test('integer', () => {
			const comparator = compareByMetadataValue({
				metadata: metadatas.integer
			});

			expect(items.toSorted(comparator).map((i) => i.id)).toMatchObject([
				'item6',
				'item1',
				'item2',
				'item3',
				'item4',
				'item5'
			]);
		});
		test('enum', () => {
			const comparator = compareByMetadataValue({
				metadata: metadatas.enum,
				options: metadatas.enum.options
			});

			expect(items.toSorted(comparator).map((i) => i.id)).toMatchObject([
				'item1',
				'item2',
				'item3',
				'item4',
				'item5',
				'item6'
			]);
		});
	});

	describe('compareMetadataValues', () => {
		test('integer', () => {
			const comparator = compareMetadataValues({ type: 'integer' });

			expect([5, 2, 9, 1, 4].toSorted(comparator)).toMatchObject([1, 2, 4, 5, 9]);
		});

		test('float', () => {
			const comparator = compareMetadataValues({ type: 'float' });

			expect([5.5, 2.2, 9.9, 1.1, 4.4].toSorted(comparator)).toMatchObject([
				1.1, 2.2, 4.4, 5.5, 9.9
			]);
		});

		test('date', () => {
			const comparator = compareMetadataValues({ type: 'date' });

			expect(
				[
					new Date('2023-01-03'),
					new Date('2022-12-31'),
					new Date('2023-01-01'),
					new Date('2023-01-02')
				].toSorted(comparator)
			).toMatchObject([
				new Date('2022-12-31'),
				new Date('2023-01-01'),
				new Date('2023-01-02'),
				new Date('2023-01-03')
			]);
		});

		test('string', () => {
			const comparator = compareMetadataValues({ type: 'string' });

			expect(['banana', 'apple', 'ananas', 'date'].toSorted(comparator)).toMatchObject([
				'ananas',
				'apple',
				'banana',
				'date'
			]);
		});

		test('boolean', () => {
			const comparator = compareMetadataValues({ type: 'boolean' });

			expect([true, false, true, false, false].toSorted(comparator)).toMatchObject([
				false,
				false,
				false,
				true,
				true
			]);
		});

		test('enum', () => {
			const comparator = compareMetadataValues({
				type: 'enum',
				options: [
					{ key: 'A', label: 'Option A', index: 1, synonyms: [] },
					{ key: 'B', label: 'Option B', index: 0, synonyms: [] },
					{ key: 'C', label: 'Option C', index: 2, synonyms: [] }
				]
			});

			expect(['B', 'C', 'A', 'B', 'C', 'A'].toSorted(comparator)).toMatchObject([
				'B',
				'B',
				'A',
				'A',
				'C',
				'C'
			]);
		});

		test('location', () => {
			const comparator = compareMetadataValues({ type: 'location' });

			expect(
				[
					{ latitude: 10, longitude: 20 },
					{ latitude: 15, longitude: 25 },
					{ latitude: 10, longitude: 15 },
					{ latitude: 20, longitude: 30 }
				].toSorted(comparator)
			).toMatchObject([
				{ latitude: 10, longitude: 15 },
				{ latitude: 10, longitude: 20 },
				{ latitude: 15, longitude: 25 },
				{ latitude: 20, longitude: 30 }
			]);
		});

		test('boundingbox', () => {
			const comparator = compareMetadataValues({ type: 'boundingbox' });

			expect(
				[
					{ x: 10, y: 10, w: 50, h: 50 },
					{ x: 15, y: 15, w: 40, h: 40 },
					{ x: 10, y: 5, w: 60, h: 60 },
					{ x: 5, y: 20, w: 70, h: 70 }
				].toSorted(comparator)
			).toMatchObject([
				{ h: 70, w: 70, x: 5, y: 20 },
				{ h: 60, w: 60, x: 10, y: 5 },
				{ h: 50, w: 50, x: 10, y: 10 },
				{ h: 40, w: 40, x: 15, y: 15 }
			]);
		});
	});
}
