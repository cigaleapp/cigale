<script lang="ts">
	import { toTopLeftCoords } from './BoundingBoxes.svelte';
	import CardMedia from './CardMedia.svelte';
	import { isDebugMode } from './settings.svelte.js';
	import { uiState } from './state.svelte.js';

	/**
	 * @typedef {object} Props
	 * @property {import('$lib/database').Image & { fileId: string }} image
	 * @property {boolean} [highlighted] - whether this image is highlighted
	 */

	/** @type { Omit<Partial<import('$lib/CardMedia.svelte').Props>, keyof Props> & Props} */
	const { image, highlighted = false, ...rest } = $props();

	const status = $derived.by(() => {
		if (uiState.queuedImages.has(image.id)) return 'queued';
		if (uiState.loadingImages.has(image.id)) return 'loading';
		if (uiState.erroredImages.has(image.id)) return 'errored';
		return 'ok';
	});

	const tooltip = $derived.by(() => {
		if (status === 'errored') return uiState.erroredImages.get(image.id);
		if (isDebugMode())
			return `${image.id} @ ${image.addedAt.toISOString()} [${image.sessionId}]`;
	});

	const cropbox = $derived.by(() => uiState.cropMetadataValueOf(image)?.value);
</script>

<CardMedia
	id={image.id}
	title={image.filename}
	image={uiState.getPreviewURL(image.fileId)}
	selected={uiState.selection.includes(image.id)}
	boundingBoxes={cropbox ? [toTopLeftCoords(cropbox)] : []}
	boxes="show-all"
	{tooltip}
	{status}
	{highlighted}
	{...rest}
/>
