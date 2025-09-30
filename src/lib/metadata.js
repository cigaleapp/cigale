import { type } from 'arktype';
import { sendCorrection } from '@cigale/beamup';
import * as dates from 'date-fns';
import { computeCascades } from './cascades.js';
import { idComparator, Schemas } from './database.js';
import { m } from './paraglide/messages.js';
import { getLocale, setLocale } from './paraglide/runtime.js';
import {
	ensureNamespacedMetadataId,
	isNamespacedToProtocol,
	namespacedMetadataId,
	namespaceOfMetadataId,
	removeNamespaceFromMetadataId
} from './schemas/metadata.js';
import { avg, entries, mapValues } from './utils.js';

/**
 * @import { IDBDatabaseType, ReactiveTableNames } from './idb.svelte.js'
 * @import * as DB from './database.js'
 * @typedef {import('idb').IDBPDatabase<IDBDatabaseType>} DatabaseHandle
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
 * Refresh the specified table. Does nothing if we can't import idb.svelte.js.
 * We do it this way so that this file can be imported in the web worker.
 * @param {...ReactiveTableNames} tableNames
 */
async function refreshTables(...tableNames) {
	try {
		const idb = await import('$lib/idb.svelte.js');
		await Promise.all(tableNames.map((name) => idb.tables[name].refresh()));
	} catch (error) {
		console.warn(`Cannot refresh tables ${tableNames}:`, error);
	}
}

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
		value instanceof Date && dates.isValid(value)
			? dates.format(value, "yyyy-MM-dd'T'HH:mm:ss")
			: value
	);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('serializeMetadataValue', () => {
		expect(serializeMetadataValue('hello')).toBe('"hello"');
		expect(serializeMetadataValue(42)).toBe('42');
		expect(serializeMetadataValue(true)).toBe('true');
		expect(serializeMetadataValue(null)).toBe('null');

		const date = new Date('2023-01-01T12:30:45');
		expect(serializeMetadataValue(date)).toBe('"2023-01-01T12:30:45"');

		// Invalid date should be serialized as is
		const invalidDate = new Date('invalid');
		expect(serializeMetadataValue(invalidDate)).toBe('null'); // Invalid date becomes null when JSON stringified

		expect(serializeMetadataValue(['a', 'b'])).toBe('["a","b"]');
		expect(serializeMetadataValue({ key: 'value' })).toBe('{"key":"value"}');
	});
}

/**
 * Serialize a record of metadata values for storing in the database.
 * @param {DB.MetadataValues} values
 * @returns {typeof import('$lib/database').Schemas.MetadataValues.inferIn}
 */
export function serializeMetadataValues(values) {
	return mapValues(values, ({ value, ...rest }) => ({
		...rest,
		value: serializeMetadataValue(value)
	}));
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
 * @param {DatabaseHandle} options.db BDD à modifier
 * @param {Array<{ value: RuntimeValue<Type>; confidence: number }>} [options.alternatives=[]] les autres valeurs possibles
 * @param {string[]} [options.cascadedFrom] ID des métadonnées dont celle-ci est dérivée, pour éviter les boucles infinies (cf "cascade" dans MetadataEnumVariant)
 * @param {AbortSignal} [options.abortSignal] signal d'abandon pour annuler la requête
 * @param {typeof import('$lib/schemas/protocols.js').Protocol.infer.beamup} [options.beamup] informations sur l'instance BeamUp où envoyer la correction, telle que définie par le protocole courant
 * @param {{ id: string; version: number | string }} options.protocol le protocole courant, utilisé pour BeamUp
 */
export async function storeMetadataValue({
	db,
	subjectId,
	metadataId,
	type,
	value,
	confidence = 1,
	alternatives = [],
	manuallyModified = false,
	cascadedFrom = [],
	abortSignal,
	beamup: beamupSettings,
	protocol
}) {
	if (!namespaceOfMetadataId(metadataId)) {
		throw new Error(`Le metadataId ${metadataId} n'est pas namespacé`);
	}

	abortSignal?.throwIfAborted();
	const newValue = {
		value: serializeMetadataValue(value),
		confidence,
		manuallyModified,
		alternatives: Object.fromEntries(
			alternatives.map((alternative) => [
				serializeMetadataValue(alternative.value),
				alternative.confidence
			])
		)
	};

	// Make sure the alternatives does not contain the value itself
	newValue.alternatives = Object.fromEntries(
		Object.entries(newValue.alternatives).filter(([key]) => key !== newValue.value)
	);

	console.debug(`Store metadata ${metadataId} = `, value, ` in ${subjectId}`, newValue);

	const metadata = await db.get('Metadata', metadataId);
	if (!metadata) throw new Error(`Métadonnée inconnue avec l'ID ${metadataId}`);
	if (type && metadata.type !== type)
		throw new Error(`Type de métadonnée incorrect: ${metadata.type} !== ${type}`);

	abortSignal?.throwIfAborted();
	const image = await db.get('Image', subjectId);
	const observation = await db.get('Observation', subjectId);
	const imagesFromImageFile = await db
		.getAll('Image')
		.then((imgs) => imgs.filter(({ fileId }) => fileId === subjectId));

	abortSignal?.throwIfAborted();
	if (image) {
		subjectIs = 'image';
		if (metadataId in image.metadata) {
			oldValue = structuredClone(image.metadata[metadataId]);
		}
		image.metadata[metadataId] = newValue;
		db.put('Image', image);
	} else if (observation) {
		subjectIs = 'observation';
		if (metadataId in observation.metadataOverrides) {
			oldValue = structuredClone(observation.metadataOverrides[metadataId]);
		} else if (beamupSettings && observation.images.length > 0) {
			const images = await db
				.getAll('Image')
				.then((imgs) => imgs.filter((img) => observation.images.includes(img.id)));
			const merged = mergeMetadata(
				metadata,
				images
					.filter((img) => img.metadata[metadataId])
					.map((img) => img.metadata[metadataId])
					.map(Schemas.MetadataValue.assert)
			);
			if (merged) {
				oldValue = {
					...merged,
					value: serializeMetadataValue(merged.value)
				};
			}
		}
		observation.metadataOverrides[metadataId] = newValue;
		db.put('Observation', observation);
	} else if (imagesFromImageFile) {
		for (const { id } of imagesFromImageFile) {
			await storeMetadataValue({
				db,
				subjectId: id,
				metadataId,
				value,
				confidence,
				manuallyModified,
				abortSignal,
				protocol,
				beamup: beamupSettings
			});
		}
	} else {
		throw new Error(`Aucune image ou observation avec l'ID ${subjectId}`);
	}

	abortSignal?.throwIfAborted();

	const cascades = await computeCascades({
		db,
		metadataId,
		value,
		confidence,
		alternatives
	});

	for (const cascade of cascades) {
		abortSignal?.throwIfAborted();

		if (cascadedFrom.includes(cascade.metadataId)) {
			throw new Error(
				`Boucle infinie de cascade détectée pour ${cascade.metadataId} avec ${cascade.value}: ${cascadedFrom.join(' -> ')} -> ${metadataId} -> ${cascade.metadataId}`
			);
		}

		console.info(
			`Cascading metadata ${metadataId} @ ${value} -> ${cascade.metadataId}  = ${cascade.value}`
		);

		const metadataNamespace = namespaceOfMetadataId(metadataId);
		if (!metadataNamespace)
			throw new Error(
				`Metadata ${metadataId} is not namespaced, cannot cascade onto ${cascade.metadataId}`
			);

		cascade.metadataId = ensureNamespacedMetadataId(cascade.metadataId, metadataNamespace);

		await storeMetadataValue({
			db,
			subjectId,
			manuallyModified,
			cascadedFrom: [...cascadedFrom, metadataId],
			abortSignal,
			protocol,
			beamup: beamupSettings,
			...cascade
		});
	}

	if (beamupSettings && oldValue && !oldValue.manuallyModified && manuallyModified) {
		console.info(`Sending correction to BeamUp for metadata ${metadataId} in ${subjectId}`);
		await sendCorrection({
			...beamupSettings,
			metadata: metadataId,
			subject: subjectId,
			subject_type: subjectIs,
			client_name: 'CIGALE',
			client_version: import.meta.env.buildCommit,
			subject_content_hash: null, // TODO store hash in ImageFile
			comment: null,
			done_at: storedAt.toISOString(),
			protocol_id: protocol.id,
			protocol_version: protocol.version.toString(),
			user: null,
			before: {
				type: metadata.type,
				value: oldValue.value,
				alternatives: entries(oldValue.alternatives).map(([value, confidence]) => ({
					value,
					confidence
				}))
			},
			after: {
				type: metadata.type,
				value: serializeMetadataValue(value),
				alternatives: alternatives.map((a) => ({
					value: serializeMetadataValue(a.value),
					confidence: a.confidence
				}))
			}
		}).catch(console.error);
	}

	// Only refresh table state once everything has been cascaded, meaning not inside recursive calls
	if (cascadedFrom.length === 0) {
		await refreshTables(image ? 'Image' : 'Observation');
	}
}

/**
 *
 * @param {object} options
 * @param {string} options.subjectId id de l'image ou l'observation
 * @param {string} options.metadataId id de la métadonnée
 * @param {boolean} [options.recursive=false] si true, supprime la métadonnée de toutes les images composant l'observation
 * @param {DatabaseHandle} options.db BDD à modifier
 * @param {boolean} [options.reactive=true] refresh reactive table state if possible
 */
export async function deleteMetadataValue({
	db,
	subjectId,
	metadataId,
	recursive = false,
	reactive = true
}) {
	const image = await db.get('Image', subjectId);
	const observation = await db.get('Observation', subjectId);

	if (!image && !observation) throw new Error(`Aucune image ou observation avec l'ID ${subjectId}`);

	console.debug(`Delete metadata ${metadataId} in ${subjectId}`);
	if (image) {
		delete image.metadata[metadataId];
		db.put('Image', image);
	} else if (observation) {
		delete observation.metadataOverrides[metadataId];
		db.put('Observation', observation);
		if (recursive) {
			for (const imageId of observation.images) {
				await deleteMetadataValue({
					db,
					subjectId: imageId,
					recursive: false,
					metadataId,
					// Don't refresh table state on recursive calls, we just have to do it once
					reactive: false
				});
			}
		}
	}

	if (reactive) await refreshTables('Image', 'Observation');

	return;
}

/**
 * Gets all metadata for an observation, including metadata derived from merging the metadata values of the images that make up the observation.
 * @param {Pick<DB.Observation, 'images' | 'metadataOverrides'>} observation
 * @param {DatabaseHandle} db
 * @returns {Promise<DB.MetadataValues>}
 */
export async function observationMetadata(db, observation) {
	const images = await db
		.getAll('Image')
		.then((images) => images.filter((img) => observation.images.includes(img.id)));

	const metadataFromImages = await mergeMetadataValues(
		db,
		images.map((img) => Schemas.MetadataValues.assert(img.metadata))
	);

	return {
		...metadataFromImages,
		...observation.metadataOverrides
	};
}

/**
 * Adds valueLabel to each metadata value object when the metadata is an enum.
 * @param {DB.MetadataValues} values
 * @param {Record<string, DB.MetadataEnumVariant[]>} metadataOptions
 * @returns {Promise<Record<string, DB.MetadataValue & { valueLabel?: string }>>}
 */
export async function addValueLabels(values, metadataOptions) {
	return Object.fromEntries(
		Object.entries(values).map(([key, value]) => {
			const opts = metadataOptions[key];
			if (!opts) return [key, value];

			return [
				key,
				{
					...value,
					valueLabel: opts?.find((o) => o.key === value.value.toString())?.label
				}
			];
		})
	);
}

/**
 * Merge metadata values from images and observations. For every metadata key, the value is taken from the merged values of observation overrides if there exists at least one, otherwise from the merged values of the images.
 * @param {DatabaseHandle} db
 * @param {DB.Image[]} images
 * @param {DB.Observation[]} observations
 */
export async function mergeMetadataFromImagesAndObservations(db, images, observations) {
	const mergedValues = await mergeMetadataValues(
		db,
		images.map((img) => img.metadata)
	);
	const mergedOverrides = await mergeMetadataValues(
		db,
		observations.map((obs) => obs.metadataOverrides)
	);

	const keys = new Set([...Object.keys(mergedValues), ...Object.keys(mergedOverrides)]);

	/** @type {Record<string, DB.MetadataValue & { merged: boolean }>}  */
	const output = {};

	for (const key of keys) {
		const value = mergedOverrides[key] ?? mergedValues[key];
		if (value) output[key] = value;
	}

	return output;
}

/**
 * @param {DatabaseHandle} db
 * @param {Array<DB.MetadataValues>} values
 * @returns {Promise<Record<string, DB.MetadataValue & { merged: boolean }>>}
 */
export async function mergeMetadataValues(db, values) {
	if (values.length === 1) {
		return mapValues(values[0], (v) => ({ ...v, merged: false }));
	}

	/** @type {Record<string, DB.MetadataValue & { merged: boolean }>}  */
	const output = {};

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

		const merged = mergeMetadata(definition, valuesOfKey);

		if (merged !== null && merged !== undefined)
			output[key] = {
				...merged,
				merged: new Set(valuesOfKey.map((v) => JSON.stringify(v.value))).size > 1
			};
	}

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
 * @param {Pick<DB.Metadata, 'type'>} metadata the metadata definition
 * @param {DB.MetadataValue['value']} value the value of the metadata
 * @param {string} [valueLabel] the label of the value, if applicable (e.g. for enums)
 */
export function metadataPrettyValue(metadata, value, valueLabel = undefined) {
	switch (metadata.type) {
		case 'boolean':
			return value ? m.metadata_value_yes() : m.metadata_value_no();

		case 'date':
			return value instanceof Date ? dates.format(value, 'Ppp') : value.toString();

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

			return m.metadata_value_boundingbox({ x1, y1, x2: x1 + w, y2: y1 + h });
		}

		case 'float':
			return Intl.NumberFormat(getLocale()).format(type('number').assert(value));

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
				setLocale('fr', { reload: false });
			});

			test('booleans', () => {
				expect(metadataPrettyValue({ type: 'boolean' }, true)).toBe('Oui');
				expect(metadataPrettyValue({ type: 'boolean' }, false)).toBe('Non');
			});

			test('dates', () => {
				expect(metadataPrettyValue({ type: 'date' }, new Date('2023-02-01T15:04:05Z'))).toBe(
					'01/02/2023, 15:04:05'
				);
			});

			test('floats', () => {
				expect(metadataPrettyValue({ type: 'float' }, 12012.34)).toBe('12 012,34');
			});

			test('bounding boxes', () => {
				expect(metadataPrettyValue({ type: 'boundingbox' }, { x: 1, y: 2, w: 3, h: 4 })).toBe(
					'Boîte de (1, 2) à (4, 6)'
				);
			});
		});

		describe('in english', () => {
			beforeEach(async () => {
				const { enUS } = await import('date-fns/locale');
				dates.setDefaultOptions({ locale: enUS });
				setLocale('en', { reload: false });
			});

			test('booleans', () => {
				expect(metadataPrettyValue({ type: 'boolean' }, true)).toBe('Yes');
				expect(metadataPrettyValue({ type: 'boolean' }, false)).toBe('No');
			});

			test('dates', () => {
				expect(metadataPrettyValue({ type: 'date' }, new Date('2023-02-01T15:04:05Z'))).toBe(
					'02/01/2023, 3:04:05 PM'
				);
			});

			test('bounding boxes', () => {
				expect(metadataPrettyValue({ type: 'boundingbox' }, { x: 1, y: 2, w: 3, h: 4 })).toBe(
					'Box from (1, 2) to (4, 6)'
				);
			});

			test('floats', () => {
				expect(metadataPrettyValue({ type: 'float' }, 12012.34)).toBe('12,012.34');
			});
		});

		test('enums', () => {
			expect(metadataPrettyValue({ type: 'enum' }, 'value1', 'Label 1')).toBe('Label 1');
			expect(metadataPrettyValue({ type: 'enum' }, 'value2')).toBe('value2');
		});

		test('locations', () => {
			expect(metadataPrettyValue({ type: 'location' }, { latitude: 12.34, longitude: 56.78 })).toBe(
				'12.34, 56.78'
			);
		});

		test('integers', () => {
			expect(metadataPrettyValue({ type: 'integer' }, 12012)).toBe('12012');
		});
	});
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
 * @template {DB.MetadataType} Type
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
 *
 * @template {DB.MetadataType} Type
 * @param {Type} type
 * @param {any} value
 * @returns {value is RuntimeValue<Type>}
 */
export function hasRuntimeType(type, value) {
	return isType(type, type, value);
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
const METADATA_ZERO_VALUE = /** @type {const} */ ({
	value: null,
	manuallyModified: false,
	confidence: 0,
	alternatives: {}
});

/**
 * Returns a un-namespaced object of all metadata values of the given protocol, given the metadata values object of an image/observation. If a metadata value is absent from the given values, the value is still present, but set to `null`.
 *
 * @param {DB.Protocol} protocol
 * @param {DB.MetadataValues} values
 */
export function protocolMetadataValues(protocol, values) {
	return Object.fromEntries(
		protocol.metadata
			.filter((key) => isNamespacedToProtocol(protocol.id, key))
			.map((key) => [
				removeNamespaceFromMetadataId(key),
				values[key] ?? {
					...METADATA_ZERO_VALUE,
					valueLabel: ''
				}
			])
	);
}

/**
 *
 * @param {string} protocolId
 * @param {string|null} metadataId null to get options of all metadata of the protocol
 * @returns {IDBKeyRange}
 */
export function metadataOptionsKeyRange(protocolId, metadataId) {
	if (metadataId) {
		const fullMetadataId = ensureNamespacedMetadataId(metadataId, protocolId);
		return IDBKeyRange.bound(fullMetadataId + ':', fullMetadataId + ':\uffff');
	} else {
		return IDBKeyRange.bound(
			namespacedMetadataId('', protocolId),
			namespacedMetadataId('\uffff', protocolId)
		);
	}
}
