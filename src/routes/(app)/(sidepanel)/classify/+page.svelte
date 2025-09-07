<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import { classificationInferenceSettings } from '$lib/classification.svelte.js';
	import { errorMessage } from '$lib/i18n';
	import { tables } from '$lib/idb.svelte';
	import {
		deleteImageFile,
		imageBufferWasSaved,
		imageIdToFileId,
		imageIsClassified,
		isValidImageId
	} from '$lib/images';
	import Logo from '$lib/Logo.svelte';
	import { deleteObservation, ensureNoLoneImages } from '$lib/observations';
	import { m } from '$lib/paraglide/messages.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { cancelTask, classifyMore } from '$lib/queue.svelte.js';
	import { seo } from '$lib/seo.svelte';
	import { getSettings, isDebugMode } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { onMount } from 'svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { goto } from '$app/navigation';

	seo({ title: m.classification() });

	const { data } = $props();

	const errors = $derived.by(() => {
		/** @type {typeof uiState.erroredImages} */
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const errors = new Map();
		for (const [imageId, error] of uiState.erroredImages.entries()) {
			errors.set(imageId, error);
			for (const obs of tables.Observation.state) {
				if (obs.images.includes(imageId)) errors.set(obs.id, error);
			}
		}
		return errors;
	});

	/** @type {Array<{ index: number, image: string, title: string ,id: string, stacksize: number, loading?: number|undefined, addedAt: Date }>} */
	const images = $derived(
		toAreaObservationProps([], tables.Image.state, tables.Observation.state, {
			showBoundingBoxes: () => false,
			isQueued: (item) =>
				typeof item === 'string'
					? uiState.queuedImages.has(item)
					: uiState.queuedImages.has(item.id),
			isLoaded: (item) =>
				uiState.classificationInferenceAvailable
					? typeof item === 'string'
						? false
						: uiState.hasPreviewURL(item.fileId) &&
							!uiState.loadingImages.has(item.id) &&
							!uiState.queuedImages.has(item.id)
					: true
		})
	);

	/** loaded and total bytes counts, set and updated by loadModel() */
	let modelLoadingProgress = $state(0);

	let classifmodelLoaded = $state(false);
	/** @type {Error|undefined}*/
	let classifModelLoadingError = $state();
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
				m.no_inference_params_defined({
					modelName: uiState.selectedClassificationModel,
					protocolName: uiState.currentProtocol.name
				})
			);
			return;
		}

		await data.swarpc
			.loadModel(
				{
					protocolId: uiState.currentProtocol.id,
					request: settings.model,
					classmapping: settings.classmapping,
					task: 'classification'
				},
				(progress) => {
					modelLoadingProgress = progress;
				}
			)
			.then(() => {
				classifmodelLoaded = true;
			})
			.catch((error) => {
				console.error(error);
				toasts.error(m.error_loading_classification_model());
			});
	}

	$effect(() => {
		if (!uiState.classificationInferenceAvailable) return;
		if (!classifmodelLoaded) return;
		if (classifModelLoadingError) return;

		const toClassify = tables.Image.state.filter(
			(image) =>
				imageBufferWasSaved(image) &&
				!imageIsClassified(image) &&
				!uiState.loadingImages.has(image.id)
		);

		classifyMore(toClassify.map((i) => i.id));
	});

	onMount(() => {
		void loadClassifModel()
			.catch((error) => {
				classifModelLoadingError = error;
			})
			.finally(() => {
				classifmodelLoaded = true;
			});
	});

	$effect(() => {
		if (!uiState.setSelection) return;
		void ensureNoLoneImages();
	});
</script>

{#snippet modelsource()}
	{#if uiState.classificationInferenceAvailable}
		{@const { model } = uiState.classificationModels[uiState.selectedClassificationModel]}
		{@const url = new URL(typeof model === 'string' ? model : model?.url)}
		<a href={url.toString()} target="_blank">
			<code>{url.pathname.split('/').at(-1)}</code>
		</a>
	{/if}
{/snippet}

{#if !classifmodelLoaded}
	<section class="loading">
		<Logo loading />
		<p>{m.loading_classification_model()}</p>
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
			{errors}
			sort={getSettings().gallerySort}
			loadingText={m.analyzing()}
			onretry={(id) => {
				uiState.erroredImages.delete(id);
				const imageIds = tables.Observation.getFromState(id)?.images;
				if (imageIds) {
					classifyMore(imageIds);
				} else {
					toasts.error('Observation is empty (should not happen)');
				}
			}}
			ondelete={async (id) => {
				const imageIds = tables.Observation.getFromState(id)?.images ?? [id];
				imageIds.forEach((id) => cancelTask(id, 'Cancelled by user'));
				if (isValidImageId(id)) await deleteImageFile(imageIdToFileId(id));
				await deleteObservation(id, { notFoundOk: true, recursive: true });
			}}
		/>
		{#if !images.length}
			<div class="empty">
				<Logo variant="empty" --size="6em" />
				<p>{m.no_images()}</p>
				<ButtonSecondary onclick={() => goto('#/import')}>
					{m.import_tab()}
				</ButtonSecondary>
			</div>
		{/if}
	</section>
{:else}
	<section class="loading errored">
		<Logo variant="error" />
		<h2>Oops!</h2>
		<p>{m.cannot_load_classification_model()}</p>
		<p class="source">{@render modelsource()}</p>
		<p class="message">{errorMessage(classifModelLoadingError)}</p>
		{#if isDebugMode()}
			<pre class="trace">{classifModelLoadingError?.stack}</pre>
		{/if}
	</section>
{/if}

<style>
	.observations {
		padding: 2.5em;
		display: flex;
		flex-direction: column;
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

	.loading.errored .trace {
		max-width: 80%;
		overflow-x: auto;
		font-size: 0.8em;
	}

	.empty {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}
</style>
