<script lang="ts">
	import type { SelectedBox } from './+page.svelte';

	import { tables } from '$lib/idb.svelte.js';
	import { getSettings } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';

	import EditorImage from './CropSurface.svelte';
	import EditorAudio from './EditorAudio.svelte';

	interface Props {
		imageIsLoading: boolean;
		audioIsLoading: boolean;
		fileId: string;
		selectedBox: SelectedBox;
		showConfirmedOverlay: () => Promise<void>;
	}

	let {
		imageIsLoading = $bindable(),
		audioIsLoading = $bindable(),
		fileId,
		...rest
	}: Props = $props();

	const audiofile = $derived(tables.AudioFile.getFromState(fileId));

	$inspect('gorejoig jer !a&&i', !audiofile && imageIsLoading);
</script>

<div class="media-area">
	<!-- FIXME -->
	<!-- <div class="behind-image">
		{#if !audiofile && imageIsLoading}
			<LoadingSpinner --size="2em" />
			<p class="loading">Chargement de l'image…</p>
		{:else if audiofile && audioIsLoading}
			<LoadingSpinner --size="2em" />
			<p class="loading">Chargement de l'audio…</p>
		{:else}
			<p class="coucou" aria-hidden="true">
				coucou toi :)
				<br />
				passes une bonne journée ! 💖💖
			</p>
		{/if}
	</div> -->

	<div class="editor">
		{#if audiofile}
			<EditorAudio file={audiofile} bind:audioIsLoading {...rest} />
		{:else}
			<!-- TODO: make MediaArea handle its image element resize instead -->
			{#key getSettings().cropperSidebarCollapsed}
				<EditorImage
					fit="contain"
					imageSrc={uiState.getPreviewURL(fileId)}
					{fileId}
					bind:imageIsLoading
					{...rest}
				/>
			{/key}
		{/if}
	</div>
</div>

<style>
	.media-area {
		position: relative;

		height: 100%;
		width: 100%;

		.behind-image,
		.editor {
			position: absolute;

			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		}
	}

	.behind-image {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.behind-image .loading {
		margin-top: 1em;
		font-size: 1.2em;
	}

	.behind-image .coucou {
		text-align: center;
		font-size: 0.9em;
		color: var(--fg-primary);
	}
</style>
