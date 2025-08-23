<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import Dropzone from '$lib/Dropzone.svelte';
	import { tables } from '$lib/idb.svelte';
	import { deleteImageFile, imageFileIds, imageIsAnalyzed } from '$lib/images';
	import Logo from '$lib/Logo.svelte';
	import { deleteObservation } from '$lib/observations';
	import { m } from '$lib/paraglide/messages.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { cancelTask, importMore } from '$lib/queue.svelte.js';
	import { getSettings } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte';

	const { data } = $props();

	const fileIds = $derived(imageFileIds(tables.Image.state));

	const images = $derived(
		toAreaObservationProps(fileIds, [], [], {
			isQueued: (fileId) => typeof fileId === 'string' && uiState.queuedImages.has(fileId),
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

	const allImages = $derived(
		[
			...images,
			...uiState.processing.files.map(({ name, id }) => ({
				id,
				virtual: true,
				image: '',
				title: name,
				stacksize: 1,
				loading: uiState.loadingImages.has(id) ? +Infinity : -Infinity,
				boundingBoxes: [],
				addedAt: new Date()
			}))
		]
			.toSorted((a, b) => a.id.localeCompare(b.id))
			.map((props, i) => ({
				...props,
				index: i
			}))
	);

	const empty = $derived(allImages.length === 0);

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
		onfiles={({ files }) => importMore(files)}
	>
		<section class="observations" class:empty>
			<AreaObservations
				bind:selection={uiState.selection}
				images={allImages}
				errors={uiState.erroredImages}
				sort={getSettings().gallerySort}
				loadingText={m.analyzing()}
				ondelete={async (id) => {
					cancelTask(id, 'Cancelled by user');
					uiState.processing.removeFile(id);
					await deleteObservation(id);
					await deleteImageFile(id);
				}}
			/>
			{#if empty}
				<div class="empty-state">
					<Logo variant="empty" />
					<p>{m.click_or_drop_images_or_export()}</p>
				</div>
			{/if}
		</section>
	</Dropzone>
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
		flex-direction: column;
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
