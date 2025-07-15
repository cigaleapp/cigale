<script>
	import { page } from '$app/state';
	import { toTopLeftCoords } from '$lib/BoundingBoxes.svelte';
	import * as db from '$lib/idb.svelte';
	import { openTransaction, tables } from '$lib/idb.svelte';
	import { deleteImageFile } from '$lib/images';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import {
		deleteMetadataValue,
		mergeMetadataFromImagesAndObservations,
		storeMetadataValue
	} from '$lib/metadata';
	import { deleteObservation, mergeToObservation } from '$lib/observations';
	import { seo } from '$lib/seo.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { importMore } from './import/+page.svelte';
	import PreviewSidePanel from './PreviewSidePanel.svelte';

	seo({ title: 'Importer' });

	const { children, data } = $props();

	async function importImages() {
		const filesInput = document.createElement('input');
		filesInput.type = 'file';
		filesInput.multiple = true;
		filesInput.accept = 'image/*';
		filesInput.addEventListener('change', async (event) => {
			if (!(event.currentTarget instanceof HTMLInputElement)) return;
			if (!event.currentTarget.files) return;
			const files = Array.from(event.currentTarget.files);
			if (files.length === 0) return;
			await importMore(data.swarpc, files);
		});
		filesInput.click();
	}

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
					await deleteImageFile(id, tx, true);
				}
			}
		);
		uiState.setSelection?.([]);
	}

	defineKeyboardShortcuts({
		'$mod+u': {
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
		},
		'$mod+g': {
			help: 'Fusionner des observations ou images',
			do: mergeSelection
		},
		'$mod+Shift+g': {
			help: 'Séparer toutes les observations sélectionnées en images seules',
			do: splitSelection
		},
		Delete: {
			help: 'Supprimer les images et observations sélectionnées',
			do: deleteSelection
		}
	});

	const showSidePanel = $derived(
		tables.Image.state.length + tables.Observation.state.length + uiState.processing.files.length >
			0
	);

	const selectedImages = $derived(
		uiState.selection
			.flatMap((id) => {
				// Try assuming id === image
				const image = tables.Image.state.find((i) => i.fileId === id);
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

	const selectedHrefsWithCropboxes = $derived(
		selectedImages
			.map((image) => {
				const src = uiState.getPreviewURL(image.fileId);
				if (!src) return undefined;
				const box = uiState.cropMetadataValueOf(image)?.value;
				return {
					src,
					box: box ? toTopLeftCoords(box) : undefined
				};
			})
			.filter((i) => i !== undefined)
	);

	/** @type {Awaited<ReturnType<typeof mergeMetadataFromImagesAndObservations>>} */
	let mergedMetadataValues = $state({});

	$effect(() => {
		// FIXME needed to force refresh when selectedObservations' metadataOverrides change values, this isn't picked up by Svelte for some reason. I tried reproducing but couldn't yet, see https://svelte.dev/playground/eef37e409ca04fa888badd3e7588f461?version=5.25.0
		[selectedImages, selectedObservations];
		void mergeMetadataFromImagesAndObservations(selectedImages, selectedObservations)
			.then((values) => {
				mergedMetadataValues = values;
			})
			.catch((e) => toasts.error(e));
	});
</script>

<div class="main-and-sidepanel" class:has-sidepanel={showSidePanel}>
	<main>{@render children?.()}</main>
	{#if showSidePanel}
		<PreviewSidePanel
			images={selectedHrefsWithCropboxes}
			metadata={mergedMetadataValues}
			canmerge={uiState.selection.length > 0}
			onmerge={page.route.id?.endsWith('classify') ? mergeSelection : undefined}
			cansplit={uiState.selection.some((id) => tables.Observation.state.some((o) => o.id === id))}
			onsplit={page.route.id?.endsWith('classify') ? splitSelection : undefined}
			onimport={page.route.id?.endsWith('import') ? importImages : undefined}
			ondelete={deleteSelection}
			onaddmetadata={() => {}}
			onmetadatachange={async (id, value) => {
				if (!uiState.currentProtocol) return;
				for (const subjectId of uiState.selection) {
					if (value === undefined) {
						await deleteMetadataValue({ subjectId, metadataId: id, recursive: true });
					} else {
						await storeMetadataValue({
							subjectId,
							metadataId: id,
							confidence: 1,
							manuallyModified: true,
							value
						});
					}
				}
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
		scrollbar-color: var(--gray) transparent;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		overflow-y: auto;
	}
</style>
