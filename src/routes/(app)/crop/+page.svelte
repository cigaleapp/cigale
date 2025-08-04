<script>
	import { goto } from '$app/navigation';
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import * as idb from '$lib/idb.svelte.js';
	import { imageFileIds } from '$lib/images';
	import { seo } from '$lib/seo.svelte';
	import { uiState } from '$lib/state.svelte';

	seo({ title: 'Recadrer' });

	$effect(() => {
		uiState.imageOpenedInCropper = '';
	});

	const images = $derived(
		toAreaObservationProps(imageFileIds(idb.tables.Image.state), [], [], {
			isLoaded: (item) => typeof item === 'string' && uiState.hasPreviewURL(item),
			isQueued: () => false
		})
	);
</script>

<section class="observations">
	<AreaObservations
		{images}
		highlight={uiState.imagePreviouslyOpenedInCropper}
		loadingText="Chargement…"
		oncardclick={(id) => {
			goto(`#/crop/${id}`);
		}}
	/>
</section>

<style>
	.observations {
		padding: 2.5em;
		display: flex;
		flex-grow: 1;
	}
</style>
