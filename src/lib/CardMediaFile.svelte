<script lang="ts">
	import type { Props as CardMediaProps } from './CardMedia.svelte';

	import { toTopLeftCoords } from '$lib/BoundingBoxes.svelte.js';
	import * as DB from '$lib/database.js';
	import { tables } from '$lib/idb.svelte.js';
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
	}

	const { fileId, sounds = [], images = [], highlighted = false, ...rest }: Props = $props();

	const medias = $derived([...images, ...sounds]);

	const status = $derived.by(() => {
		if (uiState.queuedImages.has(fileId)) return 'queued';
		if (uiState.loadingImages.has(fileId)) return 'loading';
		if (images?.some((img) => uiState.erroredImages.has(img.id))) return 'errored';
		if (sounds?.some((img) => uiState.erroredImages.has(img.id))) return 'errored';
		return 'ok';
	});

	const tooltip = $derived.by(() => {
		if (status === 'errored') {
			return medias
				.map(({ id }) => uiState.erroredImages.get(id))
				.filter(nonnull)
				.join('; ');
		}

		if (isDebugMode())
			return `${fileId} @ ${medias[0]?.addedAt.toISOString()} [${medias[0]?.sessionId}]`;
	});

	const audiofile = $derived(tables.AudioFile.getFromState(fileId));

	const dimensions = $derived.by(() => {
		const media = medias.at(0);
		if (!media) return undefined;

		switch (media._table) {
			case 'Audio':
				return audiofile?.spectrogram.imageDimensions;
			case 'Image':
				return media.dimensions;
		}
	});
</script>

<CardMedia
	id={fileId}
	title={medias[0].filename}
	image={uiState.getPreviewURL(fileId)}
	{dimensions}
	{audiofile}
	selected={uiState.selection.includes(fileId)}
	boxes="show-all"
	{tooltip}
	{status}
	{highlighted}
	{...rest}
	boundingBoxes={medias
		.map((img) => uiState.cropMetadataValueOf(img)?.value)
		.filter(nonnull)
		.map((box) => toTopLeftCoords(box))}
/>
