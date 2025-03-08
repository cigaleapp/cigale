import { type } from 'arktype';
import * as exifParser from 'exif-parser';
import { BUILTIN_METADATA_IDS, Schemas } from './database';
import { _tablesState, tables } from './idb.svelte.js';

/**
 *
 * @template {import('./database').MetadataType} Type
 * @param {object} options
 * @param {string} options.subjectId id de l'image ou l'observation
 * @param {string} options.metadataId id de la métadonnée
 * @param {Type} [options.type] le type de données pour la métadonnée, sert à éviter des problèmes de typages
 * @param {RuntimeValue<Type>} options.value la valeur de la métadonnée
 * @param {number} [options.confidence=1] la confiance dans la valeur (proba que ce soit la bonne valeur)
 * @param {Array<{ value: RuntimeValue<Type>; confidence: number }>} [options.alternatives=[]] les autres valeurs possibles
 */
export async function storeMetadataValue({
	subjectId,
	metadataId,
	type,
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

	const metadata = await tables.Metadata.get(metadataId);
	if (!metadata) throw new Error(`Métadonnée inconnue avec l'ID ${metadataId}`);
	if (type && metadata.type !== type)
		throw new Error(`Type de métadonnée incorrect: ${metadata.type} !== ${type}`);

	const image = await tables.Image.raw.get(subjectId);
	const observation = await tables.Observation.raw.get(subjectId);

	if (image) {
		image.metadata[metadataId] = newValue;
		await tables.Image.raw.set(image);
		_tablesState.Image[
			_tablesState.Image.findIndex((img) => img.id.toString() === subjectId)
		].metadata[metadataId] = Schemas.MetadataValue.assert(newValue);
	} else if (observation) {
		observation.metadataOverrides[metadataId] = newValue;
		await tables.Observation.raw.set(observation);
		_tablesState.Observation[
			_tablesState.Observation.findIndex((img) => img.id.toString() === subjectId)
		].metadataOverrides[metadataId] = newValue;
	} else {
		throw new Error(`Aucune image ou observation avec l'ID ${subjectId}`);
	}
}

/**
 * @param {ArrayBuffer} buffer buffer of the image to extract EXIF data from
 * @returns {Promise<import('./database.js').MetadataValues>}
 */
export async function extractFromExif(buffer) {
	const exif = exifParser.create(buffer).enableImageSize(false).parse();
	/** @type {Partial<Record<keyof typeof BUILTIN_METADATA_IDS, import('./metadata.js').RuntimeValue<import('./database.js').MetadataType>>>} */
	const output = {};

	if (!exif) return output;

	if (exif.tags.DateTimeOriginal) {
		output[BUILTIN_METADATA_IDS.shoot_date] = new Date(exif.tags.DateTimeOriginal);
	}

	if (exif.tags.GPSLatitude && exif.tags.GPSLongitude) {
		output[BUILTIN_METADATA_IDS.shoot_location] = {
			latitude: /** @type {number} */ (exif.tags.GPSLatitude),
			longitude: /** @type {number} */ (exif.tags.GPSLongitude)
		};
	}

	return Object.fromEntries(
		Object.entries(output).map(([key, value]) => [key, { value, alternatives: {}, confidence: 1 }])
	);
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

	const metadataFromImages = await mergeMetadataValues(images.map((img) => img.metadata));

	return {
		...metadataFromImages,
		...observation.metadataOverrides
	};
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
 * Combine metadata values. Unlike `mergeMetadataValues`, this one does not attempt to merge different values for the same metadata definition, and puts `undefined` instead of a MetadataValue object when values differ.
 * @param {import('./database').Image[]} images
 * @returns {Record<string, import('./database').MetadataValue | undefined>}
 */
export function combineMetadataValues(images) {
	/** @type {Record<string, import('./database').MetadataValue | undefined>} */
	const output = {};

	// TODO handle observations

	let keys = new Set(images.flatMap((img) => Object.keys(img.metadata)));

	for (const key of keys) {
		const values = images.map(
			(img) => img.metadata[key] ?? { value: null, confidence: 0, alternatives: {} }
		);

		const stringedValues = new Set(values.map(({ value }) => JSON.stringify(value)));
		console.log(`${[...keys]}: combining ${[...stringedValues]}`);
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
			return null;
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
			return metadata.options?.find((o) => o.key === value)?.label ?? value.toString();

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
 * @typedef {Type extends 'boolean' ? boolean : Type extends 'integer' ? number : Type extends 'float' ? number : Type extends 'enum' ? string : Type extends 'date' ? Date : Type extends 'location' ? { latitude: number, longitude: number } : Type extends 'boundingbox' ? { x: number, y: number, width: number, height: number } : string} RuntimeValue
 */
