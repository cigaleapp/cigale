import * as db from './idb.svelte';
import { tables } from './idb.svelte';
import { deleteImage } from './images';
import { mergeMetadataValues } from './metadata';
import { uiState } from './state.svelte';

/**
 * @param {string[]} parts IDs of observations or images to merge
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
			label: observations[0]?.label ?? images[0]?.filename ?? 'Nouvelle observation',
			metadataOverrides: Object.fromEntries(
				Object.entries(await mergeMetadataValues(observations.map((o) => o.metadataOverrides))).map(
					([key, { value, ...rest }]) => [key, { ...rest, value: JSON.stringify(value) }]
				)
			)
		});

		for (const { id } of observations) {
			tx.delete(id);
		}
	});
}

/**
 *
 * @param {string} id observation ID
 * @param {object} [param1]
 * @param {boolean} [param1.recursive=false] Also delete the observation's images
 * @param {boolean} [param1.notFoundOk=true] Don't throw an error if the observation is not found
 * @param {import('./idb.svelte').IDBTransactionWithAtLeast<["Observation", "Image", "ImageFile"]>} [param1.tx]
 */
export async function deleteObservation(
	id,
	{ recursive = false, notFoundOk = true, tx = undefined } = {}
) {
	await db.openTransaction(['Observation', 'Image', 'ImageFile'], { tx }, async (tx) => {
		const observation = await tx.objectStore('Observation').get(id);
		if (!observation) {
			if (notFoundOk) return;
			throw 'Observation non trouvée';
		}

		tx.objectStore('Observation').delete(id);

		if (recursive) {
			for (const imageId of observation.images) {
				deleteImage(imageId, tx, notFoundOk);
			}
		}
	});
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
				const observationId = db.generateId('Observation');
				tx.objectStore('Observation').add({
					id: observationId,
					images: [image.id],
					addedAt: new Date().toISOString(),
					label: image.filename,
					metadataOverrides: {}
				});
				// Update ui selection so we don't have ghosts in preview side panel
				uiState.setSelection(
					uiState.selection.map((sel) => (sel === image.id ? observationId : sel))
				);
			}
		}
	});
}
