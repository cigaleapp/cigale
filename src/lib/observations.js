import * as db from './idb.svelte';
import { generateId } from '$lib/database.js';
import { tables } from './idb.svelte';
import { deleteImageFile, imageFileIds } from './images';
import { mergeMetadataValues } from './metadata';
import { uiState } from './state.svelte';
import { nonnull } from './utils';

/**
 * @param {string[]} parts IDs of observations or images to merge
 * @returns {Promise<string>} the ID of the new observation
 */
export async function mergeToObservation(parts) {
	const protocol = uiState.currentProtocol;
	if (!protocol) throw new Error('No protocol selected');

	const observations = parts.map((part) => tables.Observation.getFromState(part)).filter(nonnull);

	const images = await Promise.all(parts.map(async (part) => tables.Image.raw.get(part))).then(
		(imgs) => imgs.filter(nonnull)
	);

	const imageIds = new Set(observations.flatMap((o) => o.images)).union(
		new Set(images.map((i) => i.id))
	);

	const newId = generateId('Observation');

	await tables.Observation.do(async (tx) => {
		const observation = {
			id: newId,
			images: [...imageIds],
			addedAt: new Date().toISOString(),
			label: fallbackObservationLabel([...observations, ...images]),
			metadataOverrides: Object.fromEntries(
				Object.entries(
					await mergeMetadataValues(
						db.databaseHandle(),
						observations.map((o) => o.metadataOverrides)
					)
				).map(([key, { value, ...rest }]) => [
					key,
					{ ...rest, value: JSON.stringify(value) }
				])
			)
		};

		tx.add({
			...observation,
			label: defaultObservationLabel({ protocol, images, observation })
		});

		for (const { id } of observations) {
			tx.delete(id);
		}
	});

	return newId;
}

/**
 *
 * @param {string} id observation ID
 * @param {object} [param1]
 * @param {boolean} [param1.recursive=false] Also delete the observation's images
 * @param {boolean} [param1.notFoundOk=true] Don't throw an error if the observation is not found
 * @param {import('./idb.svelte').IDBTransactionWithAtLeast<["Observation", "Image", "ImageFile", "ImagePreviewFile"]>} [param1.tx]
 */
export async function deleteObservation(
	id,
	{ recursive = false, notFoundOk = true, tx = undefined } = {}
) {
	await db.openTransaction(
		['Observation', 'Image', 'ImageFile', 'ImagePreviewFile'],
		{ tx },
		async (tx) => {
			const observation = await tx.objectStore('Observation').get(id);
			if (!observation) {
				if (notFoundOk) return;
				throw 'Observation non trouvée';
			}

			tx.objectStore('Observation').delete(id);

			const images = await tx
				.objectStore('Image')
				.getAll()
				.then((images) => images.filter((i) => observation.images.includes(i.id)));

			if (recursive) {
				for (const fileId of imageFileIds(images)) {
					await deleteImageFile(fileId, tx, notFoundOk);
				}
			}

			uiState.erroredImages.delete(id);
		}
	);
}

/**
 * @param {object} arg0
 * @param {Array<typeof import('$lib/database').Schemas.Image.inferIn>} arg0.images
 * @param {typeof import('$lib/database').Schemas.Observation.inferIn} arg0.observation
 * @param {import('$lib/database').Protocol} arg0.protocol
 * @returns {string} computed default label for the new observation
 */
function defaultObservationLabel({ images, observation, protocol }) {
	return (
		protocol?.observations?.defaultLabel?.render({ images, observation }) ??
		fallbackObservationLabel([observation, ...images])
	);
}

/**
 * @param {Array<{ filename: string} | {label: string}>} parts
 * @returns {string} computed fallback label for the new observation
 */
function fallbackObservationLabel(parts) {
	for (const part of parts) {
		if ('label' in part) return part.label;
		if ('filename' in part) return part.filename.replace(/\.[^.]+$/, '');
	}
	return 'Nouvelle observation';
}

/**
 *
 * @param {typeof import('$lib/database').Schemas.Image.inferIn} image
 * @param {import('$lib/database').Protocol} protocol
 * @returns {typeof import('$lib/database').Schemas.Observation.inferIn}
 */
export function newObservation(image, protocol) {
	const observationId = generateId('Observation');
	const newObs = {
		id: observationId,
		images: [image.id],
		addedAt: new Date().toISOString(),
		label: fallbackObservationLabel([image]),
		metadataOverrides: {}
	};

	return {
		...newObs,
		label: defaultObservationLabel({ images: [image], observation: newObs, protocol })
	};
}

/**
 * If there are any images that are not inside any observation, create an observation with a single image for each
 * @param {import('./idb.svelte').IDBTransactionWithAtLeast<["Observation", "Image"]>} [tx] reuse an existing transaction
 */
export async function ensureNoLoneImages(tx) {
	const protocol = uiState.currentProtocol;
	if (!protocol) throw new Error('No protocol selected');
	await db.openTransaction(['Observation', 'Image'], { tx }, async (tx) => {
		const images = await tx.objectStore('Image').getAll();
		const observations = await tx.objectStore('Observation').getAll();

		for (const image of images) {
			if (!observations.some((o) => o.images.includes(image.id))) {
				const newObs = newObservation(image, protocol);
				tx.objectStore('Observation').add(newObs);
				// Update ui selection so we don't have ghosts in preview side panel
				uiState.setSelection?.(
					uiState.selection.map((sel) => (sel === image.id ? newObs.id : sel))
				);
			}
		}
	});
}
