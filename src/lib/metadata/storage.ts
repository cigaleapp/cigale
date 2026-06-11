import type * as DB from '$lib/database.js';
import type { DatabaseHandle, ReactiveTableNames } from '$lib/idb.svelte.js';
import type { NamespacedMetadataID } from '$lib/schemas/common.js';
import type { RuntimeValue } from '$lib/schemas/metadata.js';
import type { NumericUnit } from '$lib/schemas/units.js';

import { ArkErrors } from 'arktype';

import { computeCascades } from '$lib/cascades.js';
import { Tables } from '$lib/database.js';
import { observationMetadata } from '$lib/observations.js';
import {
	ensureNamespacedMetadataId,
	isNamespacedToProtocol,
	MetadataEnumVariant,
	MetadataError,
	MetadataValue,
	namespacedMetadataId,
	namespaceOfMetadataId,
} from '$lib/schemas/metadata.js';
import { groupBy, orEmptyObj3, prefixIDBKeyRange } from '$lib/utils.js';

import { resolveMetadataImport } from './imports.js';
import { serializeMetadataValue } from './serializing.js';

// TODO: use everywhere
function metadataOptionDatabaseKey(protocolId: string, metadataId: string, optionKey: string) {
	return `${ensureNamespacedMetadataId(metadataId, protocolId)}:${optionKey}`;
}

/**
 *
 * @param protocolId
 * @param metadataId null to get options of all metadata of the protocol
 */
export function metadataOptionsKeyRange(
	protocolId: string,
	metadataId: string | null
): IDBKeyRange {
	return prefixIDBKeyRange(
		metadataId
			? metadataOptionDatabaseKey(protocolId, metadataId, '')
			: namespacedMetadataId(protocolId, '')
	);
}

const METADATA_OPTIONS_CACHE = new Map<
	NamespacedMetadataID,
	Array<(typeof DB.Schemas.MetadataEnumVariant)['inferIn']>
>();

export function clearMetadataOptionsCache() {
	METADATA_OPTIONS_CACHE.clear();
}

export async function metadataOption(
	db: DatabaseHandle,
	metadataId: NamespacedMetadataID,
	optionKey: string
) {
	const cachedOptions = METADATA_OPTIONS_CACHE.get(metadataId);
	if (cachedOptions) {
		return cachedOptions.find((opt) => opt.key === optionKey);
	}

	return db
		.get(
			'MetadataOption',
			metadataOptionDatabaseKey(namespaceOfMetadataId(metadataId)!, metadataId, optionKey)
		)
		.then((opt) => (opt ? MetadataEnumVariant.assert(opt) : undefined));
}

/**
 * Options are cached. Use clearMetadataOptionsCache to clear that cache.
 * @param protocolId ID of the protocol
 * @param metadataId ID(s) of the metadata. Null to get all metadata from the protocol
 */
export async function metadataOptionsOf(
	db: DatabaseHandle,
	protocolId: string,
	metadataId: string | string[] | null
) {
	function arrayAndMap<Prop extends string, K extends string, V>(prop: Prop, map: Map<K, V[]>) {
		// @ts-expect-error does not include [prop] yet
		const out: Array<V> & { [k in Prop]: Map<K, V[]> } = Array.from(map.values()).flat();
		// @ts-expect-error TS doesnt understand that Prop is a single fixed string
		out[prop] = map;

		return out;
	}

	const options: typeof METADATA_OPTIONS_CACHE = new Map();

	const protocol = await db.get('Protocol', protocolId);
	if (!protocol) return arrayAndMap('byMetadata', options);

	let metadatas = Array.isArray(metadataId)
		? metadataId.map((id) => ensureNamespacedMetadataId(id, protocolId))
		: typeof metadataId === 'string'
			? [ensureNamespacedMetadataId(metadataId, protocolId)]
			: protocol.metadata;

	metadatas = metadatas.map((id) => resolveMetadataImport(protocol, id));

	for (const m of metadatas) {
		const cached = METADATA_OPTIONS_CACHE.get(m);

		if (cached) {
			options.set(m, cached);
		}
	}

	metadatas = metadatas.filter((id) => !options.has(id));

	if (metadatas.length === 0) return arrayAndMap('byMetadata', options);

	const results = await Promise.all(
		Array.from(groupBy(metadatas, (id) => namespaceOfMetadataId(id)).entries()).map(
			async ([protocolId, metadatas]) =>
				db.getAll(
					'MetadataOption',
					metadataOptionsKeyRange(
						protocolId,
						metadatas.length === 1 ? metadatas[0] : null
					)
				)
		)
	);

	const byMetadata = new Map(
		metadatas.map((id) => [
			id,
			results
				.flat()
				.filter((o) =>
					metadataOptionsKeyRange(namespaceOfMetadataId(id), id).includes(o.id)
				),
		])
	);

	for (const [id, result] of byMetadata) {
		METADATA_OPTIONS_CACHE.set(id, result);
		options.set(id, result);
	}

	return arrayAndMap('byMetadata', options);
}

/**
 * Refresh the specified table. Does nothing if we can't import idb.svelte.js.
 * We do it this way so that this file can be imported in the web worker.
 */
async function refreshTables(sessionId: string, ...tableNames: ReactiveTableNames[]) {
	try {
		const idb = await import('$lib/idb.svelte.js');
		await Promise.all(tableNames.map((name) => idb.tables[name].refresh(sessionId)));
	} catch (error) {
		console.warn(`Cannot refresh tables ${tableNames}:`, error);
	}
}

/**
 *
 * @param options
 * @param options.subjectId id de l'image, l'observation ou la session. Aussi possible de mettre un id de ImageFile, dans ce cas la métadonnée sera appliquée à toutes les images utilisant l'ImageFile en question
 * @param options.metadataId id de la métadonnée
 * @param options.type le type de données pour la métadonnée, sert à éviter des problèmes de typages
 * @param options.value la valeur de la métadonnée
 * @param options.manuallyModified si la valeur a été modifiée manuellement
 * @param options.confidence la confiance dans la valeur (proba que ce soit la bonne valeur)
 * @param options.confirmed si la valeur a été confirmée manuellement comme correcte
 * @param options.clearErrors effacer tout les metadataErrors associés à cette métadonnée. True par défaut.
 * @param options.db BDD à modifier
 * @param options.alternatives les autres valeurs possibles.
 * @param options.clearConfidences effacer les confidences existantes au lieu de fusionner avec les anciennes
 * @param options.cascadedFrom ID des métadonnées dont celle-ci est dérivée, pour éviter les boucles infinies (cf "cascade" dans MetadataEnumVariant)
 * @param options.abortSignal signal d'abandon pour annuler la requête
 * @param options.sessionId id de la session en cours, important pour refresh le state réactif des tables
 */
export async function storeMetadataValue<Type extends DB.MetadataType>({
	db,
	subjectId,
	metadataId,
	type,
	value,
	confidence = 1,
	confirmed = false,
	confidences = [],
	alternatives = [],
	manuallyModified = false,
	clearErrors = true,
	isDefault = false,
	updateReactiveState = true,
	clearConfidences = false,
	unit = undefined,
	applyCascades = true,
	sessionId,
	abortSignal,
}: {
	subjectId: string;
	// TODO switch to NamespacedMetadataId
	metadataId: string;
	type?: Type;
	value: RuntimeValue<Type>;
	manuallyModified?: boolean;
	confidence?: number;
	confirmed?: boolean;
	clearErrors?: boolean;
	isDefault?: boolean;
	unit?: typeof NumericUnit.infer | undefined;
	db: DatabaseHandle;
	alternatives?: Array<RuntimeValue<Type>>;
	confidences?: Record<string, number> | Array<{ value: RuntimeValue<Type>; confidence: number }>;
	clearConfidences?: boolean;
	applyCascades?: boolean;
	abortSignal?: AbortSignal | undefined;
	sessionId?: string | undefined | null;
	updateReactiveState?: boolean;
}) {
	if (!isNamespacedToProtocol(null, metadataId)) {
		throw new Error(`Le metadataId ${metadataId} n'est pas namespacé`);
	}

	if (confidence > 1) {
		console.warn(`Confidence ${confidence} is greater than 1, capping to 1`);
		confidence = 1;
	}

	abortSignal?.throwIfAborted();
	const newValue = {
		value: serializeMetadataValue(value),
		confidence,
		...orEmptyObj3({ unit }),
		confirmed,
		manuallyModified,
		isDefault,
		alternatives: alternatives.map(serializeMetadataValue),
		confidences: !Array.isArray(confidences)
			? confidences
			: Object.fromEntries(
					confidences.map(({ value, confidence }) => {
						if (confidence > 1) {
							console.warn(
								`Confidence ${confidence} of alternative ${value} is greater than 1, capping to 1`
							);
							confidence = 1;
						}

						return [serializeMetadataValue(value), confidence];
					})
				),
	};

	newValue.confidences[serializeMetadataValue(value)] = confidence;

	/**
	 * Updates newValue.confidences to take into account the old confidences (if clearConfidences is false)
	 */
	function processConfidences(
		target: typeof newValue,
		oldValue: undefined | { confidences: Record<string, number> }
	) {
		if (oldValue && !clearConfidences) {
			target.confidences = { ...oldValue.confidences, ...target.confidences };
		}
	}

	console.debug(`Store metadata ${metadataId} = `, value, ` in ${subjectId}`, newValue);

	const metadata = await db.get('Metadata', metadataId);
	if (!metadata) throw new Error(`Métadonnée inconnue avec l'ID ${metadataId}`);
	if (type && metadata.type !== type)
		throw new Error(`Type de métadonnée incorrect: ${metadata.type} !== ${type}`);

	abortSignal?.throwIfAborted();
	const image = await db.get('Image', subjectId);
	const observation = await db.get('Observation', subjectId);
	const session = await db.get('Session', subjectId);
	const imagesFromImageFile = await db
		.getAll('Image')
		.then((imgs) => imgs.filter(({ fileId }) => fileId === subjectId));

	abortSignal?.throwIfAborted();
	if (session) {
		processConfidences(newValue, session.metadata?.[metadataId]);

		if (session.metadata) {
			session.metadata[metadataId] = newValue;
		} else {
			session.metadata = { [metadataId]: newValue };
		}
		db.put('Session', session);
	} else if (image) {
		processConfidences(newValue, image.metadata[metadataId]);

		image.metadata[metadataId] = newValue;
		if (clearErrors && image.metadataErrors?.[metadataId]) {
			delete image.metadataErrors[metadataId];
		}
		db.put('Image', image);
	} else if (observation) {
		processConfidences(
			newValue,
			observationMetadata({
				observation: Tables.Observation.assert(observation),
				definitions: [Tables.Metadata.assert(await db.get('Metadata', metadataId))],
				images: await Promise.all(
					observation.images.map(async (img) =>
						db.get('Image', img).then((i) => Tables.Image.assert(i))
					)
				),
			})[metadataId]
		);

		observation.metadataOverrides[metadataId] = newValue;
		if (clearErrors && observation.metadataErrors?.[metadataId]) {
			delete observation.metadataErrors[metadataId];
		}
		db.put('Observation', observation);
	} else if (imagesFromImageFile.length > 0) {
		for (const { id } of imagesFromImageFile) {
			await storeMetadataValue({
				db,
				sessionId,
				subjectId: id,
				metadataId,
				value,
				confidence,
				isDefault,
				confirmed,
				manuallyModified,
				clearErrors,
				abortSignal,
			});
		}
	} else {
		throw new Error(`Aucune image ou observation avec l'ID ${subjectId}`);
	}

	abortSignal?.throwIfAborted();

	if (applyCascades) {
		const cascades = await computeCascades({
			db,
			metadataId,
			value,
			confidence,
			confidences,
		});

		for (const cascade of cascades) {
			abortSignal?.throwIfAborted();

			console.info(
				`Cascading metadata ${metadataId} @ ${value} -> ${cascade.metadataId}  = ${cascade.value}`
			);

			await storeMetadataValue({
				db,
				sessionId,
				subjectId,
				manuallyModified,
				isDefault,
				confirmed,
				...cascade,
				applyCascades: false,
				updateReactiveState: false,
				abortSignal,
				clearErrors,
			});
		}
	}

	// Only refresh table state if asked
	if (sessionId && updateReactiveState) {
		await refreshTables(sessionId, session ? 'Session' : image ? 'Image' : 'Observation');
	}
}

export async function storeMetadataErrors(
	{
		db,
		subjectId,
		sessionId,
		metadataId,
	}: {
		db: DatabaseHandle;
		subjectId: string;
		sessionId: string;
		metadataId: string;
	},
	...errors: Array<typeof DB.Schemas.MetadataError.inferIn>
) {
	const image = await db.get('Image', subjectId);
	const observation = await db.get('Observation', subjectId);
	const imagesFromImageFile = await db
		.getAllFromIndex('Image', 'sessionId', sessionId)
		.then((imgs) => imgs.filter(({ fileId }) => fileId === subjectId));

	if (!image && !observation && imagesFromImageFile.length === 0)
		throw new Error(`Aucune image ou observation avec l'ID ${subjectId}`);

	const serializedErrors = errors.map((error) => {
		try {
			JSON.stringify(error.details);
		} catch {
			error.details = `{{Non-JSONable}} ${String(error.details)}`;
		}

		return MetadataError.assert(error);
	});

	console.debug(`Store metadata error on ${metadataId} in ${subjectId}:`, errors);
	if (image) {
		image.metadataErrors ??= {};
		image.metadataErrors[metadataId] = serializedErrors;
		db.put('Image', image);
	} else if (observation) {
		observation.metadataErrors ??= {};
		observation.metadataErrors[metadataId] = serializedErrors;
		db.put('Observation', observation);
	} else if (imagesFromImageFile) {
		for (const { id } of imagesFromImageFile) {
			await storeMetadataErrors(
				{
					db,
					sessionId,
					subjectId: id,
					metadataId,
				},
				...errors
			);
		}
	}

	return;
}
/**
 *
 * @param options
 * @param options.subjectId id de l'image ou l'observation
 * @param options.metadataId id de la métadonnée
 * @param options.recursive si true, supprime la métadonnée de toutes les images composant l'observation
 * @param options.db BDD à modifier
 * @param options.reactive refresh reactive table state if possible
 * @param options.sessionId current session, used to refresh reactive tables
 */
export async function deleteMetadataValue({
	db,
	subjectId,
	metadataId,
	recursive = false,
	reactive = true,
	sessionId,
}: {
	subjectId: string;
	metadataId: string;
	recursive?: boolean;
	db: DatabaseHandle;
	reactive?: boolean;
	sessionId?: string | undefined;
}) {
	const image = await db.get('Image', subjectId);
	const observation = await db.get('Observation', subjectId);
	const session = await db.get('Session', subjectId);
	const imagesFromImageFile = await db
		.getAllFromIndex('Image', 'sessionId', sessionId)
		.then((imgs) => imgs.filter(({ fileId }) => fileId === subjectId));

	if (!image && !observation && !session && imagesFromImageFile.length === 0)
		throw new Error(`Aucune image, observation ou session avec l'ID ${subjectId}`);

	let deletedValue: ArkErrors | typeof MetadataValue.infer | undefined = undefined;

	console.debug(`Delete metadata ${metadataId} in ${subjectId}`);
	if (image) {
		deletedValue = MetadataValue(structuredClone(image.metadata[metadataId]));
		delete image.metadata[metadataId];
		db.put('Image', image);
	} else if (session) {
		deletedValue = MetadataValue(structuredClone(session.metadata[metadataId]));
		delete session.metadata[metadataId];
		db.put('Session', session);
	} else if (observation) {
		deletedValue = MetadataValue(structuredClone(observation.metadataOverrides[metadataId]));
		delete observation.metadataOverrides[metadataId];
		db.put('Observation', observation);
		if (recursive) {
			for (const imageId of observation.images) {
				await deleteMetadataValue({
					db,
					sessionId,
					subjectId: imageId,
					recursive: false,
					metadataId,
					// Don't refresh table state on recursive calls, we just have to do it once
					reactive: false,
				});
			}
		}
	} else if (imagesFromImageFile) {
		for (const { id } of imagesFromImageFile) {
			await deleteMetadataValue({
				db,
				sessionId,
				subjectId: id,
				recursive: false,
				metadataId,
				reactive: false,
			});
		}
	}

	if (!(deletedValue instanceof ArkErrors) && typeof deletedValue?.value === 'string') {
		const metadataType = await db.get('Metadata', metadataId).then((m) => m?.type);
		if (metadataType === 'file') {
			await db.delete('MetadataValueFile', deletedValue.value);
		}
	}

	if (reactive && sessionId) await refreshTables(sessionId, 'Image', 'Observation', 'Session');

	return;
}
