<script>
	import { watch } from 'runed';
	import { fade } from 'svelte/transition';

	import AreaObservations from '$lib/AreaObservations.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import CardImage from '$lib/CardImage.svelte';
	import CardObservation from '$lib/CardObservation.svelte';
	import { classificationInferenceSettings } from '$lib/classification.svelte.js';
	import { tables } from '$lib/idb.svelte';
	import {
		deleteImageFile,
		imageBufferWasSaved,
		imageIdToFileId,
		imageIsClassified,
		isValidImageId
	} from '$lib/images';
	import { loadModel } from '$lib/inference.js';
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

	/**
	 * @import * as DB from '$lib/database.js';
	 * @import { GalleryItem } from '$lib/gallery.js';
	 */

	/**
	 * @typedef {GalleryItem<{ image: DB.Image | undefined; observation: DB.Observation | undefined; images: DB.Image[] }>} Item
	 */

	seo({ title: 'Classification' });

	const { data } = $props();

	/** @type {Item[]} */
	const items = $derived(
		tables.Observation.state.map((obs) => ({
			id: obs.id,
			sessionId: obs.sessionId,
			addedAt: obs.addedAt,
			name: obs.label,
			metadata: observationMetadata({
				definitions: tables.Metadata.state,
				images: obs.images.map((id) => tables.Image.getFromState(id)).filter(nonnull),
				observation: obs
			}),
			virtual: false,
			data: {
				image: undefined,
				observation: obs,
				images: obs.images.map((id) => tables.Image.getFromState(id)).filter(nonnull)
			}
		}))
	);

	let unrolledObservation = $state('');

	/** @type {[string, Item[]]} */
	const unroll = $derived([
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
					images: [img]
				}
			})) ?? []
	]);

	/**
	 * loaded and total bytes counts, set and updated by loadModel()
	 */
	let modelLoadingProgress = $state(0);

	let modelAbortController = new AbortController();
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
				`Aucun paramètre d'inférence défini pour le modèle ${uiState.selectedClassificationModel} sur le protocole ${uiState.currentProtocol.name}`
			);
			return;
		}

		modelAbortController.abort();
		classifModelLoadingError = undefined;
		modelAbortController = new AbortController();

		await loadModel(data.swarpc, 'classification', {
			abortSignal: modelAbortController.signal,
			protocolId: uiState.currentProtocol.id,
			requests: {
				model: settings.model,
				classmapping: settings.classmapping
			},
			onProgress(p) {
				modelLoadingProgress = p;
			}
		});
	}

	// TODO fix chunked batching: add a throttle to
	// wait before starting classification batch
	// so that tasks are more likely to be queued together
	$effect(() => {
		if (!uiState.classificationInferenceAvailable) return;
		if (!classifmodelLoaded) return;
		if (classifModelLoadingError) return;

		const toClassify = tables.Image.state.filter(
			(image) =>
				imageBufferWasSaved(image) &&
				!imageIsClassified(image) &&
				!uiState.loadingImages.has(image.id) &&
				(uiState.currentProtocol?.crop.classifyUncropped
					? true
					: uiState.cropMetadataValueOf(image))
		);

		classifyMore(toClassify.map((i) => i.id));
	});

	watch(
		() => uiState.selectedClassificationModel,
		() => {
			classifmodelLoaded = false;
			void loadClassifModel()
				.catch((error) => {
					classifModelLoadingError = error;
					if (isAbortError(error)) return;
					console.error(error);
					toasts.error('Erreur lors du chargement du modèle de classification');
				})
				.then(() => {
					classifmodelLoaded = true;
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
				tables.Observation.getFromState(uiState.selection[0]),
			async do() {
				let id = uiState.selection.at(0);
				if (!id) return;

				await goto('/(app)/(sidepanel)/classify/[observation]', { observation: id });
			}
		}
	});
</script>

{#snippet modelsource()}
	{#if uiState.classificationInferenceAvailable}
		{@const { model } = uiState.classificationModels[uiState.selectedClassificationModel]}
		{@const url = new URL(typeof model === 'string' ? model : model?.url)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={url.toString()} target="_blank">
			<code>{url.pathname.split('/').at(-1)}</code>
		</a>
	{/if}
{/snippet}

{#if !classifmodelLoaded}
	<section class="loading" in:fade={{ duration: 100 }}>
		<Logo loading />
		<p>Chargement du modèle de classification</p>
		<p class="source">{@render modelsource()}</p>
		<div class="progressbar">
			<ProgressBar percentage alwaysActive progress={modelLoadingProgress} />
		</div>
	</section>
{:else}
	<section class="observations" class:empty={!items.length} in:fade={{ duration: 100 }}>
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
							goto('/(app)/(sidepanel)/classify/[observation]', {
								observation: observation.id
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
							if (isValidImageId(id)) await deleteImageFile(imageIdToFileId(id));
							await deleteObservation(id, { notFoundOk: true, recursive: true });
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
				<ButtonSecondary onclick={() => goto('/import')}>Importer</ButtonSecondary>
			</div>
		{/if}
	</section>
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
	}

	.empty {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}
</style>
