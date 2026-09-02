<script lang="ts">
	import type { NeuralModelSelector } from '$lib/schemas/sessions.js';

	import { dequal } from 'dequal';
	import { watch } from 'runed';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import { databaseHandle } from '$lib/idb.svelte.js';
	import { loadModel } from '$lib/inference.js';
	import Logo from '$lib/Logo.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { uiState } from '$lib/uistate.svelte.js';
	import { isAbortError } from '$lib/utils.js';

	const { data, children } = $props();

	let modelLoadingProgress = $state(0);
	let modelLoaded = $state(false);
	// let modelLoadingError = $state();
	let modelAbortController = new AbortController();
	let cropModelLoadPromise: Promise<void> | undefined = undefined;
	let requestedCropModel = $state({ kind: 'disabled' });

	async function loadCropperModel(selectedModel: (typeof NeuralModelSelector)['infer']) {
		// Prevent multiple loads
		if (!uiState.currentProtocol) return;
		if (!uiState.cropInferenceAvailable) return;

		modelAbortController.abort();
		// TODO: use in page.svelte to prevent starting inferences if model didnt load
		// modelLoadingError = undefined;
		modelAbortController = new AbortController();

		await loadModel({
			alreadyLoadedSessions: uiState.loadedInferenceSessions,
			db: databaseHandle(),
			swarpc: data.swarpc,
			abortSignal: modelAbortController.signal,
			protocolId: uiState.currentProtocol.id,
			selector: selectedModel,
			metadataId: uiState.cropMetadataId,
			onProgress(p) {
				modelLoadingProgress = p;
			},
		});
	}

	function loadSelectedCropModel() {
		const selector = uiState.selectedCropModel;

		if (cropModelLoadPromise && dequal(selector, requestedCropModel)) {
			return cropModelLoadPromise;
		}

		requestedCropModel = selector;
		modelLoaded = false;

		cropModelLoadPromise = loadCropperModel(selector)
			.catch((error) => {
				// modelLoadingError = error;
				if (isAbortError(error)) return;
				console.error(error);
				toasts.error('Erreur lors du chargement du modèle de détection');
			})
			.then(() => {
				modelLoaded = true;
			})
			.finally(() => {
				if (dequal(selector, requestedCropModel)) {
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
		{#if uiState.selectedCropModelUrl}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={uiState.selectedCropModelUrl.toString()} target="_blank">
				<code>{uiState.selectedCropModelUrl.pathname.split('/').at(-1)}</code>
			</a>
		{:else}
			{uiState.selectedCropModelSettings?.name}
		{/if}
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
