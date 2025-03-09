<script>
	import { openTransaction, tables } from '$lib/idb.svelte';
	import { imageIdToFileId } from '$lib/images';
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

	const showSidePanel = $derived(tables.Image.state.length + tables.Observation.state.length > 0);

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
			canmerge={uiState.selection.length > 1}
			onmerge={async () => {
				await mergeToObservation(uiState.selection);
				uiState.setSelection([]);
			}}
			cansplit={uiState.selection.some((id) => tables.Observation.state.some((o) => o.id === id))}
			onsplit={async () => {
				await tables.Observation.do((tx) => {
					uiState.selection.map((id) => tx.delete(id));
				});
			}}
			ondelete={async () => {
				await openTransaction(['Image', 'Observation', 'ImageFile'], 'readwrite', async (tx) => {
					uiState.selection.map((id) => {
						const obs = tables.Observation.state.find((o) => o.id === id);
						const imagesToDelete = obs?.images ?? [id];
						if (obs) tx.objectStore('Observation').delete(id);
						imagesToDelete.map((id) => {
							tx.objectStore('Image').delete(id);
							tx.objectStore('ImageFile').delete(imageIdToFileId(id));
						});
					});
				});
			}}
			onaddmetadata={() => {}}
			onmetadatachange={async (id, value) => {
				await openTransaction(['Image', 'Observation'], 'readwrite', async (tx) => {
					for (const image of selectedImages) {
						await storeMetadataValue({
							tx,
							subjectId: image.id,
							metadataId: id,
							confidence: 1,
							value
						});
					}
				});
			}}
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
