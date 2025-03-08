import { uiState } from '$lib/state.svelte';
import { imageCompletelyLoaded } from './images';

/**
 * @typedef CardObservation
 * @property {string} image
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
 *
 * @param {import("./database").Image[]} images
 * @param {import("./database").Observation[]} observations
 * @returns {CardObservation[]}
 */
export function toAreaObservationProps(images, observations) {
	return [
		...images
			// Keep images that aren't part of any observation only
			.filter(({ id }) => !observations.some((observation) => observation.images.includes(id)))
			.map(
				(image, i) =>
					/**  @satisfies {CardObservation} */
					({
						image: uiState.previewURLs.get(image.id) ?? '',
						title: image.filename,
						id: image.id,
						index: i,
						stacksize: 1,
						loading: imageCompletelyLoaded(image, uiState.previewURLs) ? undefined : -1
					})
			),
		...observations.map((observation, i) => {
			const imagesOfObservation = images.filter((img) => observation.images.includes(img.id));

			/**  @satisfies {CardObservation} */
			return {
				image: uiState.previewURLs.get(observation.images[0] ?? '') ?? '',
				title: observation.label ?? `Observation ${imagesOfObservation[0]?.filename ?? ''}`,
				index: images.length + i,
				id: observation.id,
				stacksize: imagesOfObservation.length,
				loading: imagesOfObservation.every((img) => imageCompletelyLoaded(img, uiState.previewURLs))
					? undefined
					: -1
			};
		})
	];
}
