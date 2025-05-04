import { type } from 'arktype';
import { Schemas } from './database.js';
import { _tablesState, idComparator, tables } from './idb.svelte.js';
import { format, isValid } from 'date-fns';
import { mapValues } from './utils.js';
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
 * @param {boolean} [options.manuallyModified=false] si la valeur a été modifiée manuellement
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
	manuallyModified = false,
	tx = undefined
}) {
	alternatives ??= [];
	confidence ??= 1;

	const newValue = {
		value: JSON.stringify(isValid(value) ? format(value, "yyyy-MM-dd'T'HH:mm:ss") : value),
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
 * Get the label of a enum metadata given its key.
 * @param {string} metadataId
 * @param {string} key
 * @returns {Promise<string|undefined>}
 */
export async function labelOfEnumKey(metadataId, key) {
	const metadata = tables.Metadata.state.find((m) => m.id === metadataId);
	if (!metadata) throw new Error(`Métadonnée inconnue avec l'ID ${metadataId}`);
	if (metadata.type !== 'enum') throw new Error(`Métadonnée ${metadataId} n'est pas de type enum`);

	return metadata.options?.find((o) => o.key === key)?.label;
}

/**
 * Get the key of a enum metadata given its label.
 * @param {string} metadataId
 * @param {string} label
 * @returns {Promise<string|undefined>}
 */
export async function keyOfEnumLabel(metadataId, label) {
	const metadata = tables.Metadata.state.find((m) => m.id === metadataId);
	if (!metadata) throw new Error(`Métadonnée inconnue avec l'ID ${metadataId}`);
	if (metadata.type !== 'enum') throw new Error(`Métadonnée ${metadataId} n'est pas de type enum`);

	return metadata.options?.find((o) => o.label === label)?.key;
}

/**
 * Merge metadata values from images and observations. For every metadata key, the value is taken from the merged values of observation overrides if there exists at least one, otherwise from the merged values of the images.
 * @param {import('./database').Image[]} images
 * @param {import('./database').Observation[]} observations
 */
export async function mergeMetadataFromImagesAndObservations(images, observations) {
	const mergedValues = await mergeMetadataValues(images.map((img) => img.metadata));
	const mergedOverrides = await mergeMetadataValues(
		observations.map((obs) => obs.metadataOverrides)
	);

	const keys = new Set([...Object.keys(mergedValues), ...Object.keys(mergedOverrides)]);

	/** @type {Record<string, import('./database').MetadataValue & { merged: boolean }>}  */
	const output = {};

	for (const key of keys) {
		const value = mergedOverrides[key] ?? mergedValues[key];
		if (value) output[key] = value;
	}

	return output;
}

/**
 *
 * @param {Array<import('./database').MetadataValues>} values
 * @returns {Promise<Record<string, import('./database').MetadataValue & { merged: boolean }>>}
 */
export async function mergeMetadataValues(values) {
	if (values.length === 1) {
		return mapValues(values[0], (v) => ({ ...v, merged: false }));
	}

	/** @type {Record<string, import('./database').MetadataValue & { merged: boolean }>}  */
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
				merged: [...new Set(valuesOfKey.map((v) => JSON.stringify(v.value)))].length > 1
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
 * Asserts that a metadata is of a certain type, inferring the correct runtime type for its value
 * @template {import('./database').MetadataType} Type
 * @template {undefined | import('./metadata').RuntimeValue} Value
 * @param {Type} testedtyp
 * @param {import('./metadata').RuntimeValue} metadatatyp
 * @param {Value} value
 * @returns {value is (Value extends (undefined | import('./metadata').RuntimeValue) ?  RuntimeValue<Type> : (undefined | RuntimeValue<Type>))}
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
 * @template {import('./database').MetadataType} [Type=import('./database').MetadataType]
 * @typedef {Type extends 'boolean' ? boolean : Type extends 'integer' ? number : Type extends 'float' ? number : Type extends 'enum' ? string : Type extends 'date' ? Date : Type extends 'location' ? { latitude: number, longitude: number } : Type extends 'boundingbox' ? { x: number, y: number, w: number, h: number } : string} RuntimeValue
 */

/**
 * @template T
 * @template Undefinable
 * @typedef{ Undefinable extends true ? T | undefined : T } Maybe
 */

/**
 * @param {string} id
 */
export function metadataById(id) {
	return tables.Metadata.state.find((m) => m.id === id);
}
