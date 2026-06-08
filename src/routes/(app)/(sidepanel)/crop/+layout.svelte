<script>
	import { watch } from 'runed';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import { loadModel } from '$lib/inference.js';
	import Logo from '$lib/Logo.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte';
	import { isAbortError } from '$lib/utils.js';

	const { data, children } = $props();

	let modelLoadingProgress = $state(0);
	let modelLoaded = $state(false);
	// let modelLoadingError = $state();
	let modelAbortController = new AbortController();
	let cropModelLoadPromise = undefined;
	let requestedCropModel = -1;
	/**
	 * @param {number} selectedModel
	 */
	async function loadCropperModel(selectedModel) {
		// Prevent multiple loads
		if (!uiState.currentProtocol) return;
		if (!uiState.cropInferenceAvailable) return;
		const cropModel = uiState.cropModels[selectedModel]?.model;
		if (!cropModel) return;

		modelAbortController.abort();
		// TODO: use in page.svelte to prevent starting inferences if model didnt load
		// modelLoadingError = undefined;
		modelAbortController = new AbortController();

		await loadModel(data.swarpc, 'detection', {
			abortSignal: modelAbortController.signal,
			protocolId: uiState.currentProtocol.id,
			requests: { model: cropModel, classmapping: undefined },
			onProgress(p) {
				modelLoadingProgress = p;
			},
		});
	}

	function loadSelectedCropModel(selectedModel = uiState.selectedCropModel) {
		if (cropModelLoadPromise && requestedCropModel === selectedModel) {
			return cropModelLoadPromise;
		}

		requestedCropModel = selectedModel;
		modelLoaded = false;

		cropModelLoadPromise = loadCropperModel(selectedModel)
			.catch((error) => {
				// modelLoadingError = error;
				if (isAbortError(error)) return;
				console.error(error);
				toasts.error('Erreur lors du chargement du modèle de classification');
			})
			.then(() => {
				modelLoaded = true;
			})
			.finally(() => {
				if (requestedCropModel === selectedModel) {
					cropModelLoadPromise = undefined;
				}
			});

		return cropModelLoadPromise;
	}

	onMount(() => {
		void loadSelectedCropModel();
	});

	watch(
		() => uiState.selectedCropModel,
		() => {
			void loadSelectedCropModel();
		}
	);
</script>

{#snippet modelsource()}
	{#if uiState.cropInferenceAvailable}
		{const { model } = uiState.cropModels[uiState.selectedCropModel]}
		{const url = new URL(typeof model === 'string' ? model : model?.url)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={url.toString()} target="_blank">
			<code>{url.pathname.split('/').at(-1)}</code>
		</a>
	{/if}
{/snippet}

{#if !modelLoaded}
	<section class="loading" in:fade={{ duration: 100 }}>
		<Logo loading />
		<p>Chargement du modèle de recadrage…</p>
		<p class="source">{@render modelsource()}</p>
		<div class="progressbar">
			<ProgressBar percentage alwaysActive progress={modelLoadingProgress} />
		</div>
	</section>
{:else}
	{@render children()}
{/if}

<style>
	.loading {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
		justify-content: center;
		align-items: center;
		/* Logo size */
		--size: 5em;
		max-width: 20em;
		margin: auto;
		height: 100vh;
	}

	.loading .source {
		font-size: 0.8em;
	}

	.loading .progressbar {
		width: 100%;
		max-width: 20em;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		align-items: center;
	}
</style>
