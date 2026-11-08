<script lang="ts">
	import type { Props as CardMediaProps } from './CardMedia.svelte';

	import { toTopLeftCoords } from '$lib/BoundingBoxes.svelte.js';
	import * as DB from '$lib/database.js';
	import { isDebugMode } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { nonnull } from '$lib/utils.js';

	import CardMedia from './CardMedia.svelte';

	interface Props extends CardMediaProps {
		fileId: string;
		/** all images with this fileId */
		images?: DB.Image[];
		/** all sounds with this fileId */
		sounds?: DB.Sound[];
		/** whether this file is highlighted */
		highlighted?: boolean;
	}

	const { fileId, sounds, images, highlighted = false, ...rest }: Props = $props();

	const status = $derived.by(() => {
		if (uiState.queuedImages.has(fileId)) return 'queued';
		if (uiState.loadingImages.has(fileId)) return 'loading';
		if (images?.some((img) => uiState.erroredImages.has(img.id))) return 'errored';
		if (sounds?.some((img) => uiState.erroredImages.has(img.id))) return 'errored';
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
	dimensions={images[0].dimensions}
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
