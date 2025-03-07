<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import Dropzone from '$lib/Dropzone.svelte';
	import * as db from '$lib/idb.svelte';
	import { tables } from '$lib/idb.svelte';
	import { imageBufferWasSaved, imageId, imageIdToFileId, imageIsCropped } from '$lib/images';
	import Logo from '$lib/Logo.svelte';
	import { extractFromExif, storeMetadataValue } from '$lib/metadata';
	import { toasts } from '$lib/toasts.svelte';
	import { formatISO } from 'date-fns';
	import { onMount } from 'svelte';
	import {
		inferSequentialy,
		loadModel,
		MODELDETECTPATH,
		TARGETHEIGHT,
		TARGETWIDTH
	} from './inference/inference';
	import { uiState } from './inference/state.svelte';

	onMount(() => {
		uiState.keybinds['$mod+u'] = {
			help: 'Supprimer toutes les images et observations',
			async do() {
				toasts.warn('Suppression de toutes les images et observations…');
				await tables.Image.clear();
				await db.clear('ImageFile');
				await tables.Observation.clear();
			}
		};
	});

	const previewURLs = $derived(uiState.previewURLs);
	const erroredImages = $derived(uiState.erroredImages);

	const images = $derived(toAreaObservationProps(tables.Image.state, tables.Observation.state));

	let cropperModel = $state();
	async function loadCropperModel() {
		cropperModel = await loadModel(false);
		toasts.success('Modèle de recadrage chargé');
	}

	/**
	 * @param {string} contentType
	 * @param {ArrayBuffer} buffer
	 * */
	function arrayBufferToObjectURL(contentType, buffer) {
		const blob = new Blob([buffer], { type: contentType });
		return URL.createObjectURL(blob);
	}

	/**
	 * @param {File} file
	 * @param {string} id
	 */
	async function writeImage(file, id) {
		console.log('writeImage', file, id);
		const image = await tables.Image.raw.get(id);
		if (!image) throw 'Image introuvable';
		const bytes = await file.arrayBuffer();
		const metadataFromExif = await extractFromExif(bytes).catch((e) => {
			console.warn(e);
			if (file.type === 'image/jpeg') {
				toasts.warn(
					`Impossible d'extraire les métadonnées EXIF de ${file.name}: ${e?.toString() ?? 'Erreur inattendue'}`
				);
			}
			return {};
		});
		console.log(metadataFromExif);
		for (const [key, { value, confidence }] of Object.entries(metadataFromExif)) {
			await storeMetadataValue({
				subjectId: id,
				metadataId: key,
				value,
				confidence
			});
		}
		await db.set('ImageFile', { id: imageIdToFileId(id), bytes });
		previewURLs.set(id, arrayBufferToObjectURL(file.type, bytes));
		await tables.Image.update(id, 'bufferExists', true);
		await analyzeImage(bytes, id, image);
	}

	/**
	 * @param {ArrayBuffer} buffer
	 * @param {string} id
	 * @param {object} image
	 * @param {string} image.contentType
	 * @param {string} image.filename
	 */
	async function analyzeImage(buffer, id, { contentType, filename }) {
		if (!cropperModel) {
			toasts.error(
				'Modèle de recadrage non chargé, patentiez ou rechargez la page avant de rééssayer'
			);
			return;
		}

		const [[boundingBoxes], [bestScores]] = await inferSequentialy([buffer], cropperModel);

		let [firstBoundingBox, ...otherBoundingBoxes] = boundingBoxes;
		let [firstScore, ...otherScores] = bestScores;

		firstBoundingBox ??= [0, 0, TARGETWIDTH, TARGETHEIGHT];
		firstScore ??= 1;
		/**
		 * @param {[number, number, number, number]} param0
		 */
		const toCropBox = ([x, y, width, height]) => ({
			x,
			y,
			width,
			height
		});

		await storeMetadataValue({
			subjectId: id,
			metadataId: 'crop',
			type: 'boundingbox',
			value: toCropBox(firstBoundingBox),
			confidence: firstScore
		});

		// Create one more image for each new boundingbox, with id "(original id)_(1 to boundingBoxes.length)"
		for (const [i, box] of otherBoundingBoxes.entries()) {
			await tables.Image.set({
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
	}

	$effect(() => {
		if (!cropperModel) return;
		for (const image of tables.Image.state) {
			if (imageBufferWasSaved(image) && !imageIsCropped(image)) {
				void (async () => {
					try {
						const file = await db.get('ImageFile', imageIdToFileId(image.id));
						if (!file) return;
						await analyzeImage(file.bytes, image.id, image);
					} catch (error) {
						console.error(error);
						erroredImages.set(image.id, error?.toString() ?? 'Erreur inattendue');
					}
				})();
			}
		}
	});

	$effect(() => {
		uiState.processing.total = tables.Image.state.length;
		uiState.processing.done = tables.Image.state.filter((img) => img.metadata.crop).length;
	});

	$effect(() => {
		for (const image of tables.Image.state) {
			if (previewURLs.has(image.id)) continue;
			void (async () => {
				const file = await db.get('ImageFile', image.id.replace(/(_\d+)+$/, ''));
				if (!file) return;
				previewURLs.set(image.id, arrayBufferToObjectURL(image.contentType, file.bytes));
			})();
		}
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
			const currentLength = tables.Image.state.length;
			await Promise.all(
				files.map(async (file, index) => {
					const id = imageId(currentLength + index);
					try {
						await tables.Image.set({
							id,
							filename: file.name,
							addedAt: formatISO(new Date()),
							metadata: {},
							bufferExists: false,
							contentType: file.type
						});
						await writeImage(file, id);
					} catch (error) {
						console.error(error);
						erroredImages.set(id, error?.toString() ?? 'Erreur inattendue');
					}
				})
			);
		}}
	>
		<section class="observations" class:empty={!images.length}>
			<AreaObservations
				bind:selection={uiState.selection}
				{images}
				errors={erroredImages}
				loadingText="Analyse…"
				ondelete={async (id) => {
					await tables.Image.remove(id);
					await tables.Observation.remove(id);
					await db.drop('ImageFile', imageIdToFileId(id));
				}}
			/>
			{#if !images.length}
				<p>Cliquer ou déposer des images ici</p>
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

	.loading {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
		justify-content: center;
		align-items: center;
		height: 100vh;
		/* Logo size */
		--size: 5em;
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
