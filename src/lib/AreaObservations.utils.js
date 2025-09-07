import { uiState } from '$lib/state.svelte';
import { toTopLeftCoords } from './BoundingBoxes.svelte';
import { idComparator } from './database';
import { imagesByImageFile } from './images';

/**
 * @typedef CardObservation
 * @property {Date} addedAt
 * @property {string} image
 * @property {string[]} [subimages]
 * @property {string} title
 * @property {string} id
 * @property {boolean} [virtual=false] whether the observation/image is virtual, ie not stored in the database yet. This causes us to append a `_virtual` suffix to the {#each} block's key, without changing the ID itself. Needed because we have a brief moment where both the in-DB newly created image exists _and_ the virtual one hasn't been removed yet. Not differentiating the key results in a Svelte error (duplicate key in {#each} block)
 * @property {number} index
 * @property {number} stacksize
 * @property {number|undefined} [loading]
 * @property {boolean} [selectable=true] - whether the card is selectable
 * @property {boolean} [applyBoundingBoxes] - whether the bounding boxes should be applied to the image
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
 * @param {(imageOrFileId: Image | string) => boolean} param2.isQueued function to determine if an item is waiting on the processing queue. For observations, they are queued iff all their images are loaded.
 * @param {(fileId: string|undefined) => boolean} [param2.showBoundingBoxes] show bounding boxes. If false, the bounding boxes will be applied instead.
 * @param {(fileId: string|undefined) => boolean} [param2.applyBoundingBoxes] apply bounding boxes.
 * @returns {CardObservation[]}
 */
export function toAreaObservationProps(
	imageFileIds,
	images,
	observations,
	{ isLoaded, isQueued, showBoundingBoxes, applyBoundingBoxes }
) {
	/**
	 *
	 * @param {Image|string} item
	 * @returns
	 */
	const previewURL = (item) =>
		uiState.getPreviewURL(typeof item === 'string' ? item : item?.fileId);
	showBoundingBoxes ??= () => true;
	applyBoundingBoxes ??= () => true;
	const imagesOfFiles = imagesByImageFile(imageFileIds);
	return (
		[
			...imageFileIds
				// Keep images that aren't part of any observation only
				.filter((id) => !observations.some((observation) => observation.images.includes(id)))
				.map((fileId, i) => {
					const images = imagesOfFiles.get(fileId);
					const boxes = images
						?.map((img) => uiState.cropMetadataValueOf(img))
						.filter((box) => box !== undefined)
						.map(({ value }) => toTopLeftCoords(value));

					return /**  @satisfies {CardObservation} */ ({
						addedAt: images?.[0]?.addedAt ?? new Date(),
						image: previewURL(fileId) ?? '',
						title: images?.at(0)?.filename ?? '',
						id: fileId,
						index: i,
						stacksize: 1,
						loading: isLoaded(fileId) ? undefined : isQueued(fileId) ? -Infinity : +Infinity,
						applyBoundingBoxes: !showBoundingBoxes(fileId) && applyBoundingBoxes(fileId),
						boundingBoxes:
							showBoundingBoxes(fileId) || applyBoundingBoxes(fileId) ? (boxes ?? []) : []
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
					const boxes = applyBoundingBoxes(img.fileId ?? undefined)
						? 'apply'
						: showBoundingBoxes(img.fileId ?? undefined)
							? 'show'
							: 'none';

					const box = uiState.cropMetadataValueOf(img);
					return /**  @satisfies {CardObservation} */ ({
						image: previewURL(img) ?? '',
						addedAt: img.addedAt,
						title: img.filename,
						id: img.id,
						index: imageFileIds.length + i,
						stacksize: 1,
						loading: isLoaded(img) ? undefined : isQueued(img) ? -Infinity : +Infinity,
						applyBoundingBoxes: boxes === 'apply',
						boundingBoxes: box && boxes !== 'none' ? [toTopLeftCoords(box.value)] : []
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
					.map((img) => uiState.cropMetadataValueOf(img))
					.filter((metadata) => metadata !== undefined)
					.map(({ value }) => toTopLeftCoords(value));

				const boxes = applyBoundingBoxes(firstImage?.fileId ?? undefined)
					? 'apply'
					: showBoundingBoxes(firstImage?.fileId ?? undefined)
						? 'show'
						: 'none';

				/**  @satisfies {CardObservation} */
				return {
					addedAt: observation.addedAt,
					image: firstImage?.fileId ? (previewURL(firstImage?.fileId) ?? '') : '',
					subimages: observation.images.toSorted(idComparator),
					title: observation.label ?? `Observation ${firstImage?.filename ?? ''}`,
					index: imageFileIds.length + images.length + i,
					id: observation.id,
					stacksize: imagesOfObservation.length,
					applyBoundingBoxes: boxes === 'apply',
					boundingBoxes: boxes !== 'none' && firstImage?.fileId ? (boundingBoxes ?? []) : [],
					loading: imagesOfObservation.every(isLoaded)
						? undefined
						: imagesOfObservation.every(isQueued)
							? -Infinity
							: +Infinity
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
