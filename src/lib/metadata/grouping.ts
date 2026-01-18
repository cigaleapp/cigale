import * as dates from 'date-fns';

import type * as DB from '$lib/database.js';
import { plural, type Language } from '$lib/i18n';
import { METADATA_TYPES, type RuntimeValue } from '$lib/schemas/metadata';
import { fromEntries, groupBy, keys, mapEntries, mapValues, nonnull, round } from '$lib/utils';

import { metadataPrettyValue } from './display';
import { serializeMetadataValue } from './serializing';
import { switchOnMetadataType } from './types';

/**
 *
 * @param  args
 * @param  args.language the language to use for pretty-printing metadata values
 * @param  args.options the metadata options, if applicable (for enums)
 * @param  args.type the metadata type of the given values to group with
 * @param  [args.tolerances] tolerances to apply when comparing certain metadata types.
 * @param  args.tolerances.date the granularity to consider when comparing date values
 * @param  args.tolerances.float number of decimal places to consider when comparing number values (ints or floats). If negative, rounds to powers of ten. Also used for location latitude/longitude values and bounding box coordinates.
 * @returns  a function to put a given value into a group, returning the serialized group key
 */
export function metadataValueGrouper({
	language,
	type,
	options = [],
	tolerances = {
		date: 'day',
		float: 1
	}
}: {
	language: Language;
	type: DB.MetadataType;
	options?: DB.MetadataEnumVariant[];
	tolerances?:
		| undefined
		| {
				date: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
				float: number;
		  };
}) {
	const rnd = (v: number) => round(v, tolerances.float);
	const display = (value: RuntimeValue) =>
		metadataPrettyValue(language, { type }, value, options.find((o) => o.key === value)?.label);

	return (value: RuntimeValue) =>
		switchOnMetadataType<string>(type, value, {
			boolean: display,
			string: display,
			enum: display,
			integer: (v) => display(rnd(v)),
			float: (v) => display(rnd(v)),
			boundingbox: (coords) => display(mapValues(coords, rnd)),
			location: (coords) => display(mapValues(coords, rnd)),
			date: (v) => {
				switch (tolerances.date) {
					case 'year':
						return `Année ${dates.getYear(v)}`;
					case 'month':
						return dates.format(v, 'MMMM yyyy');
					case 'day':
						return new Intl.DateTimeFormat(language, {
							dateStyle: 'long'
						}).format(v);
					case 'hour':
						return new Intl.DateTimeFormat(language, {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: 'numeric'
						}).format(v);
					case 'minute':
						return new Intl.DateTimeFormat(language, {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: 'numeric',
							minute: 'numeric'
						}).format(v);
					case 'second':
						return new Intl.DateTimeFormat(language, {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: 'numeric',
							minute: 'numeric',
							second: 'numeric'
						}).format(v);
					default:
						throw new Error(
							`Invalid date tolerance: ${tolerances.date} (expected year, month, day, hour, minute or second)`
						);
				}
			}
		});
}

// /**
//  * Groups images or observations by their metadata values.
//  * Items that don't have a value for the given metadata will be grouped into a empty-string-keyed value
//  * @param  items the items to group
//  * @param  args
//  * @param  args.metadata the metadata to group with
//  * @param  args.tolerances tolerances to apply when comparing certain metadata types.
//  */
// export function groupByMetadataValue<Item extends { id: string; metadata: DB.MetadataValues }>(
// 	items: Array<Item>,
// 	{
// 		metadata,
// 		tolerances
// 	}: {
// 		metadata: Pick<DB.Metadata, 'type' | 'id'>;
// 		tolerances?: Parameters<typeof metadataValueGrouper>[0]['tolerances'];
// 	}
// ) {
// 	const itemsById = items
// 		.map(({ id, metadata: m }) => [id, m[metadata.id]?.value ?? null] as const)
// 		.filter(([, v]) => v !== null);

// 	const grouped: Record<string, Item[]> = {};

// 	for (const [group, ids] of Object.entries(
// 		groupMetadataValues(itemsById, {
// 			type: metadata.type,
// 			tolerances
// 		})
// 	)) {
// 		grouped[group] = ids.map((id) => items.find((item) => item.id === id)).filter(nonnull);
// 	}

// 	// Group items without a value under an empty string key
// 	grouped[''] = items.filter((item) => item.metadata[metadata.id] === undefined);

// 	return grouped;
// }

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;
	const { metadatas, values } = await import('./_testdata.js');

	function groupMetadataValues(
		vals: (typeof values)[keyof typeof values],
		settings: Omit<Parameters<typeof metadataValueGrouper>[0], 'language'>
	) {
		const grouper = metadataValueGrouper({
			language: 'fr',
			...settings
		});

		return mapValues(
			fromEntries([...groupBy(vals, ([_, value]) => grouper(value)).entries()]),
			(items) => items.map(([id]) => id)
		);
	}

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
				apple: ['item1', 'item3'],
				banana: ['item2', 'item5'],
				grape: ['item6'],
				orange: ['item4']
			});
		});

		test('booleans', () => {
			expect(
				groupMetadataValues(values.boolean, {
					type: metadatas.boolean.type
				})
			).toMatchObject({
				Oui: ['item2', 'item4', 'item5'],
				Non: ['item1', 'item3', 'item6']
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
