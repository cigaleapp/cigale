import * as dates from 'date-fns';

import type * as DB from '$lib/database.js';
import { METADATA_TYPES, type RuntimeValue } from '$lib/schemas/metadata';
import { keys, mapEntries, mapValues, nonnull, round } from '$lib/utils';

import { serializeMetadataValue } from './serializing';
import { switchOnMetadataType } from './types';

/**
 *
 * @param  values the metadata values to group. The first element of the tuples is some key or ID to identify the source of the metadata value.
 * @param  args
 * @param  args.type the metadata type of the given values to group with
 * @param  [args.tolerances] tolerances to apply when comparing certain metadata types.
 * @param  args.tolerances.date the granularity to consider when comparing date values
 * @param  args.tolerances.float number of decimal places to consider when comparing number values (ints or floats). If negative, rounds to powers of ten. Also used for location latitude/longitude values and bounding box coordinates.
 * @returns  the grouped metadata values. Keys are eother serialized metadata values, or numbers for date types (representing the second / minute / etc depending on the tolerance specified).
 */
function groupMetadataValues(
	values: Array<readonly [string, RuntimeValue]>,
	{
		type,
		tolerances = {
			date: 'day',
			float: 1
		}
	}: {
		type: DB.MetadataType;
		tolerances?:
			| undefined
			| {
					date: 'year' | 'month' | 'day' | 'weekday' | 'hour' | 'minute' | 'second';
					float: number;
			  };
	}
) {
	const rnd = (v: number) => round(v, tolerances.float);

	return mapValues(
		Object.groupBy(values, ([, value]) =>
			switchOnMetadataType<string | number>(type, value, {
				boolean: serializeMetadataValue,
				string: serializeMetadataValue,
				enum: serializeMetadataValue,
				integer: (v) => serializeMetadataValue(rnd(v)),
				float: (v) => serializeMetadataValue(rnd(v)),
				boundingbox: (coords) => serializeMetadataValue(mapValues(coords, rnd)),
				location: (coords) => serializeMetadataValue(mapValues(coords, rnd)),
				date: (v) => {
					switch (tolerances.date) {
						case 'year':
							return dates.getYear(v);
						case 'month':
							return dates.getMonth(v);
						case 'day':
							return dates.getDate(v);
						case 'weekday':
							return dates.getDay(v);
						case 'hour':
							return dates.getHours(v);
						case 'minute':
							return dates.getMinutes(v);
						case 'second':
							return dates.getSeconds(v);
						default:
							throw new Error(
								`Invalid date tolerance: ${tolerances.date} (expected year, month, day, weekday, hour, minute or second)`
							);
					}
				}
			}).toString()
		),
		(group) => group!.map(([id]) => id)
	);
}

/**
 * Groups images or observations by their metadata values.
 * Items that don't have a value for the given metadata will be grouped into a empty-string-keyed value
 * @param  items the items to group
 * @param  args
 * @param  args.metadata the metadata to group with
 * @param  args.tolerances tolerances to apply when comparing certain metadata types.
 */
export function groupByMetadataValue<Item extends { id: string; metadata: DB.MetadataValues }>(
	items: Array<Item>,
	{
		metadata,
		tolerances
	}: {
		metadata: Pick<DB.Metadata, 'type' | 'id'>;
		tolerances?: Parameters<typeof groupMetadataValues>[1]['tolerances'];
	}
) {
	const itemsById = items
		.map(({ id, metadata: m }) => [id, m[metadata.id]?.value ?? null] as const)
		.filter(([, v]) => v !== null);

	const grouped: Record<string, Item[]> = {};

	for (const [group, ids] of Object.entries(
		groupMetadataValues(itemsById, {
			type: metadata.type,
			tolerances
		})
	)) {
		grouped[group] = ids.map((id) => items.find((item) => item.id === id)).filter(nonnull);
	}

	// Group items without a value under an empty string key
	grouped[''] = items.filter((item) => item.metadata[metadata.id] === undefined);

	return grouped;
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;
	const { items, metadatas, values } = await import('./_testdata.js');

	test('groupByMetadataValue', () => {
		expect(
			groupByMetadataValue(items, {
				metadata: metadatas.integer
			})
		).toMatchObject({
			'': [items[5]],
			'10': [items[0], items[1]],
			'15': [items[2]],
			'20': [items[3]],
			'30': [items[4]]
		});
	});

	describe('groupMetadataValues', () => {
		describe('integers', () => {
			test('with default tolerances', () => {
				expect(
					groupMetadataValues(values.integer, {
						type: metadatas.integer.type
					})
				).toMatchObject({
					'10': ['item1', 'item2'],
					'15': ['item3'],
					'20': ['item4'],
					'30': ['item5']
				});
			});

			test('with tens tolerances', () => {
				expect(
					groupMetadataValues(values.integer, {
						type: metadatas.integer.type,
						tolerances: { float: -1, date: 'second' }
					})
				).toMatchObject({
					'10': ['item1', 'item2'],
					'20': ['item3', 'item4'],
					'30': ['item5']
				});
			});
		});

		describe('floats', () => {
			test('with default tolerances', () => {
				expect(
					groupMetadataValues(values.float, {
						type: metadatas.float.type
					})
				).toMatchObject({
					'10.1': ['item1', 'item2'],
					'15.6': ['item3'],
					'20': ['item4', 'item5'],
					'25': ['item6']
				});
			});

			test('with decimal tolerances', () => {
				expect(
					groupMetadataValues(values.float, {
						type: metadatas.float.type,
						tolerances: { float: 2, date: 'second' }
					})
				).toMatchObject({
					'10.12': ['item1'],
					'10.13': ['item2'],
					'15.57': ['item3'],
					'20': ['item4', 'item5'],
					'25': ['item6']
				});
			});

			test('with hundreds tolerances', () => {
				expect(
					groupMetadataValues(values.float, {
						type: metadatas.float.type,
						tolerances: { float: -2, date: 'second' }
					})
				).toMatchObject({
					'0': ['item1', 'item2', 'item3', 'item4', 'item5', 'item6']
				});
			});
		});

		describe('dates', () => {
			test('with default tolerances', () => {
				expect(
					groupMetadataValues(values.date, {
						type: metadatas.date.type
					})
				).toMatchObject({
					'1': ['item1', 'item2'],
					'2': ['item3'],
					'3': ['item4', 'item5'],
					'4': ['item6']
				});
			});

			test('with minute tolerances', () => {
				expect(
					groupMetadataValues(values.date, {
						type: metadatas.date.type,
						tolerances: { float: 2, date: 'minute' }
					})
				).toMatchObject({
					'0': ['item1', 'item2', 'item3', 'item4', 'item6'],
					'5': ['item5']
				});
			});
		});

		test('strings', () => {
			expect(
				groupMetadataValues(values.string, {
					type: metadatas.string.type
				})
			).toMatchObject({
				'"apple"': ['item1', 'item3'],
				'"banana"': ['item2', 'item5'],
				'"grape"': ['item6'],
				'"orange"': ['item4']
			});
		});

		test('booleans', () => {
			expect(
				groupMetadataValues(values.boolean, {
					type: metadatas.boolean.type
				})
			).toMatchObject({
				false: ['item2', 'item4', 'item5'],
				true: ['item1', 'item3', 'item6']
			});
		});

		describe('locations', () => {
			test('with default tolerances', () => {
				expect(
					groupMetadataValues(values.location, {
						type: metadatas.location.type
					})
				).toMatchObject({
					'{"latitude":10.1,"longitude":20.1}': ['item1', 'item2', 'item4', 'item5'],
					'{"latitude":15.6,"longitude":25.6}': ['item3'],
					'{"latitude":30,"longitude":40}': ['item6']
				});
			});

			test('with unit decimal tolerances', () => {
				expect(
					groupMetadataValues(values.location, {
						type: metadatas.location.type,
						tolerances: { float: 0, date: 'second' }
					})
				).toMatchObject({
					'{"latitude":10,"longitude":20}': ['item1', 'item2', 'item4', 'item5'],
					'{"latitude":16,"longitude":26}': ['item3'],
					'{"latitude":30,"longitude":40}': ['item6']
				});
			});

			test('with tens tolerances', () => {
				expect(
					groupMetadataValues(values.location, {
						type: metadatas.location.type,
						tolerances: { float: -1, date: 'second' }
					})
				).toMatchObject({
					'{"latitude":10,"longitude":20}': ['item1', 'item2', 'item4', 'item5'],
					'{"latitude":20,"longitude":30}': ['item3'],
					'{"latitude":30,"longitude":40}': ['item6']
				});
			});
		});

		test('enums', () => {
			expect(
				groupMetadataValues(values.enum, {
					type: metadatas.enum.type
				})
			).toMatchObject({
				'"A"': ['item1', 'item3', 'item6'],
				'"B"': ['item2', 'item5'],
				'"C"': ['item4']
			});
		});

		describe('bounding boxes', () => {
			test('with default tolerances', () => {
				expect(
					groupMetadataValues(values.boundingbox, {
						type: metadatas.boundingbox.type
					})
				).toMatchObject({
					'{"x":10,"y":10,"w":50,"h":50}': ['item1'],
					'{"x":11,"y":11,"w":50,"h":50}': ['item4', 'item5'],
					'{"x":12,"y":12,"w":50,"h":50}': ['item2'],
					'{"x":15,"y":15,"w":50,"h":50}': ['item6']
				});
			});

			test('with unit decimal tolerances', () => {
				expect(
					groupMetadataValues(values.boundingbox, {
						type: metadatas.boundingbox.type,
						tolerances: { float: 0, date: 'second' }
					})
				).toMatchObject({
					'{"x":10,"y":10,"w":50,"h":50}': ['item1'],
					'{"x":11,"y":11,"w":50,"h":50}': ['item4', 'item5'],
					'{"x":12,"y":12,"w":50,"h":50}': ['item2'],
					'{"x":15,"y":15,"w":50,"h":50}': ['item6']
				});
			});

			test('with tens tolerances', () => {
				expect(
					groupMetadataValues(values.boundingbox, {
						type: metadatas.boundingbox.type,
						tolerances: { float: -1, date: 'second' }
					})
				).toMatchObject({
					'{"x":10,"y":10,"w":50,"h":50}': ['item1', 'item2', 'item4', 'item5'],
					'{"x":20,"y":20,"w":50,"h":50}': ['item6']
				});
			});
		});
	});
}
