<script lang="ts">
	import type * as DB from '$lib/database.js';
	import type { GalleryItem } from '$lib/gallery.js';
	import type { NamespacedMetadataID } from '$lib/schemas/common.js';

	import { watch } from 'runed';
	import { SvelteSet } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';

	import IconLoaded from '~icons/ri/check-line';
	import AreaObservations from '$lib/AreaObservations.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import CardImage from '$lib/CardImage.svelte';
	import CardObservation from '$lib/CardObservation.svelte';
	import { tables } from '$lib/idb.svelte';
	import { deleteImage, imageBufferWasSaved, imageIsClassified } from '$lib/images';
	import { inferenceModelId, loadModel } from '$lib/inference.js';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import Logo from '$lib/Logo.svelte';
	import { deleteObservation, ensureNoLoneImages, observationMetadata } from '$lib/observations';
	import { goto } from '$lib/paths.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { cancelTask, classifyMore } from '$lib/queue.svelte.js';
	import { seo } from '$lib/seo.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { isAbortError, nonnull } from '$lib/utils.js';

	type Item = GalleryItem<{
		image: DB.Image | undefined;
		observation: DB.Observation | undefined;
		images: DB.Image[];
	}>;

	seo({ title: 'Classification' });

	const { data } = $props();

	const items: Item[] = $derived(
		tables.Observation.state.map((obs) => ({
			id: obs.id,
			sessionId: obs.sessionId,
			addedAt: obs.addedAt,
			name: obs.label,
			metadata: observationMetadata({
				definitions: tables.Metadata.state,
				images: obs.images.map((id) => tables.Image.getFromState(id)).filter(nonnull),
				observation: obs,
			}),
			virtual: false,
			data: {
				image: undefined,
				observation: obs,
				images: obs.images.map((id) => tables.Image.getFromState(id)).filter(nonnull),
			},
		}))
	);

	let unrolledObservation = $state('');

	const unroll: [string, Item[]] = $derived([
		unrolledObservation,
		items
			.find((item) => item.id === unrolledObservation)
			?.data.images.map((img) => ({
				id: img.id,
				name: img.filename,
				addedAt: img.addedAt,
				sessionId: img.sessionId,
				metadata: img.metadata,
				virtual: false,
				data: {
					image: img,
					observation: undefined,
					images: [img],
				},
			})) ?? [],
	]);

	/** Persist across route changes so the same model is not fetched twice. */
	// Use uiState.loadedInferenceSessions which persists on the UIState singleton

	/**
	 * loaded and total bytes counts, set and updated by loadModel()
	 */
	let modelLoadingProgress = $state(0);

	let modelAbortController = new AbortController();
	let classifmodelLoaded = $state(false);
	/** @type {Error|undefined}*/
	let classifModelLoadingError = $state();

	function queueClassificationsIfReady() {
		if (!classifmodelLoaded) return;
		if (classifModelLoadingError) return;
		if (!uiState.classificationInferenceAvailable) return;

		const toClassify = tables.Image.state.filter(
			(image) =>
				imageBufferWasSaved(image) &&
				!imageIsClassified(image) &&
				!uiState.loadingImages.has(image.id) &&
				uiState.cropMetadataValueOf(image)
		);

		classifyMore(toClassify.map((i) => i.id));
	}

	const loadedModels = new SvelteSet<NamespacedMetadataID>();
	async function loadAllClassifModels() {
		const protocol = uiState.currentProtocol;
		if (!protocol) return;
		const protocolId = protocol.id;

		const enabledMetadata = uiState.enabledClassificationMetadata;
		const modelLoads = enabledMetadata.flatMap((metadata) => {
			const modelIndex = uiState.selectedClassificationModels[metadata.id] ?? -1;
			const settings = uiState.allClassificationModels[metadata.id]?.[modelIndex];

			if (!settings) {
				console.warn(`No model found for metadata ${metadata.id} at index ${modelIndex}`);
				return [];
			}

			return [
				{
					metadataId: metadata.id,
					settings,
					sessionId: inferenceModelId(protocolId, settings.model),
				},
			];
		});

		classifmodelLoaded = false;
		modelLoadingProgress = 0;

		// If nothing is enabled, there is nothing to load.
		if (modelLoads.length === 0) {
			classifmodelLoaded = true;
			return;
		}

		const pendingLoads = modelLoads.filter(
			({ sessionId }) => !uiState.loadedInferenceSessions.has(sessionId)
		);
		if (pendingLoads.length === 0) {
			classifmodelLoaded = true;
			queueClassificationsIfReady();
			return;
		}

		if (!uiState.classificationInferenceAvailable) return;

		modelAbortController.abort();
		classifModelLoadingError = undefined;
		modelAbortController = new AbortController();

		try {
			for (let i = 0; i < pendingLoads.length; i++) {
				const { settings, sessionId, metadataId } = pendingLoads[i];
				await loadModel(data.swarpc, 'classification', {
					abortSignal: modelAbortController.signal,
					protocolId,
					requests: {
						model: settings.model,
						classmapping: settings.classmapping,
					},
					onProgress(p) {
						modelLoadingProgress = (i + p) / pendingLoads.length;
					},
				});
				loadedModels.add(metadataId);
				uiState.loadedInferenceSessions.add(sessionId);
			}
		} catch (error) {
			throw error;
		} finally {
			classifmodelLoaded = true;
			queueClassificationsIfReady();
		}
	}

	watch(
		() => [uiState.enabledClassificationMetadata.length, uiState.selectedClassificationModels],
		() => {
			classifmodelLoaded = false;
			void loadAllClassifModels()
				.catch((error) => {
					classifModelLoadingError = error;
					if (isAbortError(error)) return;
					console.error(error);
					if (error instanceof AggregateError) {
						console.error(error.errors);
					}
					toasts.error('Erreur lors du chargement du modèle de classification');
				})
				.finally(() => {
					queueClassificationsIfReady();
				});
		}
	);

	$effect(() => {
		if (!uiState.setSelection) return;
		void ensureNoLoneImages();
	});

	defineKeyboardShortcuts('classification', {
		'$mod+Enter': {
			help: "Classifier l'image sélectionnée en plein écran",
			when: () =>
				uiState.selection.length === 1 &&
				!!tables.Observation.getFromState(uiState.selection[0]),
			async do() {
				let id = uiState.selection.at(0);
				if (!id) return;

				await goto('/(app)/(sidepanel)/o/[observation]/classify', { observation: id });
			},
		},
	});
</script>

{#snippet modelsource()}
	{#if uiState.classificationInferenceAvailable}
		{#each uiState.allClassificationMetadata as metadata (metadata.id)}
			{@const modelIndex = uiState.selectedClassificationModels[metadata.id] ?? 0}
			{@const models = uiState.allClassificationModels[metadata.id]}
			{@const model = models?.[modelIndex]?.model}
			{#if model}
				{@const url = new URL(typeof model === 'string' ? model : model?.url)}
				<div class="is-loaded">
					{#if loadedModels.has(metadata.id)}
						<IconLoaded />
					{/if}
				</div>
				<span class="metadata-label">{metadata.label}: </span>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={url.toString()} target="_blank" title={metadata.id}>
					<code>{url.pathname.split('/').at(-1)}</code>
				</a>
			{/if}
		{/each}
	{/if}
{/snippet}

{#if !classifmodelLoaded}
	<main class="loading" in:fade={{ duration: 100 }}>
		<Logo loading />
		<p>Chargement du modèle de classification</p>
		<p class="source">{@render modelsource()}</p>
		<div class="progressbar">
			<ProgressBar percentage alwaysActive progress={modelLoadingProgress} />
		</div>
	</main>
{:else}
	<main class="observations" class:empty={!items.length} in:fade={{ duration: 100 }}>
		<AreaObservations {items} {unroll} zone="classify">
			{#snippet item({ observation, image, images }, { id })}
				{#if observation}
					<CardObservation
						{observation}
						{images}
						boxes="apply-first"
						loadingStatusText="Analyse…"
						onstacksizeclick={() => {
							unrolledObservation = unrolledObservation === id ? '' : id;
						}}
						ondoubleclick={() => {
							goto('/(app)/(sidepanel)/o/[observation]/classify', {
								observation: observation.id,
							});
						}}
						onretry={() => {
							uiState.erroredImages.delete(id);
							const imageIds = tables.Observation.getFromState(id)?.images;
							if (imageIds) {
								imageIds.forEach((id) => uiState.erroredImages.delete(id));
								classifyMore(imageIds);
							} else {
								toasts.error(`L'observation ${id} est vide`);
							}
						}}
						ondelete={async () => {
							const imageIds = tables.Observation.getFromState(id)?.images ?? [id];
							imageIds.forEach((id) => cancelTask(id, 'Cancelled by user'));
							await deleteObservation(id, { notFoundOk: true, recursive: true });
							await deleteImage(id, undefined, true);
						}}
					/>
				{:else if image}
					<CardImage {image} boxes="apply-first" />
				{/if}
			{/snippet}
		</AreaObservations>
		{#if !items.length}
			<div class="empty">
				<Logo variant="empty" --size="6em" />
				<p>Aucune image</p>
				<ButtonSecondary onclick={() => goto('/import/')}>Importer</ButtonSecondary>
			</div>
		{/if}
	</main>
{/if}

<style>
	.observations {
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
		display: grid;
		grid-template-columns: 2ch max-content max-content;
		gap: 0.25em 1em;
	}

	.loading .is-loaded {
		color: var(--fg-success);
		display: flex;
		align-items: center;
		font-size: 1.2em;
	}

	.loading .metadata-label {
		font-size: 1.2em;
	}

	.empty {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}
</style>
