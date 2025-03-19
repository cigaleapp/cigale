<script>
	import * as db from '$lib/idb.svelte';
	import { openTransaction, tables } from '$lib/idb.svelte';
	import { deleteImage } from '$lib/images';
	import {
		combineMetadataValuesWithOverrides,
		deleteMetadataValue,
		storeMetadataValue
	} from '$lib/metadata';
	import { deleteObservation, mergeToObservation } from '$lib/observations';
	import { uiState } from '$lib/state.svelte';
	import { CLADE_METADATA_IDS, setTaxonAndInferParents } from '$lib/taxonomy';
	import { toasts } from '$lib/toasts.svelte';
	import { onMount } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import PreviewSidePanel from './PreviewSidePanel.svelte';

	const { children } = $props();

	async function mergeSelection() {
		const newId = await mergeToObservation(uiState.selection);
		uiState.setSelection?.([newId]);
	}

	async function splitSelection() {
		// Find IDs of all images in selected observations
		const toselect = uiState.selection.flatMap((id) => {
			const obs = tables.Observation.state.find((o) => o.id === id);
			if (!obs) return [];
			return obs.images;
		});
		await tables.Observation.do((tx) => {
			uiState.selection.map((id) => tx.delete(id));
		});
		uiState.setSelection?.(toselect);
	}

	async function deleteSelection() {
		await openTransaction(
			['Image', 'Observation', 'ImageFile', 'ImagePreviewFile'],
			{},
			async (tx) => {
				for (const id of uiState.selection) {
					await deleteObservation(id, { tx, notFoundOk: true, recursive: true });
					await deleteImage(id, tx);
				}
			}
		);
		uiState.setSelection?.([]);
	}

	onMount(() => {
		uiState.keybinds['$mod+u'] = {
			help: 'Supprimer toutes les images et observations',
			async do() {
				toasts.warn('Suppression de toutes les images et observations…');
				await db.openTransaction(
					['Image', 'ImageFile', 'ImagePreviewFile', 'Observation'],
					{},
					(tx) => {
						tx.objectStore('Observation').clear();
						tx.objectStore('ImageFile').clear();
						uiState.previewURLs = new SvelteMap();
						tx.objectStore('Image').clear();
						uiState.erroredImages = new SvelteMap();
						uiState.loadingImages = new SvelteSet();
						uiState.setSelection?.([]);
					}
				);
			}
		};
		uiState.keybinds['$mod+g'] = {
			help: 'Fusionner des observations ou images',
			do: mergeSelection
		};
		uiState.keybinds['$mod+Shift+g'] = {
			help: 'Séparer toutes les observations sélectionnées en images seules',
			do: splitSelection
		};
		uiState.keybinds['Delete'] = {
			help: 'Supprimer les images et observations sélectionnées',
			do: deleteSelection
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

	const selectedObservations = $derived(
		uiState.selection
			.map((id) => tables.Observation.state.find((o) => o.id === id))
			.filter((o) => o !== undefined)
	);

	const selectedHrefs = $derived(
		selectedImages.map((image) => uiState.getPreviewURL(image)).filter((url) => url !== undefined)
	);
</script>

<div class="main-and-sidepanel" class:has-sidepanel={showSidePanel}>
	<main>{@render children?.()}</main>
	{#if showSidePanel}
		<PreviewSidePanel
			images={selectedHrefs}
			metadata={combineMetadataValuesWithOverrides(selectedImages, selectedObservations)}
			canmerge={uiState.selection.length > 0}
			onmerge={mergeSelection}
			cansplit={uiState.selection.some((id) => tables.Observation.state.some((o) => o.id === id))}
			onsplit={splitSelection}
			ondelete={deleteSelection}
			onaddmetadata={() => {}}
			onmetadatachange={async (id, value) => {
				console.log({ onmetadatachange: { id, value } });
				await openTransaction(['Image', 'Observation'], {}, async (tx) => {
					for (const subjectId of uiState.selection) {
						if (value === undefined) {
							await deleteMetadataValue({ tx, subjectId, metadataId: id, recursive: true });
						} else if (CLADE_METADATA_IDS.includes(id)) {
							await setTaxonAndInferParents({
								tx,
								subjectId,
								clade: id,
								value: value.toString(),
								confidence: 1
							});
						} else {
							await storeMetadataValue({
								tx,
								subjectId,
								metadataId: id,
								confidence: 1,
								value
							});
						}
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
