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

	const metadatas = {
		integer: { id: 'metadata_integer', type: 'integer' },
		float: { id: 'metadata_float', type: 'float' },
		date: { id: 'metadata_date', type: 'date' },
		string: { id: 'metadata_string', type: 'string' },
		boolean: { id: 'metadata_boolean ', type: 'boolean' },
		location: { id: 'metadata_location ', type: 'location' },
		enum: { id: 'metadata_enum ', type: 'enum' },
		boundingbox: { id: 'metadata_boundingbox ', type: 'boundingbox' }
	} as const satisfies { [K in DB.MetadataType]: Pick<DB.Metadata, 'id' | 'type'> };

	const items: Array<{ id: string; metadata: DB.MetadataValues }> = [
		{
			id: 'item1',
			metadata: {
				metadata_integer: 10,
				metadata_float: 10.1234,
				metadata_date: new Date('2023-01-01T12:00:00Z'),
				metadata_string: 'apple',
				metadata_boolean: true,
				metadata_location: { latitude: 10.12345, longitude: 20.12345 },
				metadata_enum: 'A',
				metadata_boundingbox: { x: 10, y: 10, w: 50, h: 50 }
			}
		},
		{
			id: 'item2',
			metadata: {
				metadata_integer: 10,
				metadata_float: 10.1256,
				metadata_date: new Date('2023-01-01T12:00:30Z'),
				metadata_string: 'banana',
				metadata_boolean: false,
				metadata_location: { latitude: 10.12355, longitude: 20.12355 },
				metadata_enum: 'B',
				metadata_boundingbox: { x: 12, y: 12, w: 50, h: 50 }
			}
		},
		{
			id: 'item3',
			metadata: {
				metadata_integer: 15,
				metadata_float: 15.5678,
				metadata_date: new Date('2023-01-02T12:00:00Z'),
				metadata_string: 'apple',
				metadata_boolean: true,
				metadata_location: { latitude: 15.56789, longitude: 25.56789 },
				metadata_enum: 'A'
				// No bounding box value here
			}
		},
		{
			id: 'item4',
			metadata: {
				metadata_integer: 20,
				metadata_float: 20.0,
				metadata_date: new Date('2023-01-03T12:00:00Z'),
				metadata_string: 'orange',
				metadata_boolean: false,
				metadata_location: { latitude: 10.124, longitude: 20.124 },
				metadata_enum: 'C',
				metadata_boundingbox: { x: 11, y: 11, w: 50, h: 50 }
			}
		},
		{
			id: 'item5',
			metadata: {
				metadata_integer: 30,
				metadata_float: 20.004,
				metadata_date: new Date('2023-01-03T12:05:00Z'),
				metadata_string: 'banana',
				metadata_boolean: false,
				metadata_location: { latitude: 10.124, longitude: 20.124 },
				metadata_enum: 'B',
				metadata_boundingbox: { x: 11, y: 11, w: 50, h: 50 }
			}
		},
		{
			id: 'item6',
			metadata: {
				// No metadata_integer value here
				metadata_float: 25.0,
				metadata_date: new Date('2023-01-04T12:00:00Z'),
				metadata_string: 'grape',
				metadata_boolean: true,
				metadata_location: { latitude: 30.0, longitude: 40.0 },
				metadata_enum: 'A',
				metadata_boundingbox: { x: 15, y: 15, w: 50, h: 50 }
			}
		}
	].map((item) => ({
		...item,
		metadata: Object.fromEntries(
			Object.entries(item.metadata).map(([k, v]) => [
				k,
				{
					value: v,
					manuallyModified: false,
					confidence: 1,
					alternatives: {}
				} satisfies DB.MetadataValue
			])
		)
	}));

	const values = mapEntries(METADATA_TYPES, (typ) => [
		typ,
		items
			.filter((item) => item.metadata[`metadata_${typ}`] !== undefined)
			.map((item) => [item.id, item.metadata[`metadata_${typ}`]!.value] as const)
	]);

	test('groupByMetadataValue', () => {
		expect(
			groupByMetadataValue(items, {
				metadata: metadatas.integer
			})
		).toMatchInlineSnapshot();
	});

	describe('groupMetadataValues', () => {
		describe('integers', () => {
			test('with default tolerances', () => {
				expect(
					groupMetadataValues(values.integer, {
						type: metadatas.integer.type
					})
				).toMatchInlineSnapshot();
			});

			test('with tens tolerances', () => {
				expect(
					groupMetadataValues(values.integer, {
						type: metadatas.integer.type,
						tolerances: { float: -1, date: 'second' }
					})
				).toMatchInlineSnapshot();
			});
		});

		describe('floats', () => {
			test('with default tolerances', () => {
				expect(
					groupMetadataValues(values.float, {
						type: metadatas.float.type
					})
				).toMatchInlineSnapshot();
			});

			test('with decimal tolerances', () => {
				expect(
					groupMetadataValues(values.float, {
						type: metadatas.float.type,
						tolerances: { float: 2, date: 'second' }
					})
				).toMatchInlineSnapshot();
			});

			test('with hundreds tolerances', () => {
				expect(
					groupMetadataValues(values.float, {
						type: metadatas.float.type,
						tolerances: { float: -2, date: 'second' }
					})
				).toMatchInlineSnapshot();
			});
		});

		describe('dates', () => {
			test('with default tolerances', () => {
				expect(
					groupMetadataValues(values.date, {
						type: metadatas.date.type
					})
				).toMatchInlineSnapshot();
			});

			test('with minute tolerances', () => {
				expect(
					groupMetadataValues(values.date, {
						type: metadatas.date.type,
						tolerances: { float: 2, date: 'minute' }
					})
				).toMatchInlineSnapshot();
			});
		});

		test('strings', () => {
			expect(
				groupMetadataValues(values.string, {
					type: metadatas.string.type
				})
			).toMatchInlineSnapshot();
		});

		test('booleans', () => {
			expect(
				groupMetadataValues(values.boolean, {
					type: metadatas.boolean.type
				})
			).toMatchInlineSnapshot();
		});

		describe('locations', () => {
			test('with default tolerances', () => {
				expect(
					groupMetadataValues(values.location, {
						type: metadatas.location.type
					})
				).toMatchInlineSnapshot();
			});

			test('with unit decimal tolerances', () => {
				expect(
					groupMetadataValues(values.location, {
						type: metadatas.location.type,
						tolerances: { float: 0, date: 'second' }
					})
				).toMatchInlineSnapshot();
			});

			test('with tens tolerances', () => {
				expect(
					groupMetadataValues(values.location, {
						type: metadatas.location.type,
						tolerances: { float: -1, date: 'second' }
					})
				).toMatchInlineSnapshot();
			});
		});

		test('enums', () => {
			expect(
				groupMetadataValues(values.enum, {
					type: metadatas.enum.type
				})
			).toMatchInlineSnapshot();
		});

		describe('bounding boxes', () => {
			test('with default tolerances', () => {
				expect(
					groupMetadataValues(values.boundingbox, {
						type: metadatas.boundingbox.type
					})
				).toMatchInlineSnapshot();
			});

			test('with unit decimal tolerances', () => {
				expect(
					groupMetadataValues(values.boundingbox, {
						type: metadatas.boundingbox.type,
						tolerances: { float: 0, date: 'second' }
					})
				).toMatchInlineSnapshot();
			});

			test('with tens tolerances', () => {
				expect(
					groupMetadataValues(values.boundingbox, {
						type: metadatas.boundingbox.type,
						tolerances: { float: -1, date: 'second' }
					})
				).toMatchInlineSnapshot();
			});
		});
	});
}
