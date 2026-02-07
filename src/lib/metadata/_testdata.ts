import type * as DB from '$lib/database.js';
import { METADATA_TYPES } from '$lib/schemas/metadata';
import { mapEntries } from '$lib/utils';

export const metadatas = {
	integer: { id: 'metadata_integer', type: 'integer', mergeMethod: 'average', options: [] },
	float: { id: 'metadata_float', type: 'float', mergeMethod: 'average', options: [] },
	date: { id: 'metadata_date', type: 'date', mergeMethod: 'average', options: [] },
	string: { id: 'metadata_string', type: 'string', mergeMethod: 'none', options: [] },
	boolean: { id: 'metadata_boolean ', type: 'boolean', mergeMethod: 'average', options: [] },
	location: { id: 'metadata_location ', type: 'location', mergeMethod: 'average', options: [] },
	boundingbox: { id: 'metadata_boundingbox ', type: 'boundingbox', mergeMethod: 'union', options: [] },
	enum: {
		id: 'metadata_enum ',
		type: 'enum',
		mergeMethod: 'max',
		options: [
			{ key: 'A', label: 'Option A', index: 1, synonyms: ['Option α'] },
			{ key: 'B', label: 'Option B', index: 0, synonyms: ['Option β'] },
			{ key: 'C', label: 'Option C', index: 2, synonyms: ['Option γ'] }
		]
	}
} as const satisfies {
	[K in DB.MetadataType]: Pick<DB.Metadata, 'id' | 'type'| 'mergeMethod'> & {
		options: DB.MetadataEnumVariant[];
	};
};

export const items: Array<{ id: string; metadata: DB.MetadataValues }> = [
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
			metadata_boundingbox: { x: 11, y: 11.5, w: 50, h: 50 }
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
			metadata_boundingbox: { x: 11, y: 11.5, w: 50, h: 50 }
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
				confirmed: false,
				confidence: 1,
				alternatives: {}
			} satisfies DB.MetadataValue
		])
	)
}));

export const values = mapEntries(METADATA_TYPES, (typ) => [
	typ,
	items
		.filter((item) => item.metadata[`metadata_${typ}`] !== undefined)
		.map((item) => [item.id, item.metadata[`metadata_${typ}`]!.value] as const)
]);
