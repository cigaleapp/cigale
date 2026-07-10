<script lang="ts" module>
	let showBoxesListHint = $derived(
		currentImages().every(({ metadata }) => !metadata[uiState.cropMetadataId]?.manuallyModified)
	);

	export function setBoxesListHintShown(shown: boolean) {
		showBoxesListHint = shown;
	}
</script>

<script lang="ts">
	import type { SelectedBox } from './+page.svelte';
	import type { CenteredBoundingBox } from '$lib/BoundingBoxes.svelte.js';

	import IconFocus from '~icons/ri/crosshair-line';
	import IconDelete from '~icons/ri/delete-bin-line';
	import IconRevert from '~icons/ri/reset-left-fill';
	import IconNeuralNet from '~icons/ri/sparkling-line';
	import { coordsScaler, toTopLeftCoords } from '$lib/BoundingBoxes.svelte.js';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import { percent } from '$lib/i18n.js';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import SentenceJoin from '$lib/SentenceJoin.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import Tooltip from '$lib/Tooltip.svelte';
	import { mapValues } from '$lib/utils.js';

	import {
		currentImages,
		focusedImage,
		boundingBoxes as getBoundingBoxes,
		setFocusedImage,
	} from './+page.svelte';
	import {
		canRevertAll,
		canRevertCrop,
		deleteBoundingBox,
		deleteImageFileAndGotoNext,
		getInitialCrops,
		revertAll,
		revertToInferredCrop,
	} from './actions.svelte.js';
	import { tools } from './Toolbar.svelte';

	interface Props {
		selectedBox: SelectedBox;
	}

	let { selectedBox = $bindable() }: Props = $props();

	const initialCrops = $derived(getInitialCrops());
	const boundingBoxes = $derived(getBoundingBoxes());
	const images = $derived(currentImages());
	const focusedImageId = $derived(focusedImage()?.id);
	const firstImage = $derived(images.at(0));

	/**
	 * @returns  pixel dimensions of the box
	 */
	function roundedPixelDimensions(box: CenteredBoundingBox): [number, number] {
		if (!firstImage) return [0, 0];
		const scaler = coordsScaler({
			x: firstImage.dimensions.width,
			y: firstImage.dimensions.height,
		});

		const { w, h } = mapValues(scaler(box), Math.round);
		return [w, h];
	}
</script>

<div class="info">
	<section class="top">
		<section class="preactions">
			<ButtonInk
				dangerous
				onclick={deleteImageFileAndGotoNext}
				help={{
					text: 'Supprimer cette image et passer à la suivante',
					keyboard: '$mod+Delete',
				}}
			>
				<IconDelete />
				Supprimer
			</ButtonInk>

			<ButtonInk
				help={{
					text: "Revenir au recadrage d'origine pour toutes les boîtes",

					keyboard: '$mod+U',
				}}
				onclick={revertAll}
				disabled={!canRevertAll()}
			>
				<IconRevert />
				Réinitialiser
			</ButtonInk>
		</section>
	</section>
	<section class="boxes">
		<ul>
			{#each images.filter(({ id }) => id in boundingBoxes) as image, i (image.id)}
				{@const box = boundingBoxes[image.id]}
				{@const initBox = initialCrops[image.id]}
				{@const [w, h] = roundedPixelDimensions(box)}
				{@const isFocused = focusedImageId === image.id}
				<li
					class:unfocused={focusedImageId && focusedImageId !== image.id}
					class:selected={selectedBox.imageId === image.id}
					aria-label="Boîte #{i + 1}"
				>
					{#if image.fileId && firstImage}
						<CroppedImg
							dimensions={firstImage.dimensions}
							box={toTopLeftCoords(box)}
							src={uiState.getPreviewURL(image.fileId)}
							class="thumb"
						/>
					{/if}
					<div class="text">
						<p class="index">Boîte #{i + 1}</p>
						<p class="dimensions">
							<code>
								<OverflowableText text="{w}×{h}" />
							</code>
							<!-- we have a neural-infered value only, put the confidence next to the value -->
							{#if initBox && !image.metadata[uiState.cropMetadataId].manuallyModified}
								<span class="sep">&middot;</span>
								<ConfidencePercentage value={initBox.confidence}>
									<div class="confidence-icon">
										<IconNeuralNet />
									</div>
								</ConfidencePercentage>
							{/if}
						</p>
					</div>
					<div class="actions">
						{#if Object.values(boundingBoxes).length > 1}
							<ButtonIcon
								help={isFocused
									? 'Réafficher les autres boîtes'
									: 'Masquer les autres boîtes'}
								keyboard="F"
								onclick={() => setFocusedImage(isFocused ? null : image.id)}
								crossout={isFocused}
							>
								<IconFocus />
							</ButtonIcon>
						{/if}
						<ButtonIcon
							help={initBox
								? `Revenir au recadrage d'origine 
									(${roundedPixelDimensions(initBox.value).join(' × ')}, ${percent(initBox.confidence)} de confiance)`
								: "Recadrage d'origine indisponible"}
							keyboard="u"
							disabled={!canRevertCrop(image.id)}
							onclick={() => revertToInferredCrop(image.id)}
						>
							<IconRevert />
						</ButtonIcon>
						<ButtonIcon
							help="Supprimer la boîte sélectionnée"
							keyboard="Delete"
							onclick={async () => deleteBoundingBox(image.id)}
						>
							<IconDelete />
						</ButtonIcon>
					</div>
				</li>
			{/each}
			{#if showBoxesListHint}
				<li class="boxes-list-hint">
					<p>
						{@html 'Pour créer une nouvelle boîte,<wbr /> utilisez les outils'}
						<SentenceJoin
							items={tools.filter((tool) => tool.createMode !== 'off')}
							key={(t) => t.name}
							final="ou"
						>
							{#snippet children({ icon: Icon, help, shortcut })}
								<Tooltip text={help} keyboard={shortcut}>
									<Icon />
								</Tooltip>
							{/snippet}
						</SentenceJoin>
					</p>
					<p>
						Sélectionnez une boîte avec 1 à 9 pour la modifier avec des raccourcis
						clavier
					</p>
				</li>
			{/if}
		</ul>
	</section>
</div>

<style>
	.info {
		padding: 1em 1.5em;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1em;
		min-width: 450px;
		resize: horizontal;
		/* to make resize work */
		overflow: hidden;
	}

	.info .top {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.info .top .preactions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
	}

	.boxes {
		height: 100%;
	}

	.boxes ul {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		list-style: none;
		padding-left: 0;
	}

	.boxes li {
		display: flex;
		gap: 1em;
	}

	.boxes li:not(.boxes-list-hint) {
		padding: 0.5em 1em;
		align-items: center;
	}

	.boxes li.unfocused {
		opacity: 0.5;
	}

	.boxes li.selected {
		background: var(--bg-primary-translucent);
	}

	.boxes li.boxes-list-hint {
		margin-top: 1em;
		color: var(--gay);
		flex-direction: column;
	}

	.boxes li.boxes-list-hint p,
	.boxes li.boxes-list-hint p :global(.icon) {
		vertical-align: middle;
	}

	.boxes li :global(.thumb) {
		--size: 4rem;
		width: var(--size);
		height: var(--size);
		border-radius: var(--corner-radius);
		background: color-mix(in srgb, var(--gray) 35%, transparent);
		flex-shrink: 0;
	}

	.boxes li .text {
		overflow: hidden;
	}

	.boxes li .dimensions {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-size: 0.8em;

		&,
		code {
			overflow: hidden;
		}
	}

	.boxes li .confidence-icon {
		font-size: 0.8rem;
		margin-right: 0.5em;
		display: flex;
		align-items: center;
	}

	.boxes li .actions {
		margin-left: auto;
		flex-shrink: 0;
	}
</style>
