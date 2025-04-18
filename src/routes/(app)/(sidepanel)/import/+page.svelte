<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import { toRelativeCoords } from '$lib/BoundingBoxes.svelte';
	import Dropzone from '$lib/Dropzone.svelte';
	import { processExifData } from '$lib/exif';
	import * as db from '$lib/idb.svelte';
	import { tables } from '$lib/idb.svelte';
	import {
		deleteImage,
		imageBufferWasSaved,
		imageId,
		imageIdToFileId,
		imageIsCropped,
		resizeToMaxSize,
		storeImageBytes
	} from '$lib/images';
	import { inferSequentialy, loadModel, MODELDETECTPATH } from '$lib/inference.js';
	import Logo from '$lib/Logo.svelte';
	import { storeMetadataValue } from '$lib/metadata';
	import { deleteObservation } from '$lib/observations';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte';
	import { formatISO } from 'date-fns';

	const erroredImages = $derived(uiState.erroredImages);

	const images = $derived(
		toAreaObservationProps(tables.Image.state, [], {
			isLoaded: (image) =>
				Boolean(
					uiState.currentProtocol &&
						imageBufferWasSaved(image) &&
						uiState.hasPreviewURL(image) &&
						imageIsCropped(uiState.currentProtocol, image)
				)
		})
	);

	let cropperModel = $state();
	async function loadCropperModel() {
		if (!uiState.currentProtocol) return;
		cropperModel = await loadModel(uiState.currentProtocol, 'detection');
		toasts.success('Modèle de recadrage chargé');
	}

	/**
	 * @param {File} file
	 * @param {string} id
	 */
	async function processImageFile(file, id) {
		if (!uiState.currentProtocol) {
			toasts.error('Aucun protocole sélectionné');
			return;
		}

		await tables.Image.set({
			id,
			filename: file.name,
			addedAt: formatISO(new Date()),
			metadata: {},
			bufferExists: false,
			contentType: file.type
		});

		const originalBytes = await file.arrayBuffer();
		const resizedBytes = await resizeToMaxSize({ source: file });

		await storeImageBytes({ id, resizedBytes, originalBytes, contentType: file.type });
		await processExifData(uiState.currentProtocol.id, id, originalBytes, file);
		await inferBoundingBox(id, resizedBytes, file);
	}

	/**
	 * @param {string} id
	 * @param {ArrayBuffer} buffer
	 * @param {object} image
	 * @param {string} image.type
	 * @param {string} image.name
	 */
	async function inferBoundingBox(id, buffer, { type: contentType, name: filename }) {
		if (!uiState.currentProtocol) {
			toasts.error('Aucun protocole sélectionné');
			return;
		}
		if (!cropperModel) {
			toasts.error(
				'Modèle de recadrage non chargé, patentiez ou rechargez la page avant de rééssayer'
			);
			return;
		}

		const [[boundingBoxes], [bestScores]] = await inferSequentialy(
			uiState.currentProtocol,
			[buffer],
			cropperModel
		);

		console.log('Bounding boxes:', boundingBoxes);

		let [firstBoundingBox, ...otherBoundingBoxes] = boundingBoxes;
		let [firstScore, ...otherScores] = bestScores;

		if (!firstBoundingBox || !firstScore) {
			await storeMetadataValue({
				subjectId: id,
				metadataId: uiState.currentProtocol.crop?.metadata ?? 'crop',
				type: 'boundingbox',
				value: { x: 0, y: 0, w: 0, h: 0 },
				confidence: 0
			});
			return;
		}

		/**
		 * @param {[number, number, number, number]} param0
		 */
		const toCropBox = ([x, y, w, h]) => toRelativeCoords(uiState.currentProtocol)({ x, y, w, h });

		await db.openTransaction(['Image', 'Observation'], {}, async (tx) => {
			await storeMetadataValue({
				tx,
				subjectId: id,
				metadataId: uiState.currentProtocol?.crop?.metadata ?? 'crop',
				type: 'boundingbox',
				value: toCropBox(firstBoundingBox),
				confidence: firstScore
			});

			// Create one more image for each new boundingbox, with id "(original id)_(1 to boundingBoxes.length)"
			for (const [i, box] of otherBoundingBoxes.entries()) {
				await tx.objectStore('Image').put({
					id: imageId(parseInt(id), i + 1),
					filename,
					contentType,
					addedAt: formatISO(new Date()),
					bufferExists: true,
					metadata: {
						crop: {
							value: JSON.stringify(toCropBox(box)),
							confidence: otherScores[i],
							alternatives: {}
						}
					}
				});
			}
		});
	}

	$effect(() => {
		if (!cropperModel) return;
		if (!uiState.currentProtocol) return;
		for (const image of tables.Image.state) {
			if (
				imageBufferWasSaved(image) &&
				!imageIsCropped(uiState.currentProtocol, image) &&
				!uiState.loadingImages.has(image.id)
			) {
				void (async () => {
					try {
						const file = await db.get('ImagePreviewFile', imageIdToFileId(image.id));
						if (!file) return;
						uiState.loadingImages.add(image.id);
						await inferBoundingBox(image.id, file.bytes, {
							type: image.contentType,
							name: image.filename
						});
					} catch (error) {
						console.error(error);
						erroredImages.set(image.id, error?.toString() ?? 'Erreur inattendue');
					} finally {
						uiState.loadingImages.delete(image.id);
					}
				})();
			}
		}
	});

	/** Counts files that we will process but that aren't loaded in the database yet. Useful to make progress bar more accurate */
	let filesToProcess = $state(0);
	$effect(() => {
		uiState.processing.total = tables.Image.state.length + filesToProcess;
		uiState.processing.total = tables.Image.state.length;
		uiState.processing.done = tables.Image.state.filter(
			(img) => img.metadata[uiState.cropMetadataId]
		).length;
	});
</script>

{#snippet modelsource()}
	<a
		href="https://git.inpt.fr/cigale/cigale.pages.inpt.fr/-/tree/main/models/{MODELDETECTPATH}"
		target="_blank"
	>
		<code>{MODELDETECTPATH}</code>
	</a>
{/snippet}

{#await loadCropperModel()}
	<section class="loading">
		<Logo loading />
		<p>Chargement du modèle de recadrage…</p>
		<p class="source">{@render modelsource()}</p>
	</section>
{:then _}
	<Dropzone
		clickable={images.length === 0}
		onfiles={async ({ files }) => {
			filesToProcess = files.length;
			for (const file of files) {
				const currentLength = tables.Image.state.length;
				const id = imageId(currentLength);
				try {
					uiState.loadingImages.add(id);
					await processImageFile(file, id);
					filesToProcess--;
				} catch (error) {
					console.error(error);
					erroredImages.set(id, error?.toString() ?? 'Erreur inattendue');
				} finally {
					uiState.loadingImages.delete(id);
				}
			}
		}}
	>
		<section class="observations" class:empty={!images.length}>
			<AreaObservations
				bind:selection={uiState.selection}
				{images}
				errors={erroredImages}
				loadingText="Analyse…"
				ondelete={async (id) => {
					await deleteObservation(id);
					await deleteImage(id);
				}}
			/>
			{#if !images.length}
				<div class="empty-state">
					<Logo variant="empty" />
					<p>Cliquer ou déposer des images ici</p>
				</div>
			{/if}
		</section>
	</Dropzone>
{:catch error}
	<section class="loading errored">
		<Logo variant="error" />
		<h2>Oops!</h2>
		<p>Impossible de charger le modèle de recadrage</p>
		<p class="source">{@render modelsource()}</p>
		<p class="message">{error?.toString() ?? 'Erreur inattendue'}</p>
	</section>
{/await}

<style>
	.observations {
		padding: 4em;
		display: flex;
		flex-grow: 1;
	}

	.observations.empty {
		justify-content: center;
		align-items: center;
		text-align: center;
	}

	.loading,
	.empty-state {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
		justify-content: center;
		align-items: center;
		/* Logo size */
		--size: 5em;
	}

	.loading {
		height: 100vh;
	}

	.loading .source {
		font-size: 0.8em;
	}

	.loading.errored {
		gap: 0.5em;
	}

	.loading.errored *:not(p.message) {
		color: var(--fg-error);
	}
</style>
