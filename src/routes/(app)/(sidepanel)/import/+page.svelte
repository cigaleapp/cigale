<script module>
	/**
	 * Import new files and process  them
	 * @param {File[]} files
	 */
	export async function importMore(files) {
		uiState.processing.files = files.map((f) => f.name);
		uiState.processing.total = files.length;
		for (const [i, file] of files.entries()) {
			console.log(file);
			if (['application/zip', 'application/x-zip-compressed'].includes(file.type)) {
				console.log(`imorting ${file.name} as zip`);
				try {
					await importResultsZip(file, uiState.currentProtocolId);
				} catch {
					uiState.processing.files.splice(i, 1);
					uiState.erroredImages.set(file.name, 'Export invalide');
				}
			} else {
				const currentLength = tables.Image.state.length;
				const id = imageFileId(currentLength);
				try {
					uiState.loadingImages.add(id);
					await processImageFile(file, id);
				} catch (error) {
					console.error(error);
					uiState.erroredImages.set(id, error?.toString() ?? 'Erreur inattendue');
				} finally {
					uiState.loadingImages.delete(id);
				}
			}
		}
	}

	let cropperModel = $state();
	/**
	 *
	 */
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

		const originalBytes = await file.arrayBuffer();
		const [[width, height], resizedBytes] = await resizeToMaxSize({ source: file });

		uiState.processing.files.shift();
		await storeImageBytes({
			id,
			resizedBytes,
			originalBytes,
			contentType: file.type,
			filename: file.name,
			width,
			height
		});

		await inferBoundingBoxes({
			id,
			bytes: resizedBytes,
			filename: file.name,
			contentType: file.type,
			dimensions: { width, height }
		});

		await processExifData(uiState.currentProtocol.id, id, originalBytes, file).catch((error) => {
			console.error(error);
			toasts.error(`Erreur lors de l'extraction des métadonnées EXIF pour ${file.name}`);
		});
	}

	/**
	 * @param {object} file
	 * @param {ArrayBuffer} file.bytes
	 * @param {string} file.filename
	 * @param {string} file.contentType
	 * @param {string} file.id
	 * @param {DimensionsInput} file.dimensions
	 * @returns {Promise<void>}
	 */
	async function inferBoundingBoxes(file) {
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

		console.log('Inferring bounding boxes for', file.filename);

		const [[boundingBoxes], [scores]] = await inferSequentialy(
			uiState.currentProtocol,
			[file.bytes],
			cropperModel
		);

		console.log('Bounding boxes:', boundingBoxes);

		let [firstBoundingBox] = boundingBoxes;
		let [firstScore] = scores;

		if (!firstBoundingBox || !firstScore) {
			await tables.Image.set({
				id: imageId(file.id, 0),
				filename: file.filename,
				addedAt: formatISO(new Date()),
				contentType: file.contentType,
				dimensions: file.dimensions,
				fileId: file.id,
				metadata: {}
			});
			return;
		}

		/**
		 * @param {[number, number, number, number]} param0
		 */
		const toCropBox = ([x, y, w, h]) => toRelativeCoords(uiState.currentProtocol)({ x, y, w, h });

		for (let i = 0; i < boundingBoxes.length; i++) {
			await tables.Image.set({
				id: imageId(file.id, i),
				filename: file.filename,
				addedAt: formatISO(new Date()),
				contentType: file.contentType,
				dimensions: file.dimensions,
				fileId: file.id,
				metadata: {
					[uiState.cropMetadataId]: {
						value: JSON.stringify(toCropBox(boundingBoxes[i])),
						confidence: scores[i],
						alternatives: {}
					}
				}
			});
		}
	}
</script>

<script>
	/**
	 * @import { DimensionsInput } from '$lib/database.js';
	 */
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import { toRelativeCoords } from '$lib/BoundingBoxes.svelte';
	import Dropzone from '$lib/Dropzone.svelte';
	import { processExifData } from '$lib/exif';
	import * as db from '$lib/idb.svelte';
	import { tables } from '$lib/idb.svelte';
	import {
		deleteImageFile,
		imageFileId,
		imageFileIds,
		imageId,
		imageIdToFileId,
		imageIsAnalyzed,
		resizeToMaxSize,
		storeImageBytes
	} from '$lib/images';
	import { inferSequentialy, loadModel, MODELDETECTPATH } from '$lib/inference.js';
	import Logo from '$lib/Logo.svelte';
	import { deleteObservation } from '$lib/observations';
	import { importResultsZip } from '$lib/results.svelte';
	import { getSettings } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte';
	import { formatISO } from 'date-fns';

	const fileIds = $derived(imageFileIds(tables.Image.state));

	const images = $derived(
		toAreaObservationProps(fileIds, [], [], {
			isLoaded: (fileId) =>
				Boolean(
					typeof fileId === 'string' &&
						uiState.currentProtocol &&
						uiState.hasPreviewURL(fileId) &&
						imageIsAnalyzed(uiState.currentProtocol, fileId)
				)
		})
	);

	$effect(() => {
		if (!cropperModel) return;
		if (!uiState.currentProtocol) return;
		for (const imageFileId of fileIds) {
			if (
				!imageIsAnalyzed(uiState.currentProtocol, imageFileId) &&
				!uiState.loadingImages.has(imageFileId)
			) {
				void (async () => {
					try {
						const file = await db.get('ImagePreviewFile', imageIdToFileId(imageFileId));
						if (!file) return;
						uiState.loadingImages.add(imageFileId);
						await inferBoundingBoxes(file);
					} catch (error) {
						console.error(error);
						uiState.erroredImages.set(imageFileId, error?.toString() ?? 'Erreur inattendue');
					} finally {
						uiState.loadingImages.delete(imageFileId);
					}
				})();
			}
		}
	});

	$effect(() => {
		uiState.processing.done = uiState.processing.total - uiState.processing.files.length;
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
		filetypes={[
			'image/jpeg',
			'application/zip',
			'image/png',
			'image/tiff',
			'.cr2',
			'.rw2',
			'.dng',
			'.crw',
			'.raw',
			'.cr3'
		]}
		clickable={images.length === 0}
		onfiles={async ({ files }) => await importMore(files)}
	>
		<section class="observations" class:empty={!images.length}>
			<AreaObservations
				bind:selection={uiState.selection}
				images={[
					...images,
					...uiState.processing.files.map((filename, i) => ({
						image: '',
						title: filename,
						id: `loading_${i}`,
						index: images.length + i,
						stacksize: 1,
						loading: -1,
						boundingBoxes: []
					}))
				]}
				errors={uiState.erroredImages}
				loadingText="Analyse…"
				ondelete={async (id) => {
					await deleteObservation(id);
					await deleteImageFile(id);
				}}
			/>
			{#if !images.length}
				<div class="empty-state">
					<Logo variant="empty" />
					<p>Cliquer ou déposer des images, ou un export de résultats (.zip)</p>
				</div>
			{/if}
		</section>
	</Dropzone>
	{#if getSettings().showTechnicalMetadata}
		<section class="debug">
			{#snippet displayIter(set)}
				{'{'} {[...$state.snapshot(set)].join(' ')} }
			{/snippet}
			<code>
				loading {@render displayIter(uiState.loadingImages)} <br />
				errored {@render displayIter(uiState.erroredImages.keys())} <br />
				preview urls {@render displayIter(uiState.previewURLs.keys())} <br />
			</code>
		</section>
	{/if}
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
		padding: 2.5em;
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
		max-width: 20em;
		margin: auto;
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
