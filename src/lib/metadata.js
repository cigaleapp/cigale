import { type } from 'arktype';
import { Schemas } from './database.js';
import { _tablesState, tables } from './idb.svelte.js';
/**
 * @import { IDBTransactionWithAtLeast } from './idb.svelte.js'
 */

/**
 *
 * @template {import('./database').MetadataType} Type
 * @param {object} options
 * @param {string} options.subjectId id de l'image ou l'observation
 * @param {string} options.metadataId id de la métadonnée
 * @param {Type} [options.type] le type de données pour la métadonnée, sert à éviter des problèmes de typages
 * @param {RuntimeValue<Type>} options.value la valeur de la métadonnée
 * @param {number} [options.confidence=1] la confiance dans la valeur (proba que ce soit la bonne valeur)
 * @param {IDBTransactionWithAtLeast<["Image", "Observation"]>} [options.tx] transaction IDB pour effectuer plusieurs opérations d'un coup
 * @param {Array<{ value: RuntimeValue<Type>; confidence: number }>} [options.alternatives=[]] les autres valeurs possibles
 */
export async function storeMetadataValue({
	subjectId,
	metadataId,
	type,
	value,
	confidence,
	alternatives,
	tx = undefined
}) {
	alternatives ??= [];
	confidence ??= 1;

	const newValue = {
		value: JSON.stringify(value),
		confidence,
		alternatives: Object.fromEntries(
			alternatives.map((alternative) => [JSON.stringify(alternative.value), alternative.confidence])
		)
	};

	console.log(`Store metadata ${metadataId} in ${subjectId}`, newValue);

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
		console.log(`Store metadata ${metadataId} in ${subjectId}: found`, image);
		image.metadata[metadataId] = newValue;

		if (tx) tx.objectStore('Image').put(image);
		else await tables.Image.raw.set(image);

		_tablesState.Image[
			_tablesState.Image.findIndex((img) => img.id.toString() === subjectId)
		].metadata[metadataId] = Schemas.MetadataValue.assert(newValue);
	} else if (observation) {
		console.log(`Store metadata ${metadataId} in ${subjectId}: found`, observation);
		observation.metadataOverrides[metadataId] = newValue;

		if (tx) tx.objectStore('Observation').put(observation);
		else await tables.Observation.raw.set(observation);

		_tablesState.Observation[
			_tablesState.Observation.findIndex((img) => img.id.toString() === subjectId)
		].metadataOverrides[metadataId] = newValue;
	} else {
		throw new Error(`Aucune image ou observation avec l'ID ${subjectId}`);
	}
}

/**
 *
 * @param {object} options
 * @param {string} options.subjectId id de l'image ou l'observation
 * @param {string} options.metadataId id de la métadonnée
 * @param {IDBTransactionWithAtLeast<["Image", "Observation"]>} [options.tx] transaction IDB pour effectuer plusieurs opérations d'un coup
 */
export async function deleteMetadataValue({ subjectId, metadataId, tx }) {
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
	}

	return;
}

/**
 * Gets all metadata for an observation, including metadata derived from merging the metadata values of the images that make up the observation.
 * @param {import('./database').Observation} observation
 * @returns {Promise<import('./database').MetadataValues>}
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
 * @param {import('./database').MetadataValues} values
 * @returns {Record<string, import('./database').MetadataValue & { valueLabel?: string }>}
 */
export function addValueLabels(values) {
	return Object.fromEntries(
		Object.entries(values).map(([key, value]) => {
			const definition = tables.Metadata.state.find((m) => m.id === key);
			if (!definition) return [key, value];
			if (definition.type !== 'enum') return [key, value];

			return [
				key,
				{
					...value,
					valueLabel: definition.options?.find((o) => o.key === value.value.toString())?.label
				}
			];
		})
	);
}

/**
 *
 * @param {Array<import('./database').MetadataValues>} values
 * @returns {Promise<import("./database").MetadataValues>}
 */
export async function mergeMetadataValues(values) {
	/** @type {import("./database").MetadataValues}  */
	const output = {};

	const keys = new Set(values.flatMap((singleSubjectValues) => Object.keys(singleSubjectValues)));

	for (const key of keys) {
		const definition = await tables.Metadata.get(key);
		if (!definition) {
			console.warn(`Cannot merge metadata values for unknown key ${key}`);
			continue;
		}

		const merged = mergeMetadata(
			definition,
			values.flatMap((singleSubjectValues) =>
				Object.entries(singleSubjectValues)
					.filter(([k]) => k === key)
					.map(([, v]) => v)
			)
		);

		if (merged !== null) output[key] = merged;
	}

	return output;
}

/**
 * @param {import('./database').Image[]} images
 * @param {import('./database').Observation[]} observations
 */
export function combineMetadataValuesWithOverrides(images, observations) {
	// Combine overrides
	const metadataOverrides = combineMetadataValues(observations.map((o) => o.metadataOverrides));
	// Combine images
	const metadataFromImages = combineMetadataValues(images.map((i) => i.metadata));
	// For each key, try from metadataOverrides, if not found, try from metadataFromImages
	const keys = new Set([...Object.keys(metadataOverrides), ...Object.keys(metadataFromImages)]);
	/** @type {import('./database').MetadataValues} */
	const output = {};
	for (const key of keys) {
		// @ts-ignore
		output[key] = metadataOverrides[key] ?? metadataFromImages[key];
	}
	return output;
}

/**
 * Combine metadata values. Unlike `mergeMetadataValues`, this one does not attempt to merge different values for the same metadata definition, and puts `undefined` instead of a MetadataValue object when values differ.
 * @param {import('./database').MetadataValues[]} valuesets
 * @returns {Record<string, import('./database').MetadataValue | undefined>}
 */
export function combineMetadataValues(valuesets) {
	/** @type {Record<string, import('./database').MetadataValue | undefined>} */
	const output = {};

	let keys = new Set(valuesets.flatMap((v) => Object.keys(v)));

	for (const key of keys) {
		const values = valuesets.map((v) => v[key] ?? { value: null, confidence: 0, alternatives: {} });

		const stringedValues = new Set(values.map(({ value }) => JSON.stringify(value)));
		if (stringedValues.size > 1 || values.some(({ value }) => value === null)) {
			output[key] = undefined;
			continue;
		}

		const alternativeKeys = [...new Set(values.flatMap((v) => Object.keys(v.alternatives)))];

		output[key] = {
			value: values[0].value,
			confidence: avg(values.map((v) => v.confidence)),
			alternatives: Object.fromEntries(
				alternativeKeys.map((key) => [
					key,
					avg(values.map((v) => v.alternatives[key] ?? null).filter((p) => p !== null))
				])
			)
		};
	}

	return output;
}

/**
 *
 * @param {import("./database").Metadata} definition
 * @param {import("./database").MetadataValue[]} values
 */
function mergeMetadata(definition, values) {
	/**
	 * @param {(probabilities: number[]) => number} merger
	 * @param {import('./database').MetadataValue[]} values
	 * Run merger on array of confidences for every probability of each alternative of each values:
	 * example: [ { alternatives: { a: 0.8, b: 0.2 } }, { alternatives: { a: 0.6, b: 0.4 } } ]
	 * turns into: { a: merger([0.8, 0.6]), b: merger([0.2, 0.4]) }
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
				confidence: max(values.map((v) => v.confidence)),
				alternatives: mergeAlternatives(max, values)
			};
		case 'median':
			return {
				value: mergeMedian(
					definition.type,
					values.map((v) => v.value)
				),
				confidence: median(values.map((v) => v.confidence)),
				alternatives: mergeAlternatives(median, values)
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
 * @template {import('./database').MetadataType} Type
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

/** @param {number[]} values  */
function avg(values) {
	return values.reduce((acc, cur) => acc + cur, 0) / values.length;
}

/**
 * Merge values by average.
 * @param {Type} type
 * @param {Value[]} values
 * @returns {Value}
 * @template {RuntimeValue<Type>} Value
 * @template {import('./database').MetadataType} Type
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
 * @template {import('./database').MetadataType} Type
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
 * Convert series of values to an output number
 * @param {Type} type
 * @param {Value[]} values
 * @template {RuntimeValue<Type>} Value
 * @template {import('./database').MetadataType} Type
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
 * @param {import('./database').Metadata} metadata the metadata definition
 * @param {import('./database').MetadataValue['value']} value the value of the metadata
 */
export function metadataPrettyValue(metadata, value) {
	switch (metadata.type) {
		case 'boolean':
			return value ? 'Oui' : 'Non';

		case 'date':
			return value instanceof Date ? Intl.DateTimeFormat('fr-FR').format(value) : value.toString();

		case 'enum':
			return metadata.options?.find((o) => o.key === value.toString())?.label ?? value.toString();

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
				width,
				height
			} = type({ x: 'number', y: 'number', width: 'number', height: 'number' }).assert(value);

			return `Boîte de (${x1}, ${y1}) à (${x1 + width}, ${y1 + height})`;
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
 * @param {import('./database').Metadata} metadata
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
 * @template {import('./database').MetadataType} [Type=import('./database').MetadataType]
 * @typedef {Type extends 'boolean' ? boolean : Type extends 'integer' ? number : Type extends 'float' ? number : Type extends 'enum' ? string : Type extends 'date' ? Date : Type extends 'location' ? { latitude: number, longitude: number } : Type extends 'boundingbox' ? { x: number, y: number, w: number, h: number } : string} RuntimeValue
 */
