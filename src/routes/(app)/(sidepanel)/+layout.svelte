<script>
	import { page } from '$app/state';
	import { tables } from '$lib/idb.svelte';
	import { combineMetadataValues, storeMetadataValue } from '$lib/metadata';
	import { mergeToObservation } from '$lib/observations';
	import { uiState } from '$lib/state.svelte';
	import { onMount } from 'svelte';
	import PreviewSidePanel from './PreviewSidePanel.svelte';

	const { children } = $props();

	onMount(() => {
		uiState.keybinds['$mod+m'] = {
			help: 'Fusionner les observations sélectionnées',
			do() {
				alert('todo!');
			}
		};
	});

	export const snapshot = {
		capture() {
			const selection = $state.snapshot(uiState.selection);
			return { selection };
		},
		restore({ selection }) {
			uiState.selection = selection;
		}
	};

	const showSidePanel = $derived(!['/about', '/settings'].includes(page.route.id ?? ''));

	const selectedImages = $derived(
		uiState.selection
			.flatMap((id) => {
				// Try assuming id === image
				const image = tables.Image.state.find((i) => i.id === id);
				if (image) return [image];
				// Otherwise, get every observation's image
				return tables.Observation.state
					.find((i) => i.id === id)
					?.images.map((i) => tables.Image.state.find((img) => img.id === i))
					.filter((img) => img !== undefined);
			})
			.filter((img) => img !== undefined)
	);

	const selectedHrefs = $derived(
		selectedImages
			.map((image) => uiState.previewURLs.get(image.id))
			.filter((url) => url !== undefined)
	);
</script>

<div class="main-and-sidepanel" class:has-sidepanel={showSidePanel}>
	<main>{@render children?.()}</main>
	{#if showSidePanel}
		<PreviewSidePanel
			images={selectedHrefs}
			metadata={combineMetadataValues(selectedImages)}
			onmerge={async () => {
				await mergeToObservation(uiState.selection);
				uiState.selection = [];
			}}
			onaddmetadata={() => {}}
			onmetadatachange={async (id, value) => {
				await Promise.all(
					selectedImages.map(async (image) => {
						storeMetadataValue({
							subjectId: image.id,
							metadataId: id,
							confidence: 1,
							value
						});
					})
				);
			}}
			allowmerge
		/>
	{/if}
</div>

<style>
	.main-and-sidepanel {
		height: 100%;
		display: flex;
		overflow: hidden;
	}

	.main-and-sidepanel:not(.has-sidepanel) main {
		width: 100%;
	}

	main {
		display: flex;
		flex-direction: column;
		gap: 1em;
		height: 100%;
		flex-grow: 1;
		overflow-y: scroll;
		padding: 1.2rem;
	}
</style>
