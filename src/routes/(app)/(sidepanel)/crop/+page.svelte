<script>
	import { watch } from 'runed';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import AreaObservations from '$lib/AreaObservations.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import CardImageFile from '$lib/CardImageFile.svelte';
	import * as idb from '$lib/idb.svelte.js';
	import { deleteImageFile, imageIsAnalyzed } from '$lib/images';
	import Logo from '$lib/Logo.svelte';
	import { mergeMetadataValues } from '$lib/metadata/index.js';
	import { deleteObservation } from '$lib/observations.js';
	import { goto } from '$lib/paths.js';
	import { cancelTask, detectMore } from '$lib/queue.svelte.js';
	import { seo } from '$lib/seo.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { avg, groupBy, nonnull } from '$lib/utils.js';

	seo({ title: 'Recadrer' });

	const items = $derived(
		[...groupBy(idb.tables.Image.state, (img) => img.fileId ?? '').entries()].map(
			([fileId, images]) => ({
				id: fileId,
				sessionId: images[0].sessionId,
				addedAt: new Date(avg(images.map((i) => i.addedAt.getTime()))),
				name: images[0].filename,
				virtual: false,
				metadata: mergeMetadataValues(
					images.map((img) => img.metadata),
					{
						definitions: idb.tables.Metadata.state,
						// TODO
						options: {}
					}
				),
				data: images
			})
		)
	);

	$effect(() => {
		uiState.imageOpenedInCropper = '';
	});

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

<section class="observations" in:fade={{ duration: 100 }}>
	<AreaObservations {items} zone="crop">
		{#snippet item(images, { id: fileId })}
			<CardImageFile
				{fileId}
				{images}
				boxes="show-all"
				highlighted={fileId === uiState.imagePreviouslyOpenedInCropper}
				loadingStatusText="Analyse…"
				onretry={() => {
					uiState.erroredImages.delete(fileId);
					detectMore([fileId]);
				}}
				ondelete={async () => {
					cancelTask(fileId, 'Cancelled by user');
					uiState.processing.removeFile(fileId);
					await deleteObservation(fileId);
					await deleteImageFile(fileId);
				}}
				onclick={async (_e, set) => {
					set({ status: 'loading', loadingStatusText: 'Ouverture…' });
					await goto('/(app)/(sidepanel)/crop/[image]', { image: fileId });
				}}
			/>
		{/snippet}
	</AreaObservations>
	{#if !items.length}
		<div class="empty">
			<Logo variant="empty" --size="6em" />
			<p>Aucune image</p>
			<ButtonSecondary onclick={() => goto('/import')}>Importer</ButtonSecondary>
		</div>
	{/if}
</section>

<style>
	.observations {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	.empty {
		display: flex;
		flex-direction: column;
		gap: 1em;
		max-width: 400px;
		justify-content: center;
		align-items: center;
		margin: auto;
	}
</style>
