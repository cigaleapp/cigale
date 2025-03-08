import { uiState } from '../routes/inference/state.svelte';
import { imageCompletelyLoaded } from './images';

/**
 *
 * @param {import("./database").Image[]} images
 * @param {import("./database").Observation[]} observations
 */
export function toAreaObservationProps(images, observations) {
	return [
		...images.map((image, i) => ({
			image: uiState.previewURLs.get(image.id) ?? '',
			title: image.filename,
			id: image.id,
			index: i,
			stacksize: 1,
			loading: imageCompletelyLoaded(image, uiState.previewURLs) ? undefined : -1,
			boundingBoxes: [image.metadata.crop.value] //pr l'instant, une seule bounding box par image
		})),
		...observations.map((observation, i) => {
			const imagesOfObservation = images.filter((img) => observation.images.includes(img.id));
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
