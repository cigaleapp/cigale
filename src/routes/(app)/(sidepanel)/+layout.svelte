<script>
	import { openTransaction, tables } from '$lib/idb.svelte';
	import { deleteImage } from '$lib/images';
	import { combineMetadataValues, storeMetadataValue } from '$lib/metadata';
	import { deleteObservation, mergeToObservation } from '$lib/observations';
	import { uiState } from '$lib/state.svelte';
	import PreviewSidePanel from './PreviewSidePanel.svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { onMount } from 'svelte';
	import { toasts } from '$lib/toasts.svelte';
	import * as db from '$lib/idb.svelte';

	const { children } = $props();

	export const snapshot = {
		capture() {
			const selection = $state.snapshot(uiState.selection);
			return { selection };
		},
		restore({ selection }) {
			uiState.selection = selection;
		}
	};

	onMount(() => {
		uiState.keybinds['$mod+u'] = {
			help: 'Supprimer toutes les images et observations',
			async do() {
				toasts.warn('Suppression de toutes les images et observations…');
				await db.openTransaction(['Image', 'ImageFile', 'Observation'], {}, (tx) => {
					tx.objectStore('Observation').clear();
					tx.objectStore('ImageFile').clear();
					uiState.previewURLs = new SvelteMap();
					tx.objectStore('Image').clear();
					uiState.erroredImages = new SvelteMap();
					uiState.loadingImages = new SvelteSet();
					uiState.setSelection([]);
				});
			}
		};
		uiState.keybinds['$mod+g'] = {
			help: 'Fusionner des observations ou images',
			async do() {
				const newId = await mergeToObservation(uiState.selection);
				uiState.setSelection([newId]);
			}
		};
		uiState.keybinds['$mod+alt+g'] = {
			help: 'Séparer toutes les observations sélectionnées en images seules',
			async do() {
				await tables.Observation.do((tx) => {
					uiState.selection.map((id) => tx.delete(id));
				});
				uiState.setSelection([]);
			}
		};
	});

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
			canmerge={uiState.selection.length > 0}
			onmerge={async () => {
				const newId = await mergeToObservation(uiState.selection);
				uiState.setSelection([newId]);
			}}
			cansplit={uiState.selection.some((id) => tables.Observation.state.some((o) => o.id === id))}
			onsplit={async () => {
				await tables.Observation.do((tx) => {
					uiState.selection.map((id) => tx.delete(id));
				});
			}}
			ondelete={async () => {
				await openTransaction(['Image', 'Observation', 'ImageFile'], {}, async (tx) => {
					for (const id of uiState.selection) {
						await deleteObservation(id, { tx, notFoundOk: true, recursive: true });
						await deleteImage(id, tx);
					}
				});
			}}
			onaddmetadata={() => {}}
			onmetadatachange={async (id, value) => {
				await openTransaction(['Image', 'Observation'], {}, async (tx) => {
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

	.main-and-sidepanel.has-sidepanel main {
		border-right: 1px solid var(--gray);
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
