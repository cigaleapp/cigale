<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import { toPixelCoords as _toPixelCoords, toTopLeftCoords } from '$lib/BoundingBoxes.svelte';
	import { tables } from '$lib/idb.svelte';
	import {
		deleteImageFile,
		imageBufferWasSaved,
		imageIdToFileId,
		imageIsClassified
	} from '$lib/images';
	import { classificationInferenceSettings } from '$lib/inference';
	import Logo from '$lib/Logo.svelte';
	import { storeMetadataValue } from '$lib/metadata.js';
	import { deleteObservation, ensureNoLoneImages } from '$lib/observations';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { seo } from '$lib/seo.svelte';
	import { PROCEDURES } from '$lib/service-worker-procedures.js';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { fetchHttpRequest } from '$lib/utils';
	import { onMount } from 'svelte';
	import * as Swarpc from 'swarpc';

	seo({ title: 'Classification' });

	const swarp = Swarpc.Client(PROCEDURES);

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

	let classifmodelLoaded = $state(false);
	let classifModelLoadingError = $state(null);
	let classmapping = $state([]);
	async function loadClassifModel() {
		// If the model is already loaded, we don't need to load it again
		if (classifmodelLoaded) return;
		if (!uiState.currentProtocol) return;
		if (!uiState.classificationInferenceAvailable) return;

		const settings = classificationInferenceSettings(
			uiState.currentProtocol,
			uiState.selectedClassificationModel
		);
		if (!settings) {
			toasts.error(
				`Aucun paramètre d'inférence défini pour le modèle ${uiState.selectedClassificationModel} sur le protocole ${uiState.currentProtocol.name}`
			);
			return;
		}

		classmapping = await fetchHttpRequest(settings.classmapping, {
			cacheAs: 'model',
			onProgress({ transferred, total }) {
				if (total === 0) return;
				modelLoadingProgress = 0.25 * (transferred / total);
			}
		})
			.then((res) => res.text())
			.then((text) => text.split(/\r?\n/).filter(Boolean));

		await swarp
			.loadModel(
				{
					request: settings.model,
					task: 'classification'
				},
				(progress) => {
					modelLoadingProgress = 0.25 + 0.75 * (progress.transferred / progress.total);
				}
			)
			.then(() => {
				toasts.success('Modèle de classification chargé');
				classifmodelLoaded = true;
			})
			.catch((error) => {
				console.error(error);
				toasts.error('Erreur lors du chargement du modèle de classification');
			});
	}
	/**
	 * @param {string} id
	 * @param {object} image
	 * @param {string} image.filename
	 * @param {import('$lib/database').MetadataValues} image.metadata
	 */
	async function analyzeImage(id, { filename, metadata }) {
		if (!uiState.currentProtocol) {
			throw new Error('Aucun protocole sélectionné');
		}

		if (!uiState.classificationMetadataId) {
			console.warn(
				'No metadata with neural inference defined, not analyzing image. Configure neural inference on a enum metadata (set metadata.<your metadata id>.infer.neural) if this was not intentional.'
			);
			return;
		}

		console.log('Analyzing image', id, filename);

		const { scores } = await swarp.classify({
			fileId: imageIdToFileId(id),
			taskSettings: classificationInferenceSettings(
				uiState.currentProtocol,
				uiState.selectedClassificationModel
			),
			cropbox: toPixelCoords(
				toTopLeftCoords(
					/** @type {undefined | import('$lib/metadata.js').RuntimeValue<'boundingbox'>} */
					(metadata[uiState.cropMetadataId]?.value) ?? { x: 0, y: 0, w: 1, h: 1 }
				)
			)
		});

		console.log('Scores for image', id, scores);

		const results = scores
			.map((score, i) => ({
				confidence: score,
				value: classmapping[i]
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

			await storeMetadataValue({
				...metadataValue,
				metadataId: uiState.classificationMetadataId
			});
		}
	}

	let analyzingAllImages = $state(false);

	async function analyzeAllImages() {
		if (analyzingAllImages) return;
		analyzingAllImages = true;
		console.log('analyzeAllImages', tables.Image.state.length);
		for (const image of tables.Image.state) {
			if (
				imageBufferWasSaved(image) &&
				!imageIsClassified(image) &&
				!uiState.loadingImages.has(image.id)
			) {
				uiState.loadingImages.add(image.id);

				await analyzeImage(image.id, image)
					.catch((error) => {
						console.error(error);
						erroredImages.set(image.id, error?.toString() ?? 'Erreur inattendue');
					})
					.finally(() => {
						uiState.loadingImages.delete(image.id);
					});
			}
		}

		analyzingAllImages = false;
	}

	$effect(() => {
		if (!uiState.classificationInferenceAvailable) return;
		if (!classifmodelLoaded) return;
		if (classifModelLoadingError) return;
		void analyzeAllImages();
	});

	onMount(() => {
		void loadClassifModel()
			.catch((error) => {
				classifModelLoadingError = error?.toString() ?? 'Erreur inattendue';
			})
			.finally(() => {
				classifmodelLoaded = true;
			});
	});

	$effect(() => {
		if (!uiState.setSelection) return;
		void ensureNoLoneImages();
	});

	$effect(() => {
		if (!uiState.classificationMetadataId) return;
		if (!uiState.classificationInferenceAvailable) return;
		uiState.processing.total = tables.Image.state.length;
		uiState.processing.done = tables.Image.state.filter(
			(img) => img.metadata[uiState.classificationMetadataId ?? '']
		).length;
	});
</script>

{#snippet modelsource()}
	{@const { model } = uiState.classificationModels[uiState.selectedClassificationModel]}
	{@const url = new URL(typeof model === 'string' ? model : model?.url)}
	<a href={url.toString()} target="_blank">
		<code>{url.pathname.split('/').at(-1)}</code>
	</a>
{/snippet}

{#if !classifmodelLoaded}
	<section class="loading">
		<Logo loading />
		<p>Chargement du modèle de classification</p>
		<p class="source">{@render modelsource()}</p>
		<div class="progressbar">
			<ProgressBar percentage alwaysActive progress={modelLoadingProgress} />
		</div>
	</section>
{:else if !classifModelLoadingError}
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
{:else}
	<section class="loading errored">
		<Logo variant="error" />
		<h2>Oops!</h2>
		<p>Impossible de charger le modèle de classification</p>
		<p class="source">{@render modelsource()}</p>
		<p class="message">{classifModelLoadingError}</p>
	</section>
{/if}

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
