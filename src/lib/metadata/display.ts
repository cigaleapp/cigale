import { type } from 'arktype';
import * as dates from 'date-fns';

import * as DB from '$lib/database';

/**
 * Adds valueLabel to each metadata value object when the metadata is an enum.
 * @param values
 * @param metadataOptions
 * @returns
 */
export async function addValueLabels(
	values: DB.MetadataValues,
	metadataOptions: Record<string, Record<string, DB.MetadataEnumVariant>>
): Promise<Record<string, DB.MetadataValue & { valueLabel?: string }>> {
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
 */
export function metadataPrettyValue(
	language: import('$lib/i18n.js').Language,
	metadata: Pick<DB.Metadata, 'type'>,
	value: DB.MetadataValue['value'] | null,
	valueLabel: string | undefined = undefined
) {
	if (value === null) return '';

	switch (metadata.type) {
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
			const {
				x: x1,
				y: y1,
				w,
				h
			} = type({ x: 'number', y: 'number', h: 'number', w: 'number' }).assert(value);

			const point = (x: number, y: number) => `(${x.toFixed(2)}, ${y.toFixed(2)})`;

			switch (language) {
				case 'fr':
					return `Boîte de ${point(x1, y1)} à ${point(x1 + w, y1 + h)}`;
				default:
					return `Box from ${point(x1, y1)} to ${point(x1 + w, y1 + h)}`;
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
				expect(metadataPrettyValue('fr', { type: 'boolean' }, true)).toBe('Oui');
				expect(metadataPrettyValue('fr', { type: 'boolean' }, false)).toBe('Non');
			});

			test('dates', () => {
				expect(
					metadataPrettyValue('fr', { type: 'date' }, new Date('2023-02-01T15:04:05Z'))
				).toBe('01/02/2023, 15:04:05');
			});

			test('floats', () => {
				expect(metadataPrettyValue('fr', { type: 'float' }, 12012.34)).toBe('12 012,34');
			});

			test('bounding boxes', () => {
				expect(
					metadataPrettyValue('fr', { type: 'boundingbox' }, { x: 1, y: 2, w: 3, h: 4 })
				).toBe('Boîte de (1, 2) à (4, 6)');
			});

			test('integers', () => {
				expect(metadataPrettyValue('fr', { type: 'integer' }, 12012)).toBe('12\u202F012');
			});
		});

		describe('in english', () => {
			beforeEach(async () => {
				const { enUS } = await import('date-fns/locale');
				dates.setDefaultOptions({ locale: enUS });
			});

			test('booleans', () => {
				expect(metadataPrettyValue('en', { type: 'boolean' }, true)).toBe('Yes');
				expect(metadataPrettyValue('en', { type: 'boolean' }, false)).toBe('No');
			});

			test('dates', () => {
				expect(
					metadataPrettyValue('en', { type: 'date' }, new Date('2023-02-01T15:04:05Z'))
				).toBe('02/01/2023, 3:04:05 PM');
			});

			test('bounding boxes', () => {
				expect(
					metadataPrettyValue('en', { type: 'boundingbox' }, { x: 1, y: 2, w: 3, h: 4 })
				).toBe('Box from (1, 2) to (4, 6)');
			});

			test('floats', () => {
				expect(metadataPrettyValue('en', { type: 'float' }, 12012.34)).toBe('12,012.34');
			});

			test('integers', () => {
				expect(metadataPrettyValue('en', { type: 'integer' }, 12012)).toBe('12,012');
			});
		});

		test('locations', () => {
			expect(
				metadataPrettyValue(
					'fr',
					{ type: 'location' },
					{ latitude: 12.34, longitude: 56.78 }
				)
			).toBe('12.34, 56.78');
			expect(
				metadataPrettyValue(
					'en',
					{ type: 'location' },
					{ latitude: 12.34, longitude: 56.78 }
				)
			).toBe('12.34, 56.78');
		});

		test('enums', () => {
			expect(metadataPrettyValue('en', { type: 'enum' }, 'value1', 'Label 1')).toBe(
				'Label 1'
			);
			expect(metadataPrettyValue('fr', { type: 'enum' }, 'value1', 'Label 1')).toBe(
				'Label 1'
			);
			expect(metadataPrettyValue('en', { type: 'enum' }, 'value2')).toBe('value2');
			expect(metadataPrettyValue('fr', { type: 'enum' }, 'value2')).toBe('value2');
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
