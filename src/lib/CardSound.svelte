<script lang="ts">
	import type { Props as CardMediaProps } from './CardMedia.svelte';
	import type * as DB from '$lib/database.js';

	import { spectrogramBoundingBoxDomains } from '$lib/audio/spectrogram.js';
	import { coordsFitter } from '$lib/BoundingBoxes.svelte.js';
	import { tables } from '$lib/idb.svelte.js';
	import { isDebugMode } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';

	import CardMedia from './CardMedia.svelte';

	interface Props extends CardMediaProps {
		sound: DB.Sound;
	}
	const { sound, highlighted = false, ...rest }: Props = $props();

	const status = $derived.by(() => {
		if (uiState.queuedImages.has(sound.id)) return 'queued';
		if (uiState.loadingImages.has(sound.id)) return 'loading';
		if (uiState.erroredImages.has(sound.id)) return 'errored';
		return 'ok';
	});

	const tooltip = $derived.by(() => {
		if (status === 'errored') return uiState.erroredImages.get(sound.id);
		if (isDebugMode())
			return `${sound.id} @ ${sound.addedAt.toISOString()} [${sound.sessionId}]`;
	});

	const audiofile = $derived(tables.AudioFile.getFromState(sound.fileId));

	const box = $derived(uiState.cropMetadataValueOf(sound));
</script>

<CardMedia
	id={sound.id}
	title={sound.filename}
	type="audio/x-unknown"
	// TODO: spectrogram of the audio file
	image={uiState.getPreviewURL(sound.fileId)}
	dimensions={audiofile?.spectrogram.imageDimensions}
	selected={uiState.selection.includes(sound.id)}
	{audiofile}
	boundingBoxes={box ? [box] : []}
	boxes="show-all"
	{tooltip}
	{status}
	{highlighted}
	{...rest}
/>
