import * as db from './idb.svelte';
import { tables } from './idb.svelte';
import { deleteImageFile, imageFileIds } from './images';
import { mergeMetadataValues } from './metadata';
import { uiState } from './state.svelte';

/**
 * @param {string[]} parts IDs of observations or images to merge
 * @returns {Promise<string>} the ID of the new observation
 */
export async function mergeToObservation(parts) {
	const observations = parts
		.map((part) => tables.Observation.state.find((o) => o.id === part))
		.filter((o) => o !== undefined);

	const images = parts
		.map((part) => tables.Image.state.find((i) => i.id === part))
		.filter((i) => i !== undefined);

	const imageIds = new Set(observations.flatMap((o) => o.images)).union(
		new Set(images.map((i) => i.id))
	);

	const newId = db.generateId('Observation');

	await tables.Observation.do(async (tx) => {
		tx.add({
			id: newId,
			images: [...imageIds],
			addedAt: new Date().toISOString(),
			label: defaultObservationLabel([...observations, ...images]),
			metadataOverrides: Object.fromEntries(
				Object.entries(
					await mergeMetadataValues(
						db.databaseHandle(),
						observations.map((o) => o.metadataOverrides)
					)
				).map(([key, { value, ...rest }]) => [key, { ...rest, value: JSON.stringify(value) }])
			)
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
 * @param {Array<{ label: string } | { filename: string }>} parts
 * @return {string} computed default label for the new observation
 */
function defaultObservationLabel(parts) {
	// TODO allow user to provide a template string here
	for (const part of parts) {
		if ('label' in part) return part.label;
		if ('filename' in part) return part.filename.replace(/\.[^.]+$/, '');
	}
	return 'Nouvelle observation';
}

/**
 *
 * @param {{ id: string, filename: string }} image
 * @returns
 */
export function newObservation(image) {
	const observationId = db.generateId('Observation');
	return {
		id: observationId,
		images: [image.id],
		addedAt: new Date().toISOString(),
		label: defaultObservationLabel([image]),
		metadataOverrides: {}
	};
}

/**
 * If there are any images that are not inside any observation, create an observation with a single image for each
 * @param {import('./idb.svelte').IDBTransactionWithAtLeast<["Observation", "Image"]>} [tx] reuse an existing transaction
 */
export async function ensureNoLoneImages(tx) {
	await db.openTransaction(['Observation', 'Image'], { tx }, async (tx) => {
		const images = await tx.objectStore('Image').getAll();
		const observations = await tx.objectStore('Observation').getAll();

		for (const image of images) {
			if (!observations.some((o) => o.images.includes(image.id))) {
				const newObs = newObservation(image);
				tx.objectStore('Observation').add(newObs);
				// Update ui selection so we don't have ghosts in preview side panel
				uiState.setSelection?.(
					uiState.selection.map((sel) => (sel === image.id ? newObs.id : sel))
				);
			}
		}
	});
}
