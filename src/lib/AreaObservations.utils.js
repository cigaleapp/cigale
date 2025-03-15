import { uiState } from '$lib/state.svelte';
import { toTopLeftCoords } from './BoundingBoxes.svelte';
import { idComparator } from './idb.svelte';

/**
 * @typedef CardObservation
 * @property {string} image
 * @property {string[]} [subimages]
 * @property {string} title
 * @property {string} id
 * @property {number} index
 * @property {number} stacksize
 * @property {number} [loading]
 * @property {object[]} [boundingBoxes] - array of bounding boxes
 * @property {number} boundingBoxes.x
 * @property {number} boundingBoxes.y
 * @property {number} boundingBoxes.width
 * @property {number} boundingBoxes.height
 */

/**
 * @import {Image, Observation} from './database'
 */

/**
 *
 * @param {Image[]} images
 * @param {Observation[]} observations
 * @param {object} param2
 * @param {(image: Image) => boolean} param2.isLoaded function to determine if an item has been loaded. For observations, they are loaded iff all their images are loaded.
 * @returns {CardObservation[]}
 */
export function toAreaObservationProps(images, observations, { isLoaded }) {
	return (
		[
			...images
				// Keep images that aren't part of any observation only
				.filter(({ id }) => !observations.some((observation) => observation.images.includes(id)))
				.map(
					(image, i) =>
						/**  @satisfies {CardObservation} */
						({
							image: uiState.getPreviewURL(image) ?? '',
							title: image.filename,
							id: image.id,
							index: i,
							stacksize: 1,
							loading: isLoaded(image) ? undefined : -1,
							boundingBoxes: image.metadata.crop?.value
								? // @ts-ignore
									[toTopLeftCoords(image.metadata.crop.value)]
								: []
						})
				),
			...observations.map((observation, i) => {
				const imagesOfObservation = images.filter((img) => observation.images.includes(img.id));
				const firstImage = imagesOfObservation.find(
					(i) => i.id === observation.images.toSorted(idComparator)[0]
				);

				/**  @satisfies {CardObservation} */
				return {
					image: uiState.getPreviewURL(firstImage) ?? '',
					subimages: observation.images.toSorted(idComparator),
					title: observation.label ?? `Observation ${firstImage?.filename ?? ''}`,
					index: images.length + i,
					id: observation.id,
					stacksize: imagesOfObservation.length,
					boundingBoxes: firstImage?.metadata.crop?.value
						? // @ts-ignore
							[toTopLeftCoords(firstImage.metadata.crop.value)]
						: [],
					loading: imagesOfObservation.every(isLoaded) ? undefined : -1
				};
			})
		]
			// Use last (lexicographically-wise) subimage's id to intersperse observations with images
			.sort((a, b) => {
				/** @param {CardObservation} x */
				const sortKey = (x) => x.subimages?.[x.subimages.length - 1] ?? x.id;

				return idComparator(sortKey(a), sortKey(b));
			})
			// Update index
			.map((x, i) => ({ ...x, index: i }))
	);
}
