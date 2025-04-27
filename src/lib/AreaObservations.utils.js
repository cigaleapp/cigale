import { uiState } from '$lib/state.svelte';
import { toTopLeftCoords } from './BoundingBoxes.svelte';
import { idComparator } from './idb.svelte';
import { imagesByImageFile } from './images';
import { assertIs } from './metadata';

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
 * @param {string[]} imageFileIds
 * @param {Image[]} images
 * @param {Observation[]} observations
 * @param {object} param2
 * @param {(imageOrFileId: Image | string) => boolean} param2.isLoaded function to determine if an item has been loaded. For observations, they are loaded iff all their images are loaded.
 * @param {(imageOrFileId: Image | string|undefined) => string | undefined} [param2.previewURL] show cropped versions of images on cards where possible.
 * @param {(fileId: string|undefined) => boolean} [param2.showBoundingBoxes] show bounding boxes
 * @returns {CardObservation[]}
 */
export function toAreaObservationProps(
	imageFileIds,
	images,
	observations,
	{ isLoaded, previewURL, showBoundingBoxes }
) {
	previewURL ??= (item) => uiState.getPreviewURL(typeof item === 'string' ? item : item?.fileId);
	showBoundingBoxes ??= () => true;
	const imagesOfFiles = imagesByImageFile(imageFileIds);
	return (
		[
			...imageFileIds
				// Keep images that aren't part of any observation only
				.filter((id) => !observations.some((observation) => observation.images.includes(id)))
				.map((fileId, i) => {
					const image = imagesOfFiles.get(fileId);
					return /**  @satisfies {CardObservation} */ ({
						image: previewURL(fileId) ?? '',
						title: image?.at(0)?.filename ?? '',
						id: fileId,
						index: i,
						stacksize: 1,
						loading: isLoaded(fileId) ? undefined : -1,
						boundingBoxes:
							showBoundingBoxes(fileId) && image
								? image
										.filter(({ metadata }) => metadata[uiState.cropMetadataId])
										.map(({ metadata }) =>
											toTopLeftCoords(
												assertIs('boundingbox', metadata[uiState.cropMetadataId].value)
											)
										)
								: []
					});
				}),
			// Keep images that are not part of any observation and don't have their fileId in imageFileIds
			...images
				.filter(
					(img) =>
						img.fileId &&
						!imageFileIds.includes(img.fileId) &&
						!observations.some((observation) => observation.images.includes(img.id))
				)
				.map((img, i) => {
					return /**  @satisfies {CardObservation} */ ({
						image: previewURL(img) ?? '',
						title: img.filename,
						id: img.id,
						index: imageFileIds.length + i,
						stacksize: 1,
						loading: img.fileId && isLoaded(img) ? undefined : -1,
						boundingBoxes:
							img.fileId && showBoundingBoxes(img.fileId) && img.metadata[uiState.cropMetadataId]
								? [
										toTopLeftCoords(
											assertIs('boundingbox', img.metadata[uiState.cropMetadataId].value)
										)
									]
								: []
					});
				}),
			...observations.map((observation, i) => {
				const imagesOfObservation = [...imagesOfFiles.values(), ...images]
					.flat()
					.filter((img) => observation.images.includes(img.id));
				const firstImage = imagesOfObservation.find(
					(i) => i.id === observation.images.toSorted(idComparator)[0]
				);
				const boundingBoxes = imagesOfObservation
					?.filter(
						({ metadata, fileId }) =>
							fileId === firstImage?.fileId && metadata[uiState.cropMetadataId]?.value
					)
					.map(({ metadata }) =>
						toTopLeftCoords(assertIs('boundingbox', metadata[uiState.cropMetadataId].value))
					);

				/**  @satisfies {CardObservation} */
				return {
					image: firstImage?.fileId ? (previewURL(firstImage?.fileId) ?? '') : '',
					subimages: observation.images.toSorted(idComparator),
					title: observation.label ?? `Observation ${firstImage?.filename ?? ''}`,
					index: imageFileIds.length + images.length + i,
					id: observation.id,
					stacksize: imagesOfObservation.length,
					boundingBoxes:
						firstImage?.fileId && showBoundingBoxes(firstImage?.fileId)
							? (boundingBoxes ?? [])
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
