import { type } from 'arktype';
import * as dates from 'date-fns';

import * as DB from '$lib/database';
import type { RuntimeValue } from '$lib/schemas/metadata';
import { round } from '$lib/utils';

/**
 * Adds valueLabel to each metadata value object when the metadata is an enum.
 * @param values
 * @param metadataOptions
 * @returns
 */
export function addValueLabels(
	values: DB.MetadataValues,
	metadataOptions: Record<string, Record<string, Pick<DB.MetadataEnumVariant, 'key' | 'label'>>>
): Record<string, DB.MetadataValue & { valueLabel?: string }> {
	return Object.fromEntries(
		Object.entries(values).map(([key, value]) => {
			const opts = metadataOptions[key];
			if (!opts) return [key, value];

			const opt = opts[value.value.toString()];

			return [key, { ...value, valueLabel: opt?.label }];
		})
	);
}

/**
 * Returns a human-friendly string for a metadata value.
 * Used for e.g. CSV exports.
 * @param language
 * @param metadata the metadata definition
 * @param value the value of the metadata
 * @param valueLabel the label of the value, if applicable (e.g. for enums)
 * @param precision number of decimal places to use for float values of bounding box. set to undefined to not limit decimal places.
 */
export function metadataPrettyValue<Type extends DB.MetadataType>(
	value: RuntimeValue<Type> | null,
	{
		language,
		type: metadataType,
		valueLabel,
		boundingBoxPrecision = 2
	}: {
		language: import('$lib/i18n.js').Language;
		type: Type;
		valueLabel?: string | undefined;
		boundingBoxPrecision?: number | 'unbounded' | undefined;
	}
) {
	if (value === null) return '';

	switch (metadataType) {
		case 'boolean':
			switch (language) {
				case 'fr':
					return value ? 'Oui' : 'Non';
				default:
					return value ? 'Yes' : 'No';
			}

		case 'date':
			return value instanceof Date ? dates.format(value, 'Ppp') : value.toString();

		case 'enum':
			return valueLabel || value.toString();

		case 'location': {
			const { latitude, longitude } = type({
				latitude: 'number',
				longitude: 'number'
			}).assert(value);

			return `${latitude}, ${longitude}`;
		}

		case 'boundingbox': {
			const { x, y, w, h } = type({
				x: 'number',
				y: 'number',
				h: 'number',
				w: 'number'
			}).assert(value);

			const coord = (v: number) =>
				boundingBoxPrecision === 'unbounded'
					? v.toString()
					: round(v, boundingBoxPrecision);

			const point = (x: number, y: number) => `(${coord(x)}, ${coord(y)})`;

			const start = point(x, y);
			const end = point(x + w, y + h);

			switch (language) {
				case 'fr':
					return `Boîte de ${start} à ${end}`;
				default:
					return `Box from ${start} to ${end}`;
			}
		}

		case 'float':
		case 'integer':
			return Intl.NumberFormat(language).format(type('number').assert(value));

		default:
			return value.toString();
	}
}

if (import.meta.vitest) {
	const { expect, test, describe, beforeEach } = import.meta.vitest;

	describe('metadataPrettyValue', () => {
		describe('in french', () => {
			beforeEach(async () => {
				const { fr } = await import('date-fns/locale');
				dates.setDefaultOptions({ locale: fr });
			});

			test('booleans', () => {
				expect(metadataPrettyValue(true, { type: 'boolean', language: 'fr' })).toBe('Oui');
				expect(metadataPrettyValue(false, { type: 'boolean', language: 'fr' })).toBe('Non');
			});

			test('dates', () => {
				expect(
					metadataPrettyValue(new Date('2023-02-01T15:04:05Z'), {
						type: 'date',
						language: 'fr'
					})
				).toBe('01/02/2023, 15:04:05');
			});

			test('floats', () => {
				expect(metadataPrettyValue(12012.34, { type: 'float', language: 'fr' })).toBe(
					'12 012,34'
				);
			});

			describe('bounding boxes', () => {
				const box = { x: 1, y: 2.005, w: 3, h: 4 };

				test('with default precision', () => {
					expect(metadataPrettyValue(box, { type: 'boundingbox', language: 'fr' })).toBe(
						'Boîte de (1, 2.01) à (4, 6.01)'
					);
				});

				test('with unbounded precision', () => {
					expect(
						metadataPrettyValue(box, {
							type: 'boundingbox',
							language: 'fr',
							boundingBoxPrecision: 'unbounded'
						})
					).toBe('Boîte de (1, 2.005) à (4, 6.005)');
				});
			});

			test('integers', () => {
				expect(metadataPrettyValue(12012, { type: 'integer', language: 'fr' })).toBe(
					'12\u202F012'
				);
			});
		});

		describe('in english', () => {
			beforeEach(async () => {
				const { enUS } = await import('date-fns/locale');
				dates.setDefaultOptions({ locale: enUS });
			});

			test('booleans', () => {
				expect(metadataPrettyValue(true, { type: 'boolean', language: 'en' })).toBe('Yes');
				expect(metadataPrettyValue(false, { type: 'boolean', language: 'en' })).toBe('No');
			});

			test('dates', () => {
				expect(
					metadataPrettyValue(new Date('2023-02-01T15:04:05Z'), {
						type: 'date',
						language: 'en'
					})
				).toBe('02/01/2023, 3:04:05 PM');
			});

			describe('bounding boxes', () => {
				const box = { x: 1, y: 2.005, w: 3, h: 4 };

				test('with default precision', () => {
					expect(metadataPrettyValue(box, { type: 'boundingbox', language: 'en' })).toBe(
						'Box from (1, 2.01) to (4, 6.01)'
					);
				});

				test('with unbounded precision', () => {
					expect(
						metadataPrettyValue(box, {
							type: 'boundingbox',
							language: 'en',
							boundingBoxPrecision: 'unbounded'
						})
					).toBe('Box from (1, 2.005) to (4, 6.005)');
				});
			});

			test('floats', () => {
				expect(metadataPrettyValue(12012.34, { type: 'float', language: 'en' })).toBe(
					'12,012.34'
				);
			});

			test('integers', () => {
				expect(metadataPrettyValue(12012, { type: 'integer', language: 'en' })).toBe(
					'12,012'
				);
			});
		});

		test('locations', () => {
			expect(
				metadataPrettyValue(
					{ latitude: 12.34, longitude: 56.78 },
					{ type: 'location', language: 'fr' }
				)
			).toBe('12.34, 56.78');
			expect(
				metadataPrettyValue(
					{ latitude: 12.34, longitude: 56.78 },
					{ type: 'location', language: 'en' }
				)
			).toBe('12.34, 56.78');
		});

		test('enums', () => {
			expect(
				metadataPrettyValue('value1', {
					language: 'en',
					type: 'enum',
					valueLabel: 'Label 1'
				})
			).toBe('Label 1');
			expect(
				metadataPrettyValue('value1', {
					language: 'fr',
					type: 'enum',
					valueLabel: 'Label 1'
				})
			).toBe('Label 1');
			expect(metadataPrettyValue('value2', { language: 'en', type: 'enum' })).toBe('value2');
			expect(metadataPrettyValue('value2', { language: 'fr', type: 'enum' })).toBe('value2');
		});
	});
}

/**
 * Returns a human-friendly string for a metadata key. Uses the label, and adds useful info about the data format if applicable.
 * To be used with `metadataPrettyValue`.
 * @param {DB.Metadata} metadata
 * @returns
 */
export function metadataPrettyKey(metadata: DB.Metadata) {
	let out = metadata.label;
	switch (metadata.type) {
		case 'location':
			out += ' (latitude, longitude)';
	}
	return out;
}
