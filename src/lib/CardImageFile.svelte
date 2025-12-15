<script lang="ts">
	import { toTopLeftCoords } from './BoundingBoxes.svelte.js';
	import CardMedia from './CardMedia.svelte';
	import { isDebugMode } from './settings.svelte.js';
	import { uiState } from './state.svelte.js';
	import { nonnull } from './utils.js';

	/**
	 * @typedef {object} Props
	 * @property {string} fileId
	 * @property {import('$lib/database').Image[]} images all images with this fileId
	 * @property {boolean} [highlighted] - whether this image is highlighted
	 */

	/** @type { Omit< Partial<import('$lib/CardMedia.svelte').Props>, keyof Props> & Props} */
	const { fileId, images, highlighted = false, ...rest } = $props();

	const status = $derived.by(() => {
		if (uiState.queuedImages.has(fileId)) return 'queued';
		if (uiState.loadingImages.has(fileId)) return 'loading';
		if (images.some((img) => uiState.erroredImages.has(img.id))) return 'errored';
		return 'ok';
	});

	const tooltip = $derived.by(() => {
		if (status === 'errored') {
			return images
				.map(({ id }) => uiState.erroredImages.get(id))
				.filter(nonnull)
				.join('; ');
		}

		if (isDebugMode())
			return `${fileId} @ ${images[0]?.addedAt.toISOString()} [${images[0]?.sessionId}]`;
	});
</script>

<CardMedia
	id={fileId}
	title={images[0].filename}
	image={uiState.getPreviewURL(fileId)}
	selected={uiState.selection.includes(fileId)}
	boxes="show-all"
	{tooltip}
	{status}
	{highlighted}
	{...rest}
	boundingBoxes={images
		.map((img) => uiState.cropMetadataValueOf(img)?.value)
		.filter(nonnull)
		.map((box) => toTopLeftCoords(box))}
/>
