<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import Dropzone from '$lib/Dropzone.svelte';
	import { errorMessage } from '$lib/i18n.js';
	import * as db from '$lib/idb.svelte';
	import { tables } from '$lib/idb.svelte';
	import { deleteImageFile, imageFileIds, imageIdToFileId, imageIsAnalyzed } from '$lib/images';
	import Logo from '$lib/Logo.svelte';
	import { deleteObservation } from '$lib/observations';
	import { m } from '$lib/paraglide/messages.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { getSettings } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte';
	import { importMore, inferBoundingBoxes } from './lib.js';

	const { data } = $props();

	const fileIds = $derived(imageFileIds(tables.Image.state));

	const images = $derived(
		toAreaObservationProps(fileIds, [], [], {
			isLoaded: (fileId) =>
				!uiState.cropInferenceAvailable ||
				Boolean(
					typeof fileId === 'string' &&
						uiState.currentProtocol &&
						uiState.hasPreviewURL(fileId) &&
						imageIsAnalyzed(uiState.currentProtocol, fileId)
				)
		})
	);

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
				({ transferred, total }) => {
					modelLoadingProgress = transferred / total;
				}
			)
			.then(() => {
				toasts.success(m.detection_model_loaded());
			})
			.catch((error) => {
				console.error(error);
				toasts.error(m.error_loading_detection_model());
			});

		cropperModelLoaded = true;
	}

	$effect(() => {
		if (!cropperModelLoaded) return;
		if (!uiState.currentProtocol) return;
		for (const imageFileId of fileIds) {
			if (
				!imageIsAnalyzed(uiState.currentProtocol, imageFileId) &&
				!uiState.loadingImages.has(imageFileId)
			) {
				void (async () => {
					try {
						const file = await db.get('ImagePreviewFile', imageIdToFileId(imageFileId));
						if (!file) return;
						uiState.loadingImages.add(imageFileId);
						await inferBoundingBoxes(data.swarpc, file);
					} catch (error) {
						console.error(error);
						uiState.erroredImages.set(imageFileId, errorMessage(error));
					} finally {
						uiState.loadingImages.delete(imageFileId);
					}
				})();
			}
		}
	});

	$effect(() => {
		uiState.processing.done = uiState.processing.total - uiState.processing.files.length;
	});
</script>

{#snippet modelsource()}
	{#if uiState.cropInferenceAvailable}
		{@const { model } = uiState.cropModels[uiState.selectedCropModel]}
		{@const url = new URL(typeof model === 'string' ? model : model?.url)}
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
	<Dropzone
		filetypes={[
			'image/jpeg',
			'application/zip',
			'image/png',
			'image/tiff',
			'.cr2',
			'.rw2',
			'.dng',
			'.crw',
			'.raw',
			'.cr3'
		]}
		clickable={images.length === 0}
		onfiles={async ({ files }) => await importMore(data.swarpc, files)}
	>
		<section class="observations" class:empty={!images.length}>
			<AreaObservations
				bind:selection={uiState.selection}
				images={[
					...images,
					...uiState.processing.files.map((filename, i) => ({
						image: '',
						title: filename,
						id: `loading_${i}`,
						index: images.length + i,
						stacksize: 1,
						loading: -1,
						boundingBoxes: []
					}))
				]}
				errors={uiState.erroredImages}
				loadingText={m.analyzing()}
				ondelete={async (id) => {
					await deleteObservation(id);
					await deleteImageFile(id);
				}}
			/>
			{#if !images.length}
				<div class="empty-state">
					<Logo variant="empty" />
					<p>{m.click_or_drop_images_or_export()}</p>
				</div>
			{/if}
		</section>
	</Dropzone>
	{#if getSettings().showTechnicalMetadata}
		<section class="debug">
			{#snippet displayIter(set)}
				{'{'} {[...$state.snapshot(set)].join(' ')} }
			{/snippet}
			<code>
				loading {@render displayIter(uiState.loadingImages)} <br />
				errored {@render displayIter(uiState.erroredImages.keys())} <br />
				preview urls {@render displayIter(uiState.previewURLs.keys())} <br />
			</code>
		</section>
	{/if}
{:catch error}
	<section class="loading errored">
		<Logo variant="error" />
		<h2>Oops!</h2>
		<p>{m.cannot_load_cropping_model()}</p>
		<p class="source">{@render modelsource()}</p>
		<p class="message">{error?.toString() ?? 'Erreur inattendue'}</p>
		{#if getSettings().showTechnicalMetadata}
			<pre>
				{error?.stack ?? '(no stack trace available)'}
			</pre>
		{/if}
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

	.loading,
	.empty-state {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
		justify-content: center;
		align-items: center;
		/* Logo size */
		--size: 5em;
		max-width: 20em;
		margin: auto;
	}

	.loading {
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
