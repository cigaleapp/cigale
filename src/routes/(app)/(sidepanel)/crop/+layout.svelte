<script>
	import Logo from '$lib/Logo.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { isDebugMode } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte';

	const { data, children } = $props();

	let modelLoadingProgress = $state(0);
	let cropperModelLoaded = $state(false);
	async function loadCropperModel() {
		// Prevent multiple loads
		if (cropperModelLoaded) return;
		if (!uiState.currentProtocol) return;
		if (!uiState.cropInferenceAvailable) return;
		const cropModel = uiState.currentProtocol.crop.infer?.[uiState.selectedCropModel]?.model;
		if (!cropModel) return;

		await data.swarpc
			.loadModel(
				{
					protocolId: uiState.currentProtocol.id,
					request: cropModel,
					task: 'detection'
				},
				(progress) => {
					modelLoadingProgress = progress;
				}
			)
			.catch((error) => {
				console.error(error);
				toasts.error(m.error_loading_detection_model());
			});

		cropperModelLoaded = true;
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

{#await loadCropperModel()}
	<section class="loading">
		<Logo loading />
		<p>{m.loading_cropping_model()}</p>
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
		<p>{m.cannot_load_cropping_model()}</p>
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
