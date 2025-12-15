<script lang="ts">
	import { watch } from 'runed';
	import { fade } from 'svelte/transition';

	import { page } from '$app/state';
	import { toTopLeftCoords } from '$lib/BoundingBoxes.svelte';
	import { promptForFiles } from '$lib/files';
	import * as db from '$lib/idb.svelte';
	import { openTransaction, tables } from '$lib/idb.svelte';
	import { deleteImageFile, imageFileId, imageIdToFileId } from '$lib/images';
	import { ACCEPTED_IMPORT_TYPES } from '$lib/import.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import {
		deleteMetadataValue,
		mergeMetadataFromImagesAndObservations,
		storeMetadataValue
	} from '$lib/metadata';
	import { deleteObservation, mergeToObservation, newObservation } from '$lib/observations';
	import { cancelTask, importMore } from '$lib/queue.svelte.js';
	import { seo } from '$lib/seo.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';

	import PreviewSidePanel from './PreviewSidePanel.svelte';

	seo({ title: 'Importer' });

	const { children } = $props();

	async function importImages() {
		importMore(await promptForFiles({ accept: ACCEPTED_IMPORT_TYPES, multiple: true }));
	}

	async function mergeSelection() {
		const newId = await mergeToObservation(uiState.selection);
		uiState.setSelection?.([newId]);
	}

	async function splitSelection() {
		/** @type {string[]} */
		const toselect = [];

		const protocol = uiState.currentProtocol;
		if (!protocol) throw new Error('No protocol selected');

		await db.openTransaction(['Image', 'Observation'], { mode: 'readwrite' }, async (tx) => {
			if (!uiState.currentSession)
				throw new Error('No session selected, cannot split observations');

			for (const id of uiState.selection) {
				const obs = tables.Observation.getFromState(id);
				if (!obs) continue;

				tx.objectStore('Observation').delete(id);
				for (const imageId of obs.images) {
					const image = await tx.objectStore('Image').get(imageId);
					if (!image) continue;
					const obs = newObservation(image, protocol, uiState.currentSession);
					tx.objectStore('Observation').add(obs);
					toselect.push(obs.id);
				}
			}
		});

		uiState.setSelection?.(toselect);
	}

	async function deleteSelection() {
		await openTransaction(
			['Image', 'Observation', 'ImageFile', 'ImagePreviewFile'],
			{},
			async (tx) => {
				for (const id of uiState.selection) {
					cancelTask(id, 'Cancelled by user');
					await deleteObservation(id, { tx, notFoundOk: true, recursive: true });
					await deleteImageFile(id, tx, true);
					await deleteImageFile(imageIdToFileId(id), tx, true);
				}
			}
		);
		uiState.setSelection?.([]);
	}

	defineKeyboardShortcuts('observations', {
		'x x': {
			help: 'Mettre en erreur la sélection',
			debug: true,
			do() {
				for (const id of uiState.selection) {
					if (!uiState.erroredImages.has(id)) uiState.erroredImages.set(id, 'Errored!');
				}
			}
		},
		'x u': {
			help: 'Enlever les erreurs de la sélection',
			debug: true,
			do() {
				for (const id of uiState.selection) {
					uiState.erroredImages.delete(id);
				}
			}
		},
		'x f': {
			help: 'Créer une image en chargement',
			debug: true,
			do() {
				uiState.processing.files.push({
					id: imageFileId(),
					name: 'Debug image.jpeg',
					addedAt: new Date()
				});
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

	let showSidePanel = $derived(
		uiState.processing.files.length +
			tables.Observation.state.length +
			tables.Image.state.length >
			0
	);

	const selectedImages = $derived(
		uiState.selection
			.flatMap((id) => {
				// Try assuming id === image
				const image = tables.Image.state.find((i) => [i.fileId, i.id].includes(id));
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
				if (!image.fileId) return undefined;
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

	watch([() => selectedImages, () => selectedObservations], () => {
		// FIXME needed to force refresh when selectedObservations' metadataOverrides change values, this isn't picked up by Svelte for some reason. I tried reproducing but couldn't yet, see https://svelte.dev/playground/eef37e409ca04fa888badd3e7588f461?version=5.25.0
		void mergeMetadataFromImagesAndObservations(
			db.databaseHandle(),
			selectedImages,
			selectedObservations
		)
			.then((values) => {
				mergedMetadataValues = values;
			})
			.catch((e) => toasts.error(e));
	});
</script>

<div class="main-and-sidepanel" class:has-sidepanel={showSidePanel} in:fade={{ duration: 100 }}>
	<main data-testid="app-main">{@render children?.()}</main>
	{#if showSidePanel}
		<PreviewSidePanel
			images={selectedHrefsWithCropboxes}
			metadata={mergedMetadataValues}
			canmerge={uiState.selection.length > 0}
			onmerge={page.route.id?.endsWith('classify') ? mergeSelection : undefined}
			cansplit={uiState.selection.some((id) =>
				tables.Observation.state.some((o) => o.id === id)
			)}
			onsplit={page.route.id?.endsWith('classify') ? splitSelection : undefined}
			onimport={page.route.id?.endsWith('import') ? importImages : undefined}
			ondelete={deleteSelection}
			onaddmetadata={() => {}}
			onmetadatachange={async (id, value) => {
				if (!uiState.currentProtocol) return;
				for (const subjectId of uiState.selection) {
					if (value === undefined) {
						await deleteMetadataValue({
							db: db.databaseHandle(),
							sessionId: uiState.currentSession?.id,
							subjectId,
							metadataId: id,
							recursive: true
						});
					} else {
						await storeMetadataValue({
							db: db.databaseHandle(),
							sessionId: uiState.currentSession?.id,
							subjectId,
							metadataId: id,
							confidence: 1,
							manuallyModified: true,
							value
						});
					}
				}

				await mergeMetadataFromImagesAndObservations(
					db.databaseHandle(),
					selectedImages,
					selectedObservations
				)
					.then((values) => {
						mergedMetadataValues = values;
					})
					.catch((e) => toasts.error(e));
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
		scrollbar-color: var(--gray) transparent;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		overflow-y: auto;
	}
</style>
