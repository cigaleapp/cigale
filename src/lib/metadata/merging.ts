import type * as DB from '$lib/database';
import { Schemas } from '$lib/database';
import type { DatabaseHandle } from '$lib/idb.svelte.js';
import type { RuntimeValue } from '$lib/schemas/metadata.js';
import { avg, mapValues, nonnull } from '$lib/utils.js';

import { metadataOptionsKeyRange } from './storage.js';
import { switchOnMetadataType } from './types.js';

export const MERGEABLE_METADATA_TYPES: Set<DB.MetadataType> = new Set([
	'boolean',
	'integer',
	'float',
	'date',
	'location',
	'boundingbox',
	'enum'
]);

/**
 * Merge metadata values from images and observations. For every metadata key, the value is taken from the merged values of observation overrides if there exists at least one, otherwise from the merged values of the images.
 */
export async function mergeMetadataFromImagesAndObservations(
	db: DatabaseHandle,
	protocol: DB.Protocol,
	images: DB.Image[],
	observations: DB.Observation[]
) {
	const mergedValues = await mergeMetadataValues(
		db,
		protocol,
		images.map((img) => img.metadata)
	);
	const mergedOverrides = await mergeMetadataValues(
		db,
		protocol,
		observations.map((obs) => obs.metadataOverrides)
	);

	const keys = new Set([...Object.keys(mergedValues), ...Object.keys(mergedOverrides)]);

	const output: Record<string, DB.MetadataValue & { merged: boolean }> = {};

	for (const key of keys) {
		const value = mergedOverrides[key] ?? mergedValues[key];
		if (value) output[key] = value;
	}

	return output;
}

/**
 * @param db
 * @param protocol
 * @param values
 * @returns {Promise<Record<string, DB.MetadataValue & { merged: boolean }>>}
 */
export async function mergeMetadataValues(
	db: DatabaseHandle,
	protocol: DB.Protocol,
	values: Array<DB.MetadataValues>
): Promise<Record<string, DB.MetadataValue & { merged: boolean }>> {
	if (values.length === 1) {
		return mapValues(values[0], (v) => ({ ...v, merged: false }));
	}

	const output: Record<string, DB.MetadataValue & { merged: boolean }> = {};

	const keys = new Set(values.flatMap((singleSubjectValues) => Object.keys(singleSubjectValues)));

	for (const key of keys) {
		const definition = Schemas.Metadata.assert(await db.get('Metadata', key));
		if (!definition) {
			console.warn(`Cannot merge metadata values for unknown key ${key}`);
			continue;
		}

		const valuesOfKey = values.flatMap((singleSubjectValues) =>
			Object.entries(singleSubjectValues)
				.filter(([k]) => k === key)
				.map(([, v]) => v)
		);

		let options: DB.MetadataEnumVariant[] = [];

		if (definition.type === 'enum' && definition.mergeMethod === 'average') {
			const optionsCount = await db.count(
				'MetadataOption',
				metadataOptionsKeyRange(protocol.id, definition.id)
			);

			if (optionsCount > 500) {
				throw new Error(
					`Impossible de fusionner les valeurs de la métadonnée ${key} en mode moyenne car elle possède plus de 500 options (${optionsCount} options). Le protocol doit choisir un autre mode de fusion.`
				);
			}

			options = await db
				.getAll('MetadataOption', metadataOptionsKeyRange(protocol.id, definition.id))
				.then((opts) => opts.map((opt) => Schemas.MetadataEnumVariant.assert(opt)));
		}

		const merged = mergeMetadata(definition, valuesOfKey, options);

		if (merged !== null && merged !== undefined)
			output[key] = {
				...merged,
				merged: new Set(valuesOfKey.map((v) => JSON.stringify(v.value))).size > 1
			};
	}

	return output;
}

function mergeMetadata(
	definition: DB.Metadata,
	values: DB.MetadataValue[],
	options: DB.MetadataEnumVariant[] = []
) {
	const mergeAlternatives = (
		merger: (probabilities: number[]) => number,
		values: DB.MetadataValue[]
	) =>
		Object.fromEntries(
			values
				.flatMap((v) => Object.keys(v.alternatives))
				.map((valueAsString) => [
					valueAsString,
					merger(
						values.flatMap((v) => v.alternatives[valueAsString] ?? null).filter(Boolean)
					)
				])
		);

	const mergeFullValue = ({
		value,
		confidences
	}: {
		value: RuntimeValue;
		confidences: (probabilities: number[]) => number;
	}): DB.MetadataValue => ({
		value,
		manuallyModified: values.some((v) => v.manuallyModified),
		confidence: confidences(values.map((v) => v.confidence)),
		alternatives: mergeAlternatives(confidences, values)
	});

	switch (definition.mergeMethod) {
		case 'average':
			return mergeFullValue({
				confidences: avg,
				value: mergeByAggregate({
					aggregate: avg,
					type: definition.type,
					values: values.map((v) => v.value),
					options
				})
			});
		case 'max':
		case 'min':
			return mergeFullValue({
				confidences: max,
				value: mergeByMajority(
					definition.type,
					values,
					definition.mergeMethod === 'max' ? max : min
				)
			});
		case 'median':
			return mergeFullValue({
				confidences: median,
				value: mergeByAggregate({
					aggregate: median,
					type: definition.type,
					values: values.map((v) => v.value),
					options
				})
			});
		case 'union':
			return mergeFullValue({
				confidences: avg,
				value: mergeByUnion(
					definition.type,
					values.map((v) => v.value)
				)
			});
		case 'none':
			return null;
	}
}

/**
 * Merge values by best confidence. If multiple values have the same confidence, use `strategy` to break the tie. If `strategy` throws, use first value as a fallback.
 */
function mergeByMajority<Type extends DB.MetadataType, Value extends RuntimeValue<Type>>(
	_type: Type,
	values: Array<{ value: Value; confidence: number }>,
	strategy: (values: Value[]) => Value
): Value {
	const bestConfidence = Math.max(...values.map((v) => v.confidence));
	const bestValues = values.filter((v) => v.confidence === bestConfidence);
	try {
		return strategy(bestValues.map((v) => v.value));
	} catch (error) {
		console.error(error);
		return bestValues[0].value;
	}
}

/**
 * Merge values by a numerical aggregation function, such as average or median.
 */
function mergeByAggregate<Type extends DB.MetadataType, Value extends RuntimeValue<Type>>({
	type,
	values,
	options,
	aggregate
}: {
	type: Type;
	values: Value[];
	options: DB.MetadataEnumVariant[];
	aggregate: (vals: number[]) => number;
}) {
	return switchOnMetadataType<any, { [K in DB.MetadataType]: RuntimeValue<K> }>(
		type,
		values,
		{
			boolean: (...vals) => aggregate(toNumber('boolean', vals)) > 0.5,
			integer: (...vals) => Math.ceil(aggregate(vals)),
			float: (...vals) => aggregate(vals),
			date: (...vals) => new Date(aggregate(toNumber('date', vals))),
			location: (...vals) => ({
				latitude: aggregate(vals.map((v) => v.latitude)),
				longitude: aggregate(vals.map((v) => v.longitude))
			}),
			enum: (...vals) => {
				// Get average index of values, and return closest option

				const targetIndex = Math.round(
					aggregate(
						vals.map((v) => options.find((opt) => opt.key === v)?.index).filter(nonnull)
					)
				);

				return options.find((opt) => opt.index === targetIndex)?.key ?? vals[0];
			}
		},
		() => {
			throw new Error(`Impossible de fusionner des valeurs de type ${type}`);
		}
	);
}

/**
 * Merge values by union.
 */
function mergeByUnion(type: DB.MetadataType, values: Array<RuntimeValue>) {
	return switchOnMetadataType<RuntimeValue<'boundingbox'>>(
		type,
		values,
		{
			boundingbox: (...vals) => {
				const xStart = Math.min(...vals.map((v) => v.x));
				const yStart = Math.min(...vals.map((v) => v.y));
				const xEnd = Math.max(...vals.map((v) => v.x + v.w));
				const yEnd = Math.max(...vals.map((v) => v.y + v.h));

				return {
					x: xStart,
					y: yStart,
					w: xEnd - xStart,
					h: yEnd - yStart
				};
			}
		},
		() => {
			throw new Error(`Impossible de fusionner des valeurs de type ${type} par union`);
		}
	);
}

/**
 * Convert series of values to an output number
 */
function toNumber(
	type: DB.MetadataType & ('integer' | 'float' | 'boolean' | 'date'),
	values: Array<RuntimeValue<typeof type>>
) {
	return values.map((value) =>
		switchOnMetadataType<number>(
			type,
			value,
			{
				integer: (v) => v,
				float: (v) => v,
				boolean: (v) => (v ? 1 : 0),
				date: (v) => new Date(v).getTime()
			},
			() => {
				throw new Error(`Impossible de convertir des valeurs de type ${type} en nombre`);
			}
		)
	);
}

function median(values: number[]) {
	const sorted = values.sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) {
		return (sorted[middle - 1] + sorted[middle]) / 2;
	}
	return sorted[middle];
}

function max(values: number[]) {
	return Math.max(...values);
}

function min(values: number[]) {
	return Math.min(...values);
}
