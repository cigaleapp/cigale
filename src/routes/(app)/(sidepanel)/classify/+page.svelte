<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import { toPixelCoords, toTopLeftCoords } from '$lib/BoundingBoxes.svelte';
	import * as db from '$lib/idb.svelte';
	import { tables } from '$lib/idb.svelte';
	import {
		deleteImage,
		imageBufferWasSaved,
		imageIdToFileId,
		imageIsCLassified
	} from '$lib/images';
	import {
		classify,
		loadModel,
		MODELCLASSIFPATH,
		TARGETHEIGHT,
		TARGETWIDTH,
		torawpath
	} from '$lib/inference';
	import { applyBBOnTensor, imload } from '$lib/inference_utils';
	import Logo from '$lib/Logo.svelte';
	import { deleteObservation, ensureNoLoneImages } from '$lib/observations';
	import { uiState } from '$lib/state.svelte';
	import { setSpeciesWithLineage } from '$lib/taxonomy';
	import { toasts } from '$lib/toasts.svelte';

	const erroredImages = $derived(uiState.erroredImages);

	/** @type {Array<{ index: number, image: string, title: string ,id: string, stacksize: number, loading?: number }>} */
	const images = $derived(
		toAreaObservationProps(tables.Image.state, tables.Observation.state, {
			previewURL: (image) =>
				uiState.getPreviewURL(image, 'cropped') ?? uiState.getPreviewURL(image, 'full'),
			showBoundingBoxes: (image) => !uiState.hasPreviewURL(image, 'cropped'),
			isLoaded: (image) =>
				imageBufferWasSaved(image) && uiState.hasPreviewURL(image) && imageIsCLassified(image)
		})
	);

	let classifmodel = $state();
	async function loadClassifModel() {
		classifmodel = await loadModel(true);
		toasts.success('Modèle de classification chargé');
	}
	/**
	 * @param {ArrayBuffer} buffer
	 * @param {string} id
	 * @param {object} image
	 * @param {string} image.filename
	 * @param {import('$lib/database').MetadataValues} image.metadata
	 */
	async function analyzeImage(buffer, id, { filename, metadata }) {
		if (!classifmodel) {
			toasts.error(
				'Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer'
			);
			return 0;
		}

		console.log('Analyzing image', id, filename);

		//@ts-ignore
		/** @type {ort.Tensor}*/
		let img = await imload([buffer], TARGETWIDTH, TARGETHEIGHT);
		const { x, y, width, height } = toPixelCoords(
			toTopLeftCoords(
				/** @type {import('$lib/metadata.js').RuntimeValue<'boundingbox'>} */
				(metadata.crop.value)
			)
		);
		let bbList = [x, y, width, height];

		//@ts-ignore
		/** @type {ort.Tensor}*/
		const nimg = await applyBBOnTensor(bbList, img);
		// TODO persist after page reload?
		uiState.croppedPreviewURLs.set(imageIdToFileId(id), nimg.toDataURL());

		const output_classif = await classify([[nimg]], classifmodel, uiState, 0);
		const species = output_classif[0];
		const confs = output_classif[1];

		if (output_classif[0].length == 0) {
			console.warn('No species detected');
			return 0;
		} else {
			await setSpeciesWithLineage({
				subjectId: id,
				species: species[0][0].toString(),
				// @ts-ignore
				confidence: confs[0][0],
				// @ts-ignore
				alternatives: species[0]
					.slice(1)
					.map((s, i) => ({ value: s.toString(), confidence: confs[0][i + 1] }))
			});
		}
	}

	$effect(() => {
		if (!uiState.setSelection) return;
		void ensureNoLoneImages();
	});

	$effect(
		() =>
			void (async () => {
				if (!classifmodel) return;
				for (const image of tables.Image.state) {
					if (
						imageBufferWasSaved(image) &&
						!imageIsCLassified(image) &&
						!uiState.loadingImages.has(image.id)
					) {
						uiState.loadingImages.add(image.id);

						try {
							const file = await db.get('ImagePreviewFile', imageIdToFileId(image.id));
							if (!file) {
								console.log('pas de fichier ..?');
								return;
							}
							let code = await analyzeImage(file.bytes, image.id, image);
							if (code == 0) {
								erroredImages.set(image.id, "Erreur inattendue l'ors de la classification");
							}
						} catch (error) {
							console.error(error);
							erroredImages.set(image.id, error?.toString() ?? 'Erreur inattendue');
						} finally {
							uiState.loadingImages.delete(image.id);
						}
					}
				}
			})()
	);

	$effect(() => {
		uiState.processing.total = tables.Image.state.length;
		uiState.processing.done = tables.Image.state.filter((img) => img.metadata.species).length;
	});
</script>

{#snippet modelsource()}
	<a href={torawpath(MODELCLASSIFPATH)} target="_blank">
		<code>{MODELCLASSIFPATH}</code>
	</a>
{/snippet}

{#await loadClassifModel()}
	<section class="loading">
		<Logo loading />
		<p>Chargement du modèle de classification</p>
		<p class="source">{@render modelsource()}</p>
	</section>
{:then _}
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
			<p>Cliquer ou déposer des images ici</p>
		{/if}
	</section>
{:catch error}
	<section class="loading errored">
		<Logo variant="error" />
		<h2>Oops!</h2>
		<p>Impossible de charger le modèle de classification</p>
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
