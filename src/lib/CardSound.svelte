<script lang="ts">
	import type { Props as CardMediaProps } from './CardMedia.svelte';
	import type * as DB from '$lib/database.js';

	import { tables } from '$lib/idb.svelte.js';
	import { isDebugMode } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';

	import CardMedia from './CardMedia.svelte';

	interface Props extends CardMediaProps {
		sound: DB.Sound;
		/** whether this sound is highlighted*/
		highlighted?: boolean;
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

	const audiofile = $derived(
		tables.AudioFile.getFromState(sound.fileId)
	)
</script>

<CardMedia
	id={sound.id}
	title={sound.filename}
	// TODO: take crops into account
	duration={audiofile?.dimensions.duration}
	type="audio/x-unknown"
	// TODO: spectrogram of the audio file
	image={uiState.getPreviewURL(sound.fileId)}
	dimensions={audiofile?.spectrogram.imageDimensions}
	selected={uiState.selection.includes(sound.id)}
	boundingBoxes={[]}
	boxes="show-all"
	{tooltip}
	{status}
	{highlighted}
	{...rest}
/>
