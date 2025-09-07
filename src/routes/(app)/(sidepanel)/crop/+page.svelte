<script>
	import { goto } from '$app/navigation';
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import * as idb from '$lib/idb.svelte.js';
	import { deleteImageFile, imageFileIds, imageIdToFileId, imageIsAnalyzed } from '$lib/images';
	import { deleteObservation } from '$lib/observations.js';
	import { m } from '$lib/paraglide/messages.js';
	import { cancelTask, detectMore } from '$lib/queue.svelte.js';
	import { seo } from '$lib/seo.svelte';
	import { getSettings } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { nonnull } from '$lib/utils.js';
	import { watch } from 'runed';
	import { onMount } from 'svelte';

	seo({ title: 'Recadrer' });

	$effect(() => {
		uiState.imageOpenedInCropper = '';
	});

	const images = $derived(
		toAreaObservationProps(imageFileIds(idb.tables.Image.state), [], [], {
			isLoaded: (fileId) =>
				!uiState.cropInferenceAvailable ||
				Boolean(
					typeof fileId === 'string' &&
						uiState.hasPreviewURL(fileId) &&
						imageIsAnalyzed(uiState.currentProtocol, fileId)
				),
			isQueued: (fileId) => typeof fileId === 'string' && uiState.queuedImages.has(fileId)
		})
	);

	onMount(() => {
		detectMore(
			idb.tables.Image.state
				.map(({ fileId }) => fileId)
				.filter(nonnull)
				.filter((fileId) => !imageIsAnalyzed(uiState.currentProtocol, fileId))
		);
	});

	watch(
		() => uiState.imagePreviouslyOpenedInCropper,
		() => {
			uiState.setSelection?.([uiState.imagePreviouslyOpenedInCropper]);
		}
	);
</script>

<section class="observations">
	<AreaObservations
		{images}
		bind:selection={uiState.selection}
		sort={getSettings().gallerySort}
		loadingText={m.analyzing()}
		errors={uiState.erroredImages}
		onretry={(id) => {
			detectMore([imageIdToFileId(id)]);
		}}
		ondelete={async (id) => {
			cancelTask(id, 'Cancelled by user');
			uiState.processing.removeFile(id);
			await deleteObservation(id);
			await deleteImageFile(id);
		}}
		oncardclick={(id) => {
			goto(`#/crop/${id}`);
		}}
	/>
</section>

<style>
	.observations {
		padding: 2.5em;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}
</style>
