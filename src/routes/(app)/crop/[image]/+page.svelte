<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { toCenteredCoords } from '$lib/BoundingBoxes.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Switch from '$lib/Switch.svelte';
	import * as idb from '$lib/idb.svelte.js';
	import { imageIdToFileId } from '$lib/images';
	import { deleteMetadataValue, storeMetadataValue } from '$lib/metadata';
	import { getSettings, setSetting } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte';
	import { tooltip } from '$lib/tooltips';
	import { onDestroy, onMount } from 'svelte';
	import IconBack from '~icons/ph/arrow-left';
	import IconPrev from '~icons/ph/caret-line-left';
	import IconNext from '~icons/ph/caret-line-right';
	import IconHasConfirmedCrop from '~icons/ph/check-circle';
	import IconHasCrop from '~icons/ph/circle';

	const imageId = $derived(page.params.image);
	const image = $derived(idb.tables.Image.state.find((image) => image.id === imageId));
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
	const croppedImagesCount = $derived(
		idb.tables.Image.state.filter((image) => image.metadata[uiState.cropMetadataId]).length
	);
	const confirmedCropsCount = $derived(
		idb.tables.Image.state.filter(
			(image) => image.metadata[uiState.cropMetadataId]?.manuallyModified
		).length
	);

	/**
	 * @param {{x: number, y: number, width: number, height: number}} boundingBoxesout
	 */
	async function _onConfirmCrop(boundingBoxesout) {
		console.log(boundingBoxesout, 'is cropped! at id : ', imageId);

		const image = idb.tables.Image.state.find((image) => image.id === imageId);

		// Get inferred value from alternatives (if non empty), or use the main value otherwise. Inferred value is the initial cropbox value as determined by the neural network.
		// If this is the first time the user is re-cropping the box, this value will be the main values.
		/** @type {undefined | { value: import('$lib/metadata.js').RuntimeValue<'boundingbox'>, confidence: number }} */
		// @ts-expect-error
		let initialCrop = image?.metadata[uiState.cropMetadataId] ?? undefined;

		// On subsequent crops, the user's crop will be the main value and the neural network's crop will be in the alternatives.
		if (
			image?.metadata[uiState.cropMetadataId].alternatives &&
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

		await idb.openTransaction(['Image', 'Observation'], {}, async (tx) => {
			const image = await tx.objectStore('Image').get(imageId);
			if (!image) return;
			const species = image.metadata[uiState.classificationMetadataId];
			if (species && !species.manuallyModified) {
				// Species confidence was inferred, we need to remove it so we can infer it again, since it's inferred on the _cropped_ image
				await deleteMetadataValue({
					tx,
					metadataId: uiState.classificationMetadataId,
					subjectId: imageId
				});
			}
			await storeMetadataValue({
				tx,
				metadataId: uiState.cropMetadataId,
				subjectId: imageId,
				type: 'boundingbox',
				value: toCenteredCoords(boundingBoxesout),
				confidence: 1,
				// Put the neural-network-inferred (initial) value in the alternatives as a backup
				alternatives: initialCrop ? [initialCrop] : []
			});
		});
	}

	onMount(() => {
		uiState.keybinds['ArrowLeft'] = {
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
	});
	onDestroy(() => {
		delete uiState.keybinds['ArrowLeft'];
		delete uiState.keybinds['ArrowRight'];
		delete uiState.keybinds['Space'];
	});
</script>

<div class="layout">
	<main class="crop-surface">
		<img src={imageSrc} alt="" />
	</main>
	<aside class="info">
		<section class="top">
			<nav class="back">
				<ButtonInk onclick={() => goto('#/crop')}>
					<IconBack /> Retour
				</ButtonInk>
			</nav>
			<h1>{image?.filename}</h1>
			<p class="process">
				{#snippet percent(/** @type {number} */ value)}
					<code>
						{(value / sortedImageIds.length) * 100}%
					</code>
				{/snippet}

				<code>
					{sortedImageIds.indexOf(imageId) + 1}⁄{sortedImageIds.length}
				</code>
				<span class="sep">·</span>
				<span use:tooltip={'Images avec recadrage (manuel ou détecté)'}>
					<IconHasCrop />
					{@render percent(croppedImagesCount)}
				</span>
				<span class="sep">·</span>
				<span use:tooltip={'Images avec recadrage manuellement confirmé'}>
					<IconHasConfirmedCrop />
					{@render percent(confirmedCropsCount)}
				</span>
			</p>
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
		justify-content: space-between;
	}

	.info .top {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.info .top p,
	.info .top p span {
		display: flex;
		align-items: center;
		gap: 0.25em;
	}

	.info .top .sep {
		padding: 0 0.5em;
	}

	.info h1 {
		font-size: 1.5em;
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
		gap: 0.5em;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>
