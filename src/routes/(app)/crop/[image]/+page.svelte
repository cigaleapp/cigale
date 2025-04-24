<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		boundingBoxIsNonZero,
		toCenteredCoords,
		toTopLeftCoords
	} from '$lib/BoundingBoxes.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import DraggableBoundingBox from '$lib/DraggableBoundingBox.svelte';
	import Switch from '$lib/Switch.svelte';
	import * as idb from '$lib/idb.svelte.js';
	import { imageIdToFileId } from '$lib/images';
	import { deleteMetadataValue, storeMetadataValue } from '$lib/metadata';
	import { getSettings, setSetting } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { tooltip } from '$lib/tooltips';
	import { onDestroy, onMount } from 'svelte';
	import IconPrev from '~icons/ph/caret-line-left';
	import IconNext from '~icons/ph/caret-line-right';
	import IconHasConfirmedCrop from '~icons/ph/seal-check';
	import IconHasCrop from '~icons/ph/crop';
	import IconGallery from '~icons/ph/squares-four';
	import { seo } from '$lib/seo.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';

	const imageId = $derived(page.params.image);
	const image = $derived(idb.tables.Image.state.find((image) => image.id === imageId));

	$effect(() => seo({ title: `Recadrer ${image?.filename ?? '...'}` }));

	const boundingBox = $derived(
		image?.metadata[uiState.cropMetadataId]?.value ?? {
			x: 0,
			y: 0,
			w: 0.5,
			h: 0.5
		}
	);
	const boundingBoxExists = $derived(boundingBoxIsNonZero(boundingBox));
	const imageSrc = $derived(uiState.previewURLs.get(imageIdToFileId(imageId)));
	const sortedImageIds = $derived(
		idb.tables.Image.state.map((img) => img.id).toSorted(idb.idComparator)
	);
	const previousImageId = $derived.by(() => {
		const idx = sortedImageIds.indexOf(imageId) - 1;
		if (idx < 0) return undefined;
		return sortedImageIds.at(idx);
	});
	const nextImageId = $derived.by(() => {
		const idx = sortedImageIds.indexOf(imageId) + 1;
		if (idx >= sortedImageIds.length) return undefined;
		return sortedImageIds.at(idx);
	});
	const croppedImagesCount = $derived(idb.tables.Image.state.filter(hasCrop).length);
	const confirmedCropsCount = $derived(idb.tables.Image.state.filter(hasConfirmedCrop).length);

	/**
	 * @param {import('$lib/database.js').Image} image
	 */
	function hasCrop(image) {
		return (
			image.metadata[uiState.cropMetadataId] &&
			boundingBoxIsNonZero(image.metadata[uiState.cropMetadataId].value)
		);
	}

	/**
	 * @param {import('$lib/database.js').Image} image
	 */
	function hasConfirmedCrop(image) {
		return hasCrop(image) && image.metadata[uiState.cropMetadataId].manuallyModified;
	}

	/**
	 * @param {{x: number, y: number, width: number, height: number}} newBoundingBox
	 */
	async function onConfirmCrop(newBoundingBox) {
		const image = idb.tables.Image.state.find((image) => image.id === imageId);
		if (!image) {
			toasts.error(`Image ${imageId} introuvable, impossible de sauvegarder le recadrage`);
			return;
		}

		const willAutoskip =
			// The user has auto-skip enabled
			getSettings().cropAutoNext &&
			// We aren't deleting the bounding box
			boundingBoxIsNonZero(newBoundingBox) &&
			// Auto-skip occurs when the user just created a bounding box (so there was no previous one)
			(!boundingBoxExists ||
				// or the bounding box was not manually modified before
				!image?.metadata[uiState.cropMetadataId].manuallyModified);

		// Get inferred value from alternatives (if non empty), or use the main value otherwise. Inferred value is the initial cropbox value as determined by the neural network.
		// If this is the first time the user is re-cropping the box, this value will be the main values.
		/** @type {undefined | { value: import('$lib/metadata.js').RuntimeValue<'boundingbox'>, confidence: number }} */
		// @ts-expect-error
		let initialCrop = image.metadata[uiState.cropMetadataId] ?? undefined;

		// On subsequent crops, the user's crop will be the main value and the neural network's crop will be in the alternatives.
		if (
			image.metadata[uiState.cropMetadataId].alternatives &&
			Object.entries(image.metadata[uiState.cropMetadataId].alternatives).length > 0
		) {
			const [[stringValue, confidence]] = Object.entries(
				image.metadata[uiState.cropMetadataId].alternatives
			);
			initialCrop = {
				value: JSON.parse(stringValue),
				confidence
			};
		}

		const species = image.metadata[uiState.classificationMetadataId];
		if (species && !species.manuallyModified) {
			// Species confidence was inferred, we need to remove it so we can infer it again, since it's inferred on the _cropped_ image
			await deleteMetadataValue({
				metadataId: uiState.classificationMetadataId,
				subjectId: imageId
			});
		}

		await storeMetadataValue({
			metadataId: uiState.cropMetadataId,
			subjectId: imageId,
			type: 'boundingbox',
			value: toCenteredCoords(newBoundingBox),
			confidence: 1,
			// Put the neural-network-inferred (initial) value in the alternatives as a backup
			alternatives: initialCrop ? [initialCrop] : [],
			manuallyModified: true
		});

		if (willAutoskip && nextImageId) {
			await goto(`#/crop/${nextImageId}`);
		}
	}

	$effect(() => {
		uiState.imageOpenedInCropper = imageId;
	});

	onMount(() => {
		uiState.keybinds['ArrowLeft'] = {
			help: 'Image précédente',
			when: () => Boolean(previousImageId),
			do: () => goto(`#/crop/${previousImageId}`)
		};
		uiState.keybinds['Shift+Space'] = {
			help: 'Image précédente',
			when: () => Boolean(previousImageId),
			do: () => goto(`#/crop/${previousImageId}`)
		};
		uiState.keybinds['ArrowRight'] = {
			help: 'Image suivante',
			when: () => Boolean(nextImageId),
			do: () => goto(`#/crop/${nextImageId}`)
		};
		uiState.keybinds['Space'] = {
			help: 'Image suivante ou terminer',
			do: () => goto(nextImageId ? `#/crop/${nextImageId}` : `#/classify`)
		};
		uiState.keybinds['Escape'] = {
			help: 'Quitter le recadrage',
			do: () => goto('#/crop')
		};
	});
	onDestroy(() => {
		delete uiState.keybinds['ArrowLeft'];
		delete uiState.keybinds['ArrowRight'];
		delete uiState.keybinds['Space'];
		delete uiState.keybinds['Escape'];
	});

	let imageElement = $state();
</script>

<div class="layout">
	<main class="crop-surface">
		<img src={imageSrc} alt="" bind:this={imageElement} />
		{#if boundingBox && imageElement}
			<DraggableBoundingBox
				{imageElement}
				boundingBox={toTopLeftCoords(boundingBox)}
				onchange={(newBox) => {
					onConfirmCrop(newBox);
				}}
			/>
		{/if}
	</main>
	<aside class="info">
		<section class="top">
			<nav class="back">
				<ButtonInk onclick={() => goto('#/crop')}>
					<IconGallery /> Toutes les photos
				</ButtonInk>
			</nav>
			<h1>
				{image?.filename}
				{#if image && hasConfirmedCrop(image)}
					<span class="status" use:tooltip={'Recadrage confirmé'}>
						<IconHasConfirmedCrop />
					</span>
				{/if}
			</h1>
			<code>
				{sortedImageIds.indexOf(imageId) + 1}⁄{sortedImageIds.length}
			</code>
		</section>
		<section class="progress">
			{#snippet percent(/** @type {number} */ value)}
				<code>
					{Math.round((value / sortedImageIds.length) * 100)}%
				</code>
			{/snippet}

			<div class="bar">
				<p>
					<IconHasCrop />
					Images avec recadrage
					{@render percent(croppedImagesCount)}
				</p>
				<ProgressBar alwaysActive progress={croppedImagesCount / sortedImageIds.length} />
			</div>
			<div class="bar">
				<p>
					<IconHasConfirmedCrop />
					Recadrages confirmés
					{@render percent(confirmedCropsCount)}
				</p>
				<ProgressBar alwaysActive progress={confirmedCropsCount / sortedImageIds.length} />
			</div>
		</section>
		<nav>
			<ButtonSecondary
				disabled={!previousImageId}
				onclick={() => {
					goto(`#/crop/${previousImageId}`);
				}}
			>
				<IconPrev /> Précédente
			</ButtonSecondary>
			<div class="next-and-auto">
				<span
					class="auto"
					use:tooltip={"Passer automatiquement à l'image suivante quand celle-ci est recadrée"}
				>
					<Switch
						bind:value={
							() => getSettings().cropAutoNext, (value) => setSetting('cropAutoNext', value)
						}
						label="Auto"
					/>
					Auto
				</span>
				<ButtonSecondary
					disabled={!nextImageId}
					onclick={() => {
						goto(`#/crop/${nextImageId}`);
					}}
				>
					<IconNext /> Suivante
				</ButtonSecondary>
			</div>
		</nav>
	</aside>
</div>

<style>
	.layout {
		display: flex;
		height: 100%;
		gap: 1em;
		overflow: hidden;
	}

	.crop-surface {
		overflow: hidden;
		position: relative;
		user-select: none;
		width: 70vw;
		--cell-size: 50px;
		background-size: var(--cell-size) var(--cell-size);
		background-image:
			linear-gradient(to right, var(--gray) 1px, transparent 1px),
			linear-gradient(to bottom, var(--gray) 1px, transparent 1px);
	}

	.info {
		padding: 1em;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2em;
	}

	.info .top {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		margin-bottom: auto;
	}

	.info h1 {
		font-size: 1.5em;
		display: flex;
		align-items: center;
		gap: 0.25em;
	}

	.info h1 .status {
		display: flex;
		font-size: 0.8em;
		color: var(--fg-primary);
		align-items: center;
	}

	.info .progress {
		display: flex;
		flex-direction: column;
		--inactive-bg: var(--gray);
		gap: 0.5em;
	}

	.info .progress .bar p {
		margin-bottom: 0.25em;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.info .progress .bar p code {
		color: var(--gay);
		font-size: 0.9em;
		margin-left: auto;
	}

	.info nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info nav :is(div, span) {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.info nav .next-and-auto {
		gap: 1em;
	}

	.info nav .auto {
		gap: 0.25em;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>
