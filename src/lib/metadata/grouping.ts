import * as dates from 'date-fns';

import type * as DB from '$lib/database.js';
import { type Language } from '$lib/i18n';
import { type RuntimeValue } from '$lib/schemas/metadata.js';
import { GROUPING_TOLERANCES, GroupSettings } from '$lib/schemas/sessions.js';
import { fromEntries, groupBy, keys, mapValues, round } from '$lib/utils.js';

import { metadataPrettyValue } from './display.js';
import { switchOnMetadataType } from './types.js';

/**
 *
 * @param  args
 * @param  args.language the language to use for pretty-printing metadata values
 * @param  args.options the metadata options, if applicable (for enums)
 * @param  args.type the metadata type of the given values to group with
 * @param  args.tolerances tolerances to apply when comparing certain metadata types.
 * @param  args.tolerances.date the granularity to consider when comparing date values
 * @param  args.tolerances.float number of decimal places to consider when comparing number values (ints or floats). If negative, rounds to powers of ten. Also used for location latitude/longitude values and bounding box coordinates.
 * @returns  a function to put a given value into a group, returning the serialized group key
 */
export function metadataValueGrouper<Type extends DB.MetadataType>({
	language,
	type,
	options = [],
	tolerances
}: {
	type: Type;
	language: Language;
	options?: DB.MetadataEnumVariant[];
	tolerances?: undefined | (typeof GroupSettings)['infer']['tolerances'];
}) {
	const decimalTolerance = tolerances
		? {
				giga: -9,
				mega: -6,
				kilo: -3,
				hecto: -2,
				deca: -1,
				unit: 0,
				deci: 1,
				centi: 2,
				milli: 3,
				micro: 6,
				nano: 9
			}[tolerances.decimal]
		: undefined;

	const rnd = (v: number) => round(v, decimalTolerance!);

	const display = (value: RuntimeValue) =>
		metadataPrettyValue(value, {
			type,
			language,
			valueLabel: options.find((o) => o.key === value?.toString())?.label,
			boundingBoxPrecision: decimalTolerance
		});

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
				switch (tolerances?.dates) {
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
					default:
						throw new Error(
							`Invalid date tolerance: ${tolerances?.dates} (expected ${keys(GROUPING_TOLERANCES.dates).join(', ')})`
						);
				}
			}
		});
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;
	const { metadatas, values } = await import('./_testdata.js');

	function groupMetadataValues<Type extends DB.MetadataType>(
		vals: (typeof values)[keyof typeof values],
		settings: Omit<Parameters<typeof metadataValueGrouper<Type>>[0], 'language'>
	) {
		const grouper = metadataValueGrouper({
			language: 'fr',
			...settings
		});

		return mapValues(
			fromEntries([...groupBy(vals, ([, value]) => grouper(value)).entries()]),
			(items) => items.map(([id]) => id)
		);
	}

	describe('groupMetadataValues', () => {
		describe('integers', () => {
			test('with unit tolerance', () => {
				expect(
					groupMetadataValues(values.integer, {
						type: metadatas.integer.type,
						tolerances: { decimal: 'unit', dates: 'minute' }
					})
				).toMatchObject({
					'10': ['item1', 'item2'],
					'15': ['item3'],
					'20': ['item4'],
					'30': ['item5']
				});
			});

			test('with tens tolerance', () => {
				expect(
					groupMetadataValues(values.integer, {
						type: metadatas.integer.type,
						tolerances: { decimal: 'deca', dates: 'minute' }
					})
				).toMatchObject({
					'10': ['item1', 'item2'],
					'20': ['item3', 'item4'],
					'30': ['item5']
				});
			});
		});

		describe('floats', () => {
			test('with deci tolerance', () => {
				expect(
					groupMetadataValues(values.float, {
						type: metadatas.float.type,
						tolerances: { decimal: 'deci', dates: 'minute' }
					})
				).toMatchObject({
					'10,1': ['item1', 'item2'],
					'15,6': ['item3'],
					'20': ['item4', 'item5'],
					'25': ['item6']
				});
			});

			test('with centi tolerance', () => {
				expect(
					groupMetadataValues(values.float, {
						type: metadatas.float.type,
						tolerances: { decimal: 'centi', dates: 'minute' }
					})
				).toMatchObject({
					'10,12': ['item1'],
					'10,13': ['item2'],
					'15,57': ['item3'],
					'20': ['item4', 'item5'],
					'25': ['item6']
				});
			});

			test('with kilo tolerance', () => {
				expect(
					groupMetadataValues(values.float, {
						type: metadatas.float.type,
						tolerances: { decimal: 'kilo', dates: 'minute' }
					})
				).toMatchObject({
					'0': ['item1', 'item2', 'item3', 'item4', 'item5', 'item6']
				});
			});
		});

		describe('dates', () => {
			test('with day tolerance', () => {
				expect(
					groupMetadataValues(values.date, {
						type: metadatas.date.type,
						tolerances: { decimal: 'unit', dates: 'day' }
					})
				).toMatchObject({
					'1 janvier 2023': ['item1', 'item2'],
					'2 janvier 2023': ['item3'],
					'3 janvier 2023': ['item4', 'item5'],
					'4 janvier 2023': ['item6']
				});
			});

			test('with minute tolerance', () => {
				expect(
					groupMetadataValues(values.date, {
						type: metadatas.date.type,
						tolerances: { decimal: 'unit', dates: 'minute' }
					})
				).toMatchObject({
					'1 janvier 2023 à 12:00': ['item1', 'item2'],
					'2 janvier 2023 à 12:00': ['item3'],
					'3 janvier 2023 à 12:00': ['item4'],
					'3 janvier 2023 à 12:05': ['item5'],
					'4 janvier 2023 à 12:00': ['item6']
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
				Non: ['item2', 'item4', 'item5'],
				Oui: ['item1', 'item3', 'item6']
			});
		});

		describe('locations', () => {
			test('with deci tolerance', () => {
				expect(
					groupMetadataValues(values.location, {
						type: metadatas.location.type,
						tolerances: { decimal: 'deci', dates: 'minute' }
					})
				).toMatchObject({
					'10.1, 20.1': ['item1', 'item2', 'item4', 'item5'],
					'15.6, 25.6': ['item3'],
					'30, 40': ['item6']
				});
			});

			test('with unit tolerance', () => {
				expect(
					groupMetadataValues(values.location, {
						type: metadatas.location.type,
						tolerances: { decimal: 'unit', dates: 'minute' }
					})
				).toMatchObject({
					'10, 20': ['item1', 'item2', 'item4', 'item5'],
					'16, 26': ['item3'],
					'30, 40': ['item6']
				});
			});

			test('with deca tolerance', () => {
				expect(
					groupMetadataValues(values.location, {
						type: metadatas.location.type,
						tolerances: { decimal: 'deca', dates: 'minute' }
					})
				).toMatchObject({
					'10, 20': ['item1', 'item2', 'item4', 'item5'],
					'20, 30': ['item3'],
					'30, 40': ['item6']
				});
			});
		});

		test('enums', () => {
			expect(
				groupMetadataValues(values.enum, {
					type: metadatas.enum.type
				})
			).toMatchObject({
				A: ['item1', 'item3', 'item6'],
				B: ['item2', 'item5'],
				C: ['item4']
			});
		});

		describe('bounding boxes', () => {
			test('with deci tolerance', () => {
				expect(
					groupMetadataValues(values.boundingbox, {
						type: metadatas.boundingbox.type,
						tolerances: { decimal: 'deci', dates: 'minute' }
					})
				).toMatchObject({
					'Boîte de (10, 10) à (60, 60)': ['item1'],
					'Boîte de (11, 11.5) à (61, 61.5)': ['item4', 'item5'],
					'Boîte de (12, 12) à (62, 62)': ['item2'],
					'Boîte de (15, 15) à (65, 65)': ['item6']
				});
			});

			test('with unit tolerance', () => {
				expect(
					groupMetadataValues(values.boundingbox, {
						type: metadatas.boundingbox.type,
						tolerances: { decimal: 'unit', dates: 'minute' }
					})
				).toMatchObject({
					'Boîte de (10, 10) à (60, 60)': ['item1'],
					'Boîte de (11, 12) à (61, 62)': ['item4', 'item5'],
					'Boîte de (12, 12) à (62, 62)': ['item2'],
					'Boîte de (15, 15) à (65, 65)': ['item6']
				});
			});

			test('with deca tolerance', () => {
				expect(
					groupMetadataValues(values.boundingbox, {
						type: metadatas.boundingbox.type,
						tolerances: { decimal: 'deca', dates: 'minute' }
					})
				).toMatchObject({
					'Boîte de (10, 10) à (60, 60)': ['item1', 'item2', 'item4', 'item5'],
					'Boîte de (20, 20) à (70, 70)': ['item6']
				});
			});
		});
	});
}
