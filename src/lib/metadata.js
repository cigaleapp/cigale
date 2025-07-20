import { type } from 'arktype';
import * as datefns from 'date-fns';
import { Schemas } from './database.js';
import * as idb from './idb.svelte.js';
import { _tablesState, idComparator, tables } from './idb.svelte.js';
import {
	ensureNamespacedMetadataId,
	metadataOptionId,
	namespaceOfMetadataId
} from './schemas/metadata.js';
import { avg, mapValues } from './utils.js';

/**
 * @import { IDBTransactionWithAtLeast } from './idb.svelte.js'
 * @import * as DB from './database.js'
 */

/**
 * @template {DB.MetadataType} [Type=DB.MetadataType]
 * @typedef  RuntimeValue
 * @type {Type extends 'boolean' ? boolean : Type extends 'integer' ? number : Type extends 'float' ? number : Type extends 'enum' ? string : Type extends 'date' ? Date : Type extends 'location' ? { latitude: number, longitude: number } : Type extends 'boundingbox' ? { x: number, y: number, w: number, h: number } : string}
 */

/**
 * @template {DB.MetadataType} [Type=DB.MetadataType]
 * @typedef TypedMetadataValue
 * @type {Omit<DB.MetadataValue, 'value'> & { value: RuntimeValue<Type> }}
 */

/**
 * Get a strongly-typed metadata value from an image (Image ONLY, not Observation).
 * @template {DB.MetadataType} Type
 * @param {DB.Image} image
 * @param {Type} type
 * @param {string} metadataId
 * @returns {TypedMetadataValue<Type> | undefined}
 */
export function getMetadataValue(image, type, metadataId) {
	const value = image.metadata[metadataId];
	if (value === undefined) return undefined;

	return {
		...value,
		value: assertIs(type, value.value)
	};
}

/**
 * Serialize a metadata value for storing in the database.
 * @param {*} value
 * @returns {string}
 */
export function serializeMetadataValue(value) {
	return JSON.stringify(
		datefns.isValid(value) ? datefns.format(value, "yyyy-MM-dd'T'HH:mm:ss") : value
	);
}

/**
 *
 * @template {DB.MetadataType} Type
 * @param {object} options
 * @param {string} options.subjectId id de l'image ou l'observation
 * @param {string} options.metadataId id de la métadonnée
 * @param {Type} [options.type] le type de données pour la métadonnée, sert à éviter des problèmes de typages
 * @param {RuntimeValue<Type>} options.value la valeur de la métadonnée
 * @param {boolean} [options.manuallyModified=false] si la valeur a été modifiée manuellement
 * @param {number} [options.confidence=1] la confiance dans la valeur (proba que ce soit la bonne valeur)
 * @param {IDBTransactionWithAtLeast<["Image", "Observation"]>} [options.tx] transaction IDB pour effectuer plusieurs opérations d'un coup
 * @param {Array<{ value: RuntimeValue<Type>; confidence: number }>} [options.alternatives=[]] les autres valeurs possibles
 * @param {string[]} [options.cascadedFrom] ID des métadonnées dont celle-ci est dérivée, pour éviter les boucles infinies (cf "cascade" dans MetadataEnumVariant)
 */
export async function storeMetadataValue({
	subjectId,
	metadataId,
	type,
	value,
	confidence = 1,
	alternatives = [],
	manuallyModified = false,
	tx = undefined,
	cascadedFrom = []
}) {
	if (!namespaceOfMetadataId(metadataId)) {
		throw new Error(`Le metadataId ${metadataId} n'est pas namespacé`);
	}

	const newValue = {
		value: serializeMetadataValue(value),
		confidence,
		manuallyModified,
		alternatives: Object.fromEntries(
			alternatives.map((alternative) => [JSON.stringify(alternative.value), alternative.confidence])
		)
	};

	// Make sure the alternatives does not contain the value itself
	newValue.alternatives = Object.fromEntries(
		Object.entries(newValue.alternatives).filter(([key]) => key !== newValue.value)
	);

	console.log(
		`Store metadata ${metadataId} in ${subjectId}${tx ? ` using tx ${tx.id}` : ''}`,
		newValue
	);

	const metadata = tables.Metadata.state.find((m) => m.id === metadataId);
	if (!metadata) throw new Error(`Métadonnée inconnue avec l'ID ${metadataId}`);
	if (type && metadata.type !== type)
		throw new Error(`Type de métadonnée incorrect: ${metadata.type} !== ${type}`);

	const image = tx
		? await tx.objectStore('Image').get(subjectId)
		: await tables.Image.raw.get(subjectId);
	const observation = tx
		? await tx.objectStore('Observation').get(subjectId)
		: await tables.Observation.raw.get(subjectId);

	if (image) {
		// console.log(`Store metadata ${metadataId} in ${subjectId}: found`, image);
		image.metadata[metadataId] = newValue;

		if (tx) tx.objectStore('Image').put(image);
		else await tables.Image.raw.set(image);

		_tablesState.Image[
			_tablesState.Image.findIndex((img) => img.id.toString() === subjectId)
		].metadata[metadataId] = Schemas.MetadataValue.assert(newValue);
	} else if (observation) {
		// console.log(`Store metadata ${metadataId} in ${subjectId}: found`, observation);
		observation.metadataOverrides[metadataId] = newValue;

		if (tx) tx.objectStore('Observation').put(observation);
		else await tables.Observation.raw.set(observation);

		_tablesState.Observation[
			_tablesState.Observation.findIndex((img) => img.id.toString() === subjectId)
		].metadataOverrides[metadataId] = newValue;
	} else {
		throw new Error(`Aucune image ou observation avec l'ID ${subjectId}`);
	}

	// Execute cascades if any
	const cascades = await idb
		.get('MetadataOption', metadataOptionId(metadataId, value.toString()))
		.then((o) => o?.cascade ?? {});

	for (const [cascadedMetadataId, cascadedValue] of Object.entries(cascades)) {
		if (cascadedFrom.includes(cascadedMetadataId)) {
			throw new Error(
				`Boucle infinie de cascade détectée pour ${cascadedMetadataId} avec ${cascadedValue}: ${cascadedFrom.join(' -> ')} -> ${metadataId} -> ${cascadedMetadataId}`
			);
		}

		console.info(
			`Cascading metadata ${metadataId} @ ${value} -> ${cascadedMetadataId}  = ${cascadedValue}`
		);
		await storeMetadataValue({
			subjectId,
			metadataId: ensureNamespacedMetadataId(cascadedMetadataId, namespaceOfMetadataId(metadataId)),
			value: cascadedValue,
			confidence: 1, // TODO maybe improve that?
			manuallyModified,
			tx,
			cascadedFrom: [...cascadedFrom, metadataId]
		});
	}
}

/**
 *
 * @param {object} options
 * @param {string} options.subjectId id de l'image ou l'observation
 * @param {string} options.metadataId id de la métadonnée
 * @param {boolean} [options.recursive=false] si true, supprime la métadonnée de toutes les images composant l'observation
 * @param {IDBTransactionWithAtLeast<["Image", "Observation"]>} [options.tx] transaction IDB pour effectuer plusieurs opérations d'un coup
 */
export async function deleteMetadataValue({ subjectId, metadataId, recursive = false, tx }) {
	const image = tx
		? await tx.objectStore('Image').get(subjectId)
		: await tables.Image.raw.get(subjectId);
	const observation = tx
		? await tx.objectStore('Observation').get(subjectId)
		: await tables.Observation.raw.get(subjectId);

	if (!image && !observation) throw new Error(`Aucune image ou observation avec l'ID ${subjectId}`);

	console.log(`Delete metadata ${metadataId} in ${subjectId}`);
	if (image) {
		delete image.metadata[metadataId];
		if (tx) tx.objectStore('Image').put(image);
		else await tables.Image.raw.set(image);
		delete _tablesState.Image[
			_tablesState.Image.findIndex((img) => img.id.toString() === subjectId)
		].metadata[metadataId];
	} else if (observation) {
		delete observation.metadataOverrides[metadataId];
		if (tx) tx.objectStore('Observation').put(observation);
		else await tables.Observation.raw.set(observation);
		delete _tablesState.Observation[
			_tablesState.Observation.findIndex((img) => img.id.toString() === subjectId)
		].metadataOverrides[metadataId];
		if (recursive) {
			for (const imageId of observation.images) {
				await deleteMetadataValue({ subjectId: imageId, recursive: false, metadataId, tx });
			}
		}
	}

	return;
}

/**
 * Gets all metadata for an observation, including metadata derived from merging the metadata values of the images that make up the observation.
 * @param {Pick<DB.Observation, 'images' | 'metadataOverrides'>} observation
 * @returns {Promise<DB.MetadataValues>}
 */
export async function observationMetadata(observation) {
	const images = await tables.Image.list().then((images) =>
		images.filter((img) => observation.images.includes(img.id))
	);

	const metadataFromImages = await mergeMetadataValues(images.map((img) => img.metadata));

	return {
		...metadataFromImages,
		...observation.metadataOverrides
	};
}

/**
 * Adds valueLabel to each metadata value object when the metadata is an enum.
 * @param {DB.MetadataValues} values
 * @returns {Promise<Record<string, DB.MetadataValue & { valueLabel?: string }>>}
 */
export async function addValueLabels(values) {
	const metadataOptions = await idb.list('MetadataOption');
	return Object.fromEntries(
		Object.entries(values).map(([key, value]) => {
			const definition = tables.Metadata.state.find((m) => m.id === key);
			if (!definition) return [key, value];
			if (definition.type !== 'enum') return [key, value];

			return [
				key,
				{
					...value,
					valueLabel: metadataOptions?.find((o) => o.key === value.value.toString())?.label
				}
			];
		})
	);
}

/**
 * Merge metadata values from images and observations. For every metadata key, the value is taken from the merged values of observation overrides if there exists at least one, otherwise from the merged values of the images.
 * @param {DB.Image[]} images
 * @param {DB.Observation[]} observations
 */
export async function mergeMetadataFromImagesAndObservations(images, observations) {
	console.log('merging metadata from', { images, observations });
	const mergedValues = await mergeMetadataValues(images.map((img) => img.metadata));
	const mergedOverrides = await mergeMetadataValues(
		observations.map((obs) => obs.metadataOverrides)
	);

	const keys = new Set([...Object.keys(mergedValues), ...Object.keys(mergedOverrides)]);

	/** @type {Record<string, DB.MetadataValue & { merged: boolean }>}  */
	const output = {};

	for (const key of keys) {
		const value = mergedOverrides[key] ?? mergedValues[key];
		if (value) output[key] = value;
	}

	console.log('merged to', output);

	return output;
}

/**
 *
 * @param {Array<DB.MetadataValues>} values
 * @returns {Promise<Record<string, DB.MetadataValue & { merged: boolean }>>}
 */
export async function mergeMetadataValues(values) {
	console.log('merging metadata values from', values);
	if (values.length === 1) {
		return mapValues(values[0], (v) => ({ ...v, merged: false }));
	}

	/** @type {Record<string, DB.MetadataValue & { merged: boolean }>}  */
	const output = {};

	const keys = new Set(values.flatMap((singleSubjectValues) => Object.keys(singleSubjectValues)));

	for (const key of keys) {
		const definition = await tables.Metadata.get(key);
		if (!definition) {
			console.warn(`Cannot merge metadata values for unknown key ${key}`);
			continue;
		}

		const valuesOfKey = values.flatMap((singleSubjectValues) =>
			Object.entries(singleSubjectValues)
				.filter(([k]) => k === key)
				.map(([, v]) => v)
		);

		const merged = mergeMetadata(definition, valuesOfKey);

		if (merged !== null && merged !== undefined)
			output[key] = {
				...merged,
				merged: new Set(valuesOfKey.map((v) => JSON.stringify(v.value))).size > 1
			};
	}

	console.log('merged metadata values to', output);

	return output;
}

/**
 *
 * @param {DB.Metadata} definition
 * @param {DB.MetadataValue[]} values
 */
function mergeMetadata(definition, values) {
	/**
	 * @param {(probabilities: number[]) => number} merger
	 * @param {DB.MetadataValue[]} values
	 * Run merger on array of confidences for every probability of each alternative of each values:
	 * example: [ { alternatives: { a: 0.8, b: 0.2 } }, { alternatives: { a: 0.6, b: 0.4 } } ]
	 * turns into: { a: merger([0.8, 0.6]), b: merger([0.2, 0.4]) }
	 */
	console.log('Merging metadata', definition, values);

	/**
	 * @param {(probabilities: number[]) => number} merger
	 * @param {DB.MetadataValue[]} values
	 */
	const mergeAlternatives = (merger, values) =>
		Object.fromEntries(
			values
				.flatMap((v) => Object.keys(v.alternatives))
				.map((valueAsString) => [
					valueAsString,
					merger(values.flatMap((v) => v.alternatives[valueAsString] ?? null).filter(Boolean))
				])
		);

	switch (definition.mergeMethod) {
		case 'average':
			return {
				value: mergeAverage(
					definition.type,
					// @ŧs-ignore
					values.map((v) => v.value)
				),
				manuallyModified: values.some((v) => v.manuallyModified),
				confidence: avg(values.map((v) => v.confidence)),
				alternatives: mergeAlternatives(avg, values)
			};
		case 'max':
		case 'min':
			return {
				value: mergeByMajority(
					definition.type,
					// @ts-ignore
					values,
					definition.mergeMethod === 'max' ? max : min
				),
				manuallyModified: values.some((v) => v.manuallyModified),
				confidence: max(values.map((v) => v.confidence)),
				alternatives: mergeAlternatives(max, values)
			};
		case 'median':
			return {
				value: mergeMedian(
					definition.type,
					values.map((v) => v.value)
				),
				manuallyModified: values.some((v) => v.manuallyModified),
				confidence: median(values.map((v) => v.confidence)),
				alternatives: mergeAlternatives(median, values)
			};
		case 'union':
			return {
				value: mergeByUnion(
					definition.type,
					values.map((v) => v.value)
				),
				manuallyModified: values.some((v) => v.manuallyModified),
				confidence: avg(values.map((v) => v.confidence)),
				alternatives: mergeAlternatives(avg, values)
			};
		case 'none':
			return null;
	}
}

/**
 *
 * @param {number[]} values
 */
const max = (values) => Math.max(...values);

/**
 * @param {number[]} values
 */
const min = (values) => Math.min(...values);

/**
 * Merge values by best confidence. If multiple values have the same confidence, use `strategy` to break the tie. If `strategy` throws, use first value as a fallback.
 * @param {Type} _type
 * @param {Array<{ value: Value, confidence: number }>} values
 * @param {(values: Value[]) => Value} strategy
 * @returns {Value}
 * @template {RuntimeValue<Type>} Value
 * @template {DB.MetadataType} Type
 */
function mergeByMajority(_type, values, strategy) {
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
 * Merge values by average.
 * @param {Type} type
 * @param {Value[]} values
 * @returns {Value}
 * @template {RuntimeValue<Type>} Value
 * @template {DB.MetadataType} Type
 */
function mergeAverage(type, values) {
	/**
	 * @param {typeof values} values
	 */
	const average = (values) => avg(toNumber(type, values));

	// @ts-ignore
	if (type === 'boolean') return average(values) > 0.5;
	// @ts-ignore
	if (type === 'integer') return Math.ceil(average(values));
	// @ts-ignore
	if (type === 'float') return average(values);
	// @ts-ignore
	if (type === 'date') return new Date(average(values));
	if (type === 'location') {
		// @ts-ignore
		return {
			latitude: avg(
				values.map(
					(v) =>
						// @ts-ignore
						v.latitude
				)
			),
			longitude: avg(
				values.map(
					(
						v //@ts-ignore
					) => v.longitude
				)
			)
		};
	}

	throw new Error(`Impossible de fusionner en mode moyenne des valeurs de type ${type}`);
}

/** @param {number[]} values */
const median = (values) => {
	const sorted = values.sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) {
		return (sorted[middle - 1] + sorted[middle]) / 2;
	}
	return sorted[middle];
};

/**
 * Merge values by median.
 * @param {Type} type
 * @param {Value[]} values
 * @returns {Value}
 * @template {RuntimeValue<Type>} Value
 * @template {DB.MetadataType} Type
 */
function mergeMedian(type, values) {
	/** @param {typeof values} values */
	const median_ = (values) => median(toNumber(type, values));

	// @ts-ignore
	if (type === 'boolean') return median_(values) > 0.5;
	// @ts-ignore
	if (type === 'integer') return Math.ceil(median_(values));
	// @ts-ignore
	if (type === 'float') return median_(values);
	// @ts-ignore
	if (type === 'date') return new Date(median_(values));
	if (type === 'location') {
		// @ts-ignore
		return {
			latitude: median(
				values.map(
					(v) =>
						// @ts-ignore
						v.latitude
				)
			),
			longitude: median(
				values.map(
					(v) =>
						// @ts-ignore
						v.longitude
				)
			)
		};
	}

	throw new Error(`Impossible de fusionner en mode médiane des valeurs de type ${type}`);
}

/**
 * Merge values by union.
 * @param {import('./database.js').MetadataType} type
 * @param {Array<RuntimeValue>} values
 * @returns {RuntimeValue<"boundingbox">}
 */
function mergeByUnion(type, values) {
	if (!areType('boundingbox', type, values)) {
		throw new Error(`Impossible de fusionner en mode union des valeurs de type ${type}`);
	}

	const xStart = Math.min(...values.map((v) => v.x));
	const yStart = Math.min(...values.map((v) => v.y));
	const xEnd = Math.max(...values.map((v) => v.x + v.w));
	const yEnd = Math.max(...values.map((v) => v.y + v.h));

	return {
		x: xStart,
		y: yStart,
		w: xEnd - xStart,
		h: yEnd - yStart
	};
}

/**
 * Convert series of values to an output number
 * @param {Type} type
 * @param {Value[]} values
 * @template {RuntimeValue<Type>} Value
 * @template {DB.MetadataType} Type
 * @returns {number[]}
 */
function toNumber(type, values) {
	// @ts-ignore
	if (type === 'integer') return values;
	// @ts-ignore
	if (type === 'float') return values;
	if (type === 'boolean') return values.map((v) => (v ? 1 : 0));
	if (type === 'date') return values.map((v) => new Date(/** @type {Date|string} */ (v)).getTime());
	throw new Error(`Impossible de convertir des valeurs de type ${type} en nombre`);
}

/**
 * Returns a human-friendly string for a metadata value.
 * Used for e.g. CSV exports.
 * @param {DB.Metadata} metadata the metadata definition
 * @param {DB.MetadataValue['value']} value the value of the metadata
 * @param {string} [valueLabel] the label of the value, if applicable (e.g. for enums)
 */
export function metadataPrettyValue(metadata, value, valueLabel = undefined) {
	switch (metadata.type) {
		case 'boolean':
			return value ? 'Oui' : 'Non';

		case 'date':
			return value instanceof Date ? Intl.DateTimeFormat('fr-FR').format(value) : value.toString();

		case 'enum':
			return valueLabel || value.toString();

		case 'location': {
			const { latitude, longitude } = type({ latitude: 'number', longitude: 'number' }).assert(
				value
			);

			return `${latitude}, ${longitude}`;
		}

		case 'boundingbox': {
			const {
				x: x1,
				y: y1,
				w,
				h
			} = type({ x: 'number', y: 'number', h: 'number', w: 'number' }).assert(value);

			return `Boîte de (${x1}, ${y1}) à (${x1 + w}, ${y1 + h})`;
		}

		case 'float':
			return Intl.NumberFormat('fr-FR').format(type('number').assert(value));

		default:
			return value.toString();
	}
}

/**
 * Returns a human-friendly string for a metadata key. Uses the label, and adds useful info about the data format if applicable.
 * To be used with `metadataPrettyValue`.
 * @param {DB.Metadata} metadata
 * @returns
 */
export function metadataPrettyKey(metadata) {
	let out = metadata.label;
	switch (metadata.type) {
		case 'location':
			out += ' (latitude, longitude)';
	}
	return out;
}

/**
 * Asserts that a metadata is of a certain type, inferring the correct runtime type for its value
 * @template {DB.} Type
 * @template {undefined | RuntimeValue} Value
 * @param {Type} testedtyp
 * @param {DB.MetadataType} metadatatyp
 * @param {Value} value
 * @returns {value is (Value extends RuntimeValue ?  RuntimeValue<Type> : (undefined | RuntimeValue<Type>))}
 */
export function isType(testedtyp, metadatatyp, value) {
	/**
	 * @param {import('arktype').Type} v
	 * @returns boolean
	 */
	const ok = (v) =>
		metadatatyp === testedtyp && (value === undefined || !(v(value) instanceof type.errors));

	switch (testedtyp) {
		case 'boolean':
			return ok(type('boolean'));
		case 'integer':
		case 'float':
			return ok(type('number'));
		case 'enum':
			return ok(type('string | number'));
		case 'date':
			return ok(type('Date'));
		case 'location':
			return ok(type({ latitude: 'number', longitude: 'number' }));
		case 'boundingbox':
			return ok(type({ x: 'number', y: 'number', w: 'number', h: 'number' }));
		case 'string':
			return ok(type('string'));
		default:
			throw new Error(`Type inconnu: ${testedtyp}`);
	}
}

/**
 * Just like `isType`, but for an array of values
 * @template {DB.MetadataType} Type
 * @template {undefined | RuntimeValue} Value
 * @param {Type} testedtyp
 * @param {DB.MetadataType} metadatatyp
 * @param {Value[]} value
 * @returns {value is (Value extends RuntimeValue ?  RuntimeValue<Type>[] : (undefined | RuntimeValue<Type>[]))}
 */
function areType(testedtyp, metadatatyp, value) {
	return value.every((v) => isType(testedtyp, metadatatyp, v));
}

/**
 * @template {DB.MetadataType} Type
 * @param {Type} type
 * @param {unknown} value
 * @returns {RuntimeValue<Type>}
 */
export function assertIs(type, value) {
	// @ts-ignore
	if (!isType(type, type, value))
		throw new Error(`La valeur n'est pas de type ${type}: ${JSON.stringify(value)}`);
	return value;
}

/**
 *
 * @param {{metadataOrder?: undefined | string[]}} protocol
 * @returns {(a: { id: string }, b: { id: string }) => number}
 */
export function metadataDefinitionComparator(protocol) {
	return ({ id: a }, { id: b }) => {
		if (protocol.metadataOrder) {
			return protocol.metadataOrder.indexOf(a) - protocol.metadataOrder.indexOf(b);
		}
		return idComparator(a, b);
	};
}

/**
 * @template T
 * @template Undefinable
 * @typedef{ Undefinable extends true ? T | undefined : T } Maybe
 */

/**
 * A null-value MetadataValue object
 */
export const METADATA_ZERO_VALUE = /** @type {const} */ ({
	value: null,
	manuallyModified: false,
	confidence: 0,
	alternatives: {}
});
