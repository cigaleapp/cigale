<script lang="ts">
	import { toTopLeftCoords } from './BoundingBoxes.svelte.js';
	import CardMedia from './CardMedia.svelte';
	import { isDebugMode } from './settings.svelte.js';
	import { uiState } from './state.svelte.js';
	import { nonnull } from './utils.js';

	/**
	 * @typedef {object} Props
	 * @property {import('$lib/database').Observation} observation
	 * @property {import('$lib/database').Image[]} images the images of the observation
	 * @property {boolean} [highlighted] - whether this image is highlighted
	 */

	/** @type { Omit< Partial<import('$lib/CardMedia.svelte').Props>, keyof Props> & Props} */
	const { observation, images, highlighted = false, ...rest } = $props();

	const status = $derived.by(() => {
		if (images.some(({ id }) => uiState.queuedImages.has(id))) return 'queued';
		if (images.some(({ id }) => uiState.loadingImages.has(id))) return 'loading';
		if (images.some(({ id }) => uiState.erroredImages.has(id))) return 'errored';
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
			return `${observation.id} @ ${observation.addedAt.toISOString()} [${observation.sessionId}]`;
	});

	const previewImage = $derived(images.length > 0 ? images[0] : undefined);
</script>

<CardMedia
	id={observation.id}
	title={observation.label}
	image={previewImage?.fileId ? uiState.getPreviewURL(previewImage.fileId) : undefined}
	selected={uiState.selection.includes(observation.id)}
	stacksize={observation.images.length}
	boxes="apply-first"
	{tooltip}
	{status}
	{highlighted}
	{...rest}
	boundingBoxes={images
		.map((img) => uiState.cropMetadataValueOf(img)?.value)
		.filter(nonnull)
		.map((box) => toTopLeftCoords(box))}
/>
