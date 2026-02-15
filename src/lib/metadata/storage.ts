import { ArkErrors } from 'arktype';

import { computeCascades } from '$lib/cascades.js';
import type * as DB from '$lib/database.js';
import type { DatabaseHandle, ReactiveTableNames } from '$lib/idb.svelte.js';
import {
	ensureNamespacedMetadataId,
	MetadataError,
	MetadataValue,
	namespacedMetadataId,
	namespaceOfMetadataId,
	type RuntimeValue
} from '$lib/schemas/metadata.js';

import { serializeMetadataValue } from './serializing.js';

/**
 *
 * @param protocolId
 * @param metadataId null to get options of all metadata of the protocol
 */
export function metadataOptionsKeyRange(
	protocolId: string,
	metadataId: string | null
): IDBKeyRange {
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
 * @param options.subjectId id de l'image, l'observation ou la session
 * @param options.metadataId id de la métadonnée
 * @param options.type le type de données pour la métadonnée, sert à éviter des problèmes de typages
 * @param options.value la valeur de la métadonnée
 * @param options.manuallyModified si la valeur a été modifiée manuellement
 * @param options.confidence la confiance dans la valeur (proba que ce soit la bonne valeur)
 * @param options.confirmed si la valeur a été confirmée manuellement comme correcte
 * @param options.clearErrors effacer tout les metadataErrors associés à cette métadonnée. True par défaut.
 * @param options.db BDD à modifier
 * @param options.alternatives les autres valeurs possibles
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
	alternatives = [],
	manuallyModified = false,
	clearErrors = true,
	isDefault = false,
	cascadedFrom = [],
	sessionId,
	abortSignal
}: {
	subjectId: string;
	metadataId: string;
	type?: Type;
	value: RuntimeValue<Type>;
	manuallyModified?: boolean;
	confidence?: number;
	confirmed?: boolean;
	clearErrors?: boolean;
	isDefault?: boolean;
	db: DatabaseHandle;
	alternatives?:
		| DB.MetadataValue['alternatives']
		| Array<{ value: RuntimeValue<Type>; confidence: number }>;
	cascadedFrom?: string[];
	abortSignal?: AbortSignal | undefined;
	sessionId?: string | undefined;
}) {
	if (!namespaceOfMetadataId(metadataId)) {
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
		confirmed,
		manuallyModified,
		isDefault,
		alternatives: !Array.isArray(alternatives)
			? alternatives
			: Object.fromEntries(
					alternatives.map(({ value, confidence }) => {
						if (confidence > 1) {
							console.warn(
								`Confidence ${confidence} of alternative ${value} is greater than 1, capping to 1`
							);
							confidence = 1;
						}

						return [serializeMetadataValue(value), confidence];
					})
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
	const session = await db.get('Session', subjectId);
	const imagesFromImageFile = await db
		.getAll('Image')
		.then((imgs) => imgs.filter(({ fileId }) => fileId === subjectId));

	abortSignal?.throwIfAborted();
	if (session) {
		if (session.metadata) {
			session.metadata[metadataId] = newValue;
		} else {
			session.metadata = { [metadataId]: newValue };
		}
		db.put('Session', session);
	} else if (image) {
		image.metadata[metadataId] = newValue;
		if (clearErrors && image.metadataErrors?.[metadataId]) {
			delete image.metadataErrors[metadataId];
		}
		db.put('Image', image);
	} else if (observation) {
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
				abortSignal
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
			sessionId,
			subjectId,
			manuallyModified,
			isDefault,
			confirmed,
			cascadedFrom: [...cascadedFrom, metadataId],
			abortSignal,
			clearErrors,
			...cascade
		});
	}

	// Only refresh table state once everything has been cascaded, meaning not inside recursive calls
	if (cascadedFrom.length === 0 && sessionId) {
		await refreshTables(sessionId, session ? 'Session' : image ? 'Image' : 'Observation');
	}
}

export async function storeMetadataErrors(
	{
		db,
		subjectId,
		sessionId,
		metadataId
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
					metadataId
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
	sessionId
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
					reactive: false
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
				reactive: false
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
