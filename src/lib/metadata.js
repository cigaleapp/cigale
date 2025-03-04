import { tables } from './idb';

/**
 *
 * @param {object} options
 * @param {string} options.subjectId id de l'image ou l'observation
 * @param {string} options.metadataId id de la métadonnée
 * @param {RuntimeValue<import('./database').MetadataType>} options.value la valeur de la métadonnée
 * @param {number} [options.confidence=1] la confiance dans la valeur (proba que ce soit la bonne valeur)
 * @param {Array<{ value: RuntimeValue<import('./database').MetadataType>; confidence: number }>} [options.alternatives=[]] les autres valeurs possibles
 */
export async function storeMetadataValue({
	subjectId,
	metadataId,
	value,
	confidence,
	alternatives
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

	const image = await tables.Image.raw.get(subjectId);
	const observation = await tables.Observation.raw.get(subjectId);

	if (image) {
		image.metadata[metadataId] = newValue;
		await tables.Image.raw.set(image);
	} else if (observation) {
		observation.metadataOverrides[metadataId] = newValue;
		await tables.Observation.raw.set(observation);
	} else {
		throw new Error(`Aucune image ou observation avec l'ID ${subjectId}`);
	}
}

/**
 * Gets all metadata for an observation, including metadata derived from merging the metadata values of the images that make up the observation.
 * @param {import('./database').Observation} observation
 * @returns {Promise<import('./database').MetadataValues>}
 */
export async function observationMetadata(observation) {
	// TODO use a transaction instead
	const images = await Promise.all(observation.images.map(tables.Image.get)).then(
		/**
		 * @template V
		 * @param {V[]} images
		 * @returns {NonNullable<V>[]}
		 */
		// @ts-ignore
		(images) => images.filter(Boolean)
	);

	const metadataFromImages = await mergeMetadataValues(images);

	return {
		...metadataFromImages,
		...observation.metadataOverrides
	};
}

/**
 *
 * @param {import("./database").Image[]} images
 * @returns {Promise<import("./database").MetadataValues>}
 */
export async function mergeMetadataValues(images) {
	/** @type {import("./database").MetadataValues}  */
	const output = {};

	const keys = new Set(...images.map((image) => Object.keys(image.metadata)));

	for (const key of keys) {
		const definition = await tables.Metadata.get(key);
		if (!definition) {
			console.warn(`Cannot merge metadata values for unknown key ${key}`);
			continue;
		}

		output[key] = mergeMetadata(
			definition,
			images.flatMap((img) =>
				Object.entries(img.metadata)
					.filter(([k]) => k === key)
					.map(([, v]) => v)
			)
		);
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
			// return mergeMajority(definition, values);
			throw new Error('Pas encore implémenté!');
		case 'min':
			// return mergeMinority(definition, values);
			throw new Error('Pas encore implémenté!');
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
			return {
				// TODO use null instead
				value: '',
				confidence: 0,
				alternatives: {}
			};
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
			latitude: average(
				values.map(
					(v) =>
						// @ts-ignore
						v.latitude
				)
			),
			longitude: average(
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
 * @template {import('./database').MetadataType} Type
 * @typedef {Type extends 'boolean' ? boolean : Type extends 'integer' ? number : Type extends 'float' ? number : Type extends 'enum' ? string : Type extends 'date' ? Date : Type extends 'location' ? { latitude: number, longitude: number } : string} RuntimeValue
 */
