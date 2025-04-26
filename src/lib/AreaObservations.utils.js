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
 * @property {number|undefined} [loading]
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
 * @param {(image: Image|undefined) => string | undefined} [param2.previewURL] show cropped versions of images on cards where possible.
 * @param {(image: Image|undefined) => boolean} [param2.showBoundingBoxes] show bounding boxes
 * @returns {CardObservation[]}
 */
export function toAreaObservationProps(
	images,
	observations,
	{ isLoaded, previewURL, showBoundingBoxes }
) {
	previewURL ??= (image) => uiState.getPreviewURL(image);
	showBoundingBoxes ??= () => true;
	return (
		[
			...images
				// Keep images that aren't part of any observation only
				.filter(({ id }) => !observations.some((observation) => observation.images.includes(id)))
				.map((image, i) => {
					return /**  @satisfies {CardObservation} */ ({
						image: previewURL(image) ?? '',
						title: image.filename,
						id: image.id,
						index: i,
						stacksize: 1,
						loading: isLoaded(image) ? undefined : -1,
						boundingBoxes:
							showBoundingBoxes(image) && image.metadata[uiState.cropMetadataId]?.value
								? // @ts-ignore
									image.metadata[uiState.cropMetadataId].value.map(ToTopLeftCoords)
								: []
					});
				}),
			...observations.map((observation, i) => {
				const imagesOfObservation = images.filter((img) => observation.images.includes(img.id));
				const firstImage = imagesOfObservation.find(
					(i) => i.id === observation.images.toSorted(idComparator)[0]
				);

				/**  @satisfies {CardObservation} */
				return {
					image: previewURL(firstImage) ?? '',
					subimages: observation.images.toSorted(idComparator),
					title: observation.label ?? `Observation ${firstImage?.filename ?? ''}`,
					index: images.length + i,
					id: observation.id,
					stacksize: imagesOfObservation.length,
					boundingBoxes:
						showBoundingBoxes(firstImage) && firstImage?.metadata[uiState.cropMetadataId]?.value
							? // @ts-ignore
								firstImage.metadata[uiState.cropMetadataId].value.map(ToTopLeftCoords)
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
