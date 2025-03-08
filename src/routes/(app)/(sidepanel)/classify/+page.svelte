<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import * as db from '$lib/idb.svelte';
	import { tables } from '$lib/idb.svelte';
	import { imageBufferWasSaved, imageIdToFileId, imageIsCLassified, imageIsCropped } from '$lib/images';
	import Logo from '$lib/Logo.svelte';
	import { storeMetadataValue } from '$lib/metadata';
	import { toasts } from '$lib/toasts.svelte';
	import { loadModel, MODELCLASSIFPATH, MODELDETECTPATH , classify, TARGETHEIGHT, TARGETWIDTH} from '$lib/inference';
	import {imload, applyBBOnTensor} from '$lib/inference_utils';
	import { uiState } from '$lib/state.svelte';

	const previewURLs = $derived(uiState.previewURLs);
	const erroredImages = $derived(uiState.erroredImages);

	/** @type {Array<{ index: number, image: string, title: string ,id: string, stacksize: number, loading?: number }>} */
	const images = $derived(toAreaObservationProps(tables.Image.state, tables.Observation.state));

	let classifmodel = $state();
	async function loadClassifModel() {
		classifmodel = await loadModel(true);
		toasts.success('Modèle de recadrage chargé');
	}
	/**
	 * @param {ArrayBuffer} buffer
	 * @param {string} id
	 * @param {object} image
	 * @param {string} image.contentType
	 * @param {string} image.filename
	 * @param {object} image.metadata
	 */
	async function analyzeImage(buffer, id, { contentType, filename ,metadata}) {
		if (!classifmodel) {
			toasts.error(
				'Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer'
			);
			return 0;
		}

		console.log("Analyzing image", id, filename);

		//@ts-ignore
		/** @type {ort.Tensor}*/
		let img = await imload([buffer], TARGETWIDTH,TARGETHEIGHT);
		// @ts-ignore
		let bbList = [metadata.crop.value.x, metadata.crop.value.y, metadata.crop.value.width, metadata.crop.value.height];
		
		//@ts-ignore
		/** @type {ort.Tensor}*/
		const nimg = await applyBBOnTensor(bbList,img);
		const output_classif = await classify([[nimg]],classifmodel,uiState, 0);
		const species = output_classif[0]
		const confs = output_classif[1]

		if (output_classif[0].length == 0) {
			console.warn("No species detected");
			return 0;
		}else {
			await storeMetadataValue({
				subjectId: id,
				metadataId: 'species',
				type: 'enum',
				value: species[0][0].toString(),
				// @ts-ignore
				confidence: confs[0][0],
				// @ts-ignore
				alternatives: species[0].slice(1).map((s, i) => ({ value: s.toString(), confidence: confs[0][i + 1] })),

			});
		}
	}

	$effect(() => {
		if (!classifmodel) return;
		for (const image of tables.Image.state) {
			if (imageBufferWasSaved(image) && !imageIsCLassified(image) && !uiState.loadingImages.has(image.id)) {
				$inspect(uiState);
				uiState.loadingImages.add(image.id);

				void (async () => {
					try {
						const file = await db.get('ImageFile', imageIdToFileId(image.id));
						if (!file) {console.log("pas de fichier ..?");return;}
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
				})();
			}
		}
	});

	$effect(() => {
		uiState.processing.total = tables.Image.state.length;
		uiState.processing.done = tables.Image.state.filter((img) => img.metadata.species).length;
	});
</script>

{#snippet modelsource()}
	<a
		href="https://git.inpt.fr/cigale/cigale.pages.inpt.fr/-/tree/main/models/{MODELCLASSIFPATH}"
		target="_blank"
	>
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
				await tables.Image.remove(id);
				await tables.Observation.remove(id);
				await db.drop('ImageFile', imageIdToFileId(id));
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
