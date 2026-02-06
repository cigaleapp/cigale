import { generateId } from '$lib/database.js';

import * as db from './idb.svelte.js';
import { tables } from './idb.svelte.js';
import { deleteImageFile, imageFileIds } from './images.js';
import {
	mergeMetadataFromImagesAndObservations,
	serializeMetadataFullValue
} from './metadata/index.js';
import { uiState } from './state.svelte.js';
import { compareBy, mapValues, nonnull } from './utils.js';

/**
 * @import * as DB from '$lib/database.js'
 * @import { DatabaseHandle } from '$lib/idb.svelte.js'
 */

/**
 * @param {string[]} parts IDs of observations or images to merge
 * @returns {Promise<string>} the ID of the new observation
 */
export async function mergeToObservation(parts) {
	const protocol = uiState.currentProtocol;
	if (!protocol) throw new Error('No protocol selected');

	const sessionId = uiState.currentSession?.id;
	if (!sessionId) throw new Error('No session selected');

	const observations = parts.map((part) => tables.Observation.getFromState(part)).filter(nonnull);

	const images = await Promise.all(parts.map(async (part) => tables.Image.raw.get(part))).then(
		(imgs) => imgs.filter(nonnull)
	);

	const imageIds = new Set(observations.flatMap((o) => o.images)).union(
		new Set(images.map((i) => i.id))
	);

	const newId = generateId('Observation');

	const observation = {
		id: newId,
		sessionId,
		images: [...imageIds].toSorted(compareBy((id) => parts.indexOf(id))),
		addedAt: new Date().toISOString(),
		label: fallbackObservationLabel([...observations, ...images]),
		metadataOverrides: mapValues(
			mergeMetadataFromImagesAndObservations({
				definitions: tables.Metadata.state,
				images: [],
				observations
			}),
			serializeMetadataFullValue
		)
	};

	observation.label = defaultObservationLabel({ protocol, images, observation });

	await tables.Observation.do((tx) => {
		tx.add(observation);
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
		protocol?.observations?.defaultLabel?.render({ images, observation }) ||
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
 * @param {import('$lib/database').Session} session
 * @returns {typeof import('$lib/database').Schemas.Observation.inferIn}
 */
export function newObservation(image, protocol, session) {
	const observationId = generateId('Observation');
	const newObs = {
		id: observationId,
		sessionId: session.id,
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
	const session = uiState.currentSession;
	const protocol = uiState.currentProtocol;
	if (!protocol) throw new Error('No protocol selected');
	if (!session) throw new Error('No session selected');

	await db.openTransaction(['Observation', 'Image'], { tx }, async (tx) => {
		const images = await tx.objectStore('Image').index('sessionId').getAll(session.id);
		const observations = await tx
			.objectStore('Observation')
			.index('sessionId')
			.getAll(session.id);

		for (const image of images) {
			if (!observations.some((o) => o.images.includes(image.id))) {
				const newObs = newObservation(image, protocol, session);
				tx.objectStore('Observation').add(newObs);
				// Update ui selection so we don't have ghosts in preview side panel
				uiState.setSelection?.(
					uiState.selection.map((sel) => (sel === image.id ? newObs.id : sel))
				);
			}
		}
	});
}

/**
 * Gets all metadata for an observation, including metadata derived from merging the metadata values of the images that make up the observation.
 * @param {object} arg0
 * @param {DB.Metadata[]} arg0.definitions
 * @param {Pick<DB.Observation, 'images' | 'metadataOverrides'>} arg0.observation
 * @param {DB.Image[]} arg0.images
 * @returns {DB.MetadataValues}
 */
export function observationMetadata({ definitions, observation, images }) {
	const metadataFromImages = mergeMetadataFromImagesAndObservations({
		definitions,
		observations: [],
		images: images
			.filter(({ id }) => observation.images.includes(id))
			.toSorted(compareBy(({ id }) => observation.images.indexOf(id)))
	});

	return {
		...metadataFromImages,
		...observation.metadataOverrides
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const {  metadatas, items, values } = await import('./metadata/_testdata.js')

	/**
	 * @type {DB.Image[]}
	 */
	const images = items.map(({id, metadata}) => ({
		id, 
		filename:  id + ".jpg",
		metadata,
		sessionId: 'session1',
		addedAt: new Date(),
		boundingBoxesAnalyzed: true,
		contentType: "image/jpeg",
		dimensions: { width: 100, height: 100, aspectRatio: 1 },
		fileId: 'file_' + id
	}))

	describe('observationMetadata', () => {
		it('merges metadata from images and observation overrides', () => {
			const observation = {
				images: items.slice(0, 2).map(({id}) => id),
				metadataOverrides: {
					[metadatas.enum.id]: {
						...items[0].metadata.enum,
						value: 'A'
					}
				}
			}

			expect(observationMetadata({
				definitions: Object.values(metadatas),
				observation,
				images,
			})).toMatchInlineSnapshot(`
				{
				  "metadata_date": {
				    "alternatives": {},
				    "confidence": 1,
				    "confirmed": false,
				    "manuallyModified": false,
				    "merged": true,
				    "value": 2023-01-01T12:00:15.000Z,
				  },
				  "metadata_enum ": {
				    "value": "A",
				  },
				  "metadata_float": {
				    "alternatives": {},
				    "confidence": 1,
				    "confirmed": false,
				    "manuallyModified": false,
				    "merged": true,
				    "value": 10.124500000000001,
				  },
				  "metadata_integer": {
				    "alternatives": {},
				    "confidence": 1,
				    "confirmed": false,
				    "manuallyModified": false,
				    "merged": false,
				    "value": 10,
				  },
				}
			`)
		})
	})
}
