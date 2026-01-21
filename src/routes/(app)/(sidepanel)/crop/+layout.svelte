<script>
	import { fade } from 'svelte/transition';

	import { loadModel } from '$lib/inference.js';
	import Logo from '$lib/Logo.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { isDebugMode } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte';

	const { data, children } = $props();

	let modelLoadingProgress = $state(0);

	/**
	 * @param {number} selectedModel
	 */
	async function loadCropperModel(selectedModel) {
		// Prevent multiple loads
		if (!uiState.currentProtocol) return;
		if (!uiState.cropInferenceAvailable) return;
		const cropModel = uiState.currentProtocol.crop.infer?.[selectedModel]?.model;
		if (!cropModel) return;

		await loadModel(data.swarpc, 'detection', {
			protocolId: uiState.currentProtocol.id,
			requests: { model: cropModel },
			onProgress(p) {
				modelLoadingProgress = p;
			}
		}).catch((error) => {
			console.error(error);
			toasts.error('Erreur lors du chargement du modèle de détection');
		});
	}
</script>

{#snippet modelsource()}
	{#if uiState.cropInferenceAvailable}
		{@const { model } = uiState.cropModels[uiState.selectedCropModel]}
		{@const url = new URL(typeof model === 'string' ? model : model?.url)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={url.toString()} target="_blank">
			<code>{url.pathname.split('/').at(-1)}</code>
		</a>
	{/if}
{/snippet}

{#await loadCropperModel(uiState.selectedCropModel)}
	<section class="loading" in:fade={{ duration: 100 }}>
		<Logo loading />
		<p>Chargement du modèle de recadrage…</p>
		<p class="source">{@render modelsource()}</p>
		<div class="progressbar">
			<ProgressBar percentage alwaysActive progress={modelLoadingProgress} />
		</div>
	</section>
{:then _}
	{@render children()}
{:catch error}
	<section class="loading errored">
		<Logo variant="error" />
		<h2>Oops!</h2>
		<p>Impossible de charger le modèle de recadrage</p>
		<p class="source">{@render modelsource()}</p>
		<p class="message">{error?.toString() ?? 'Erreur inattendue'}</p>
		{#if isDebugMode()}
			<pre>
					{error?.stack ?? '(no stack trace available)'}
				</pre>
		{/if}
	</section>
{/await}

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

	.loading.errored {
		gap: 0.5em;
	}

	.loading.errored *:not(p.message) {
		color: var(--fg-error);
	}
</style>
