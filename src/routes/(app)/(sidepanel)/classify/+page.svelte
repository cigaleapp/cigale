<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import { toPixelCoords as _toPixelCoords, toTopLeftCoords } from '$lib/BoundingBoxes.svelte';
	import * as db from '$lib/idb.svelte';
	import { tables } from '$lib/idb.svelte';
	import {
		deleteImageFile,
		imageBufferWasSaved,
		imageIdToFileId,
		imageIsClassified
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
	import { metadataById, storeMetadataValue } from '$lib/metadata.js';
	import { deleteObservation, ensureNoLoneImages } from '$lib/observations';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { seo } from '$lib/seo.svelte';
	import { uiState } from '$lib/state.svelte';
	import { setTaxonAndInferParents } from '$lib/taxonomy';
	import { toasts } from '$lib/toasts.svelte';

	seo({ title: 'Classification' });

	const erroredImages = $derived(uiState.erroredImages);
	const toPixelCoords = $derived(_toPixelCoords(uiState.currentProtocol));

	/** @type {Array<{ index: number, image: string, title: string ,id: string, stacksize: number, loading?: number }>} */
	const images = $derived(
		toAreaObservationProps([], tables.Image.state, tables.Observation.state, {
			showBoundingBoxes: () => false,
			isLoaded: (item) =>
				typeof item === 'string'
					? false
					: uiState.hasPreviewURL(item.fileId) && imageIsClassified(item)
		})
	);

	/** loaded and total bytes counts, set and updated by loadModel() */
	let modelLoadingProgress = $state(0);

	let classifmodel = $state();
	async function loadClassifModel() {
		if (!uiState.currentProtocol) return;
		classifmodel = await loadModel(
			uiState.currentProtocol,
			'classification',
			({ transferred, total }) => {
				if (total === 0) return;
				modelLoadingProgress = transferred / total;
			}
		);
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
		if (!uiState.currentProtocol) {
			throw new Error('Aucun protocole sélectionné');
		}
		if (!classifmodel) {
			throw new Error(
				'Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer'
			);
		}

		console.log('Analyzing image', id, filename);

		const inputSettings = uiState.currentProtocol.crop?.infer?.input ?? {
			width: TARGETWIDTH,
			height: TARGETHEIGHT
		};

		// We gotta normalize since this img will be used to set a cropped Preview URL -- classify() itself takes care of normalizing (or not) depending on the protocol
		let img = await imload([buffer], { ...inputSettings, normalized: true });
		const { x, y, width, height } = toPixelCoords(
			toTopLeftCoords(
				/** @type {import('$lib/metadata.js').RuntimeValue<'boundingbox'>} */
				(metadata[uiState.cropMetadataId].value)
			)
		);

		const nimg = await applyBBOnTensor([x, y, width, height], img);

		// TODO persist after page reload?
		uiState.setPreviewURL(id, nimg.toDataURL(), 'cropped');

		const [[scores]] = await classify(uiState.currentProtocol, [[nimg]], classifmodel, uiState, 0);

		const results = scores
			.map((score, i) => ({
				confidence: score,
				value: i.toString()
			}))
			.sort((a, b) => b.confidence - a.confidence)
			.slice(0, 3)
			.filter(({ confidence }) => confidence > 0.005);

		if (!results.length) {
			throw new Error('No species detected');
		} else {
			const [firstChoice, ...alternatives] = results;
			if (!uiState.currentProtocol) return;
			const metadataValue = /** @type {const} */ ({
				subjectId: id,
				...firstChoice,
				alternatives
			});

			if ('taxonomic' in (metadataById(uiState.classificationMetadataId) ?? {})) {
				await setTaxonAndInferParents({
					...metadataValue,
					protocol: uiState.currentProtocol,
					metadataId: uiState.classificationMetadataId
				});
			} else {
				await storeMetadataValue({
					...metadataValue,
					metadataId: uiState.classificationMetadataId
				});
			}
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
						!imageIsClassified(image) &&
						!uiState.loadingImages.has(image.id)
					) {
						uiState.loadingImages.add(image.id);

						try {
							const file = await db.get('ImagePreviewFile', imageIdToFileId(image.id));
							if (!file) throw new Error('No file ..?');
							await analyzeImage(file.bytes, image.id, image);
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
		uiState.processing.done = tables.Image.state.filter(
			(img) => img.metadata[uiState.classificationMetadataId]
		).length;
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
		<div class="progressbar">
			<ProgressBar percentage alwaysActive progress={modelLoadingProgress} />
		</div>
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
				await deleteImageFile(id);
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
		padding: 2.5em;
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

	.loading .progressbar {
		width: 100%;
		max-width: 20em;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		align-items: center;
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
