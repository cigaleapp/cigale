<script lang="ts">
	import type { Props as CardMediaProps } from './CardMedia.svelte';
	import type * as DB from '$lib/database.js';

	import CardMedia from './CardMedia.svelte';
	import { isDebugMode } from './settings.svelte.js';
	import { uiState } from './uistate.svelte.js';

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
</script>

<CardMedia
	id={sound.id}
	title={sound.filename}
	type="audio/x-unknown"
	// TODO: spectrogram of the audio file
	image={uiState.getPreviewURL(sound.fileId)}
	dimensions={undefined}
	selected={uiState.selection.includes(sound.id)}
	boundingBoxes={[]}
	boxes="show-all"
	{tooltip}
	{status}
	{highlighted}
	{...rest}
/>
