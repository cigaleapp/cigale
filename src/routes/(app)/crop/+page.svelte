<script>
	import { goto } from '$app/navigation';
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import * as idb from '$lib/idb.svelte.js';
	import { seo } from '$lib/seo.svelte';
	import { uiState } from '$lib/state.svelte';

	seo({ title: 'Recadrer' });

	$effect(() => {
		uiState.imageOpenedInCropper = 'gallery';
	});

	const images = $derived(
		toAreaObservationProps(idb.tables.Image.state, [], {
			isLoaded: (image) => image.bufferExists && uiState.hasPreviewURL(image)
		})
	);
</script>

<section class="observations">
	<AreaObservations
		{images}
		bind:selection={uiState.selection}
		loadingText="Chargement…"
		oncardclick={(id) => {
			goto(`#/crop/${id}`);
		}}
	/>
</section>

<style>
	.observations {
		padding: 4em;
		display: flex;
		flex-grow: 1;
	}
</style>
