<script lang="ts">
	import { marked } from 'marked';

	import IconPrev from '~icons/ri/arrow-left-s-line';
	import IconNext from '~icons/ri/arrow-right-s-line';
	import IconDelete from '~icons/ri/delete-bin-line';
	import IconExpand from '~icons/ri/expand-up-down-line';
	import IconGallery from '~icons/ri/function-line';
	import IconLayoutTopBottom from '~icons/ri/layout-4-line';
	import { toTopLeftCoords } from '$lib/BoundingBoxes.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Carousel from '$lib/Carousel.svelte';
	import { cascadeLabels, type CascadeLabelsCache } from '$lib/cascades';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import Field from '$lib/Field.svelte';
	import { databaseHandle, get, list, tables } from '$lib/idb.svelte.js';
	import KeyboardHint from '$lib/KeyboardHint.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import Logo from '$lib/Logo.svelte';
	import { getMetadataValue, metadataOptionsKeyRange } from '$lib/metadata.js';
	import MetadataCascadesTable from '$lib/MetadataCascadesTable.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { resolve } from '$lib/paths';
	import { metadataOptionId } from '$lib/schemas/metadata.js';
	import { scrollfader } from '$lib/scrollfader';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { isDebugMode } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/state.svelte.js';
	import { navbarAppearance } from '$routes/(app)/+layout.svelte';

	import OptionBar from './OptionBar.svelte';

	navbarAppearance('hidden');

	const LAYOUTS = ['top-bottom', 'left-right'] as const;
	let layout: (typeof LAYOUTS)[number] = $state('left-right');

	const { data } = $props();
	const { image, imageNo } = $derived(data);

	const cascadeLabelsCache: CascadeLabelsCache = $state({});

	let focusedMetadata = $state(
		uiState.classificationMetadataId
			? tables.Metadata.getFromState(uiState.classificationMetadataId)
			: undefined
	);

	const currentMetadataValue = $derived(
		image && focusedMetadata ? getMetadataValue(image, 'enum', focusedMetadata.id) : undefined
	);

	async function currentOption() {
		if (!focusedMetadata) throw new Error('No metadata focused');
		if (!currentMetadataValue) throw new Error('No metadata value found');

		const option = await get(
			'MetadataOption',
			metadataOptionId(focusedMetadata.id, currentMetadataValue.value)
		);

		if (!option) throw new Error('No metadata option found for focused metadata value');
		console.log({ option });
		return option;
	}

	async function allOptions() {
		if (!uiState.currentProtocolId) throw new Error('No protocol selected');
		if (!image) throw new Error('Image not found');
		if (!focusedMetadata) throw new Error('No metadata focused');

		const value = getMetadataValue(image, 'enum', focusedMetadata.id);
		if (!value) throw new Error('No metadata value found for focused metadata');

		const options = await list(
			'MetadataOption',
			metadataOptionsKeyRange(uiState.currentProtocolId, focusedMetadata.id)
		);
		return options;
	}
</script>

<main data-layout={layout}>
	<div class="references" style:grid-area="references">
		{#await currentOption()}
			<LoadingSpinner />
		{:then { image, images, label, key }}
			{#if images || image}
				<Carousel items={images ?? [image]}>
					{#snippet item(src)}
						<img {src} />
					{/snippet}
				</Carousel>
			{:else}
				<div class="empty">
					<Logo --size="4em" variant="empty" />
					<p>
						Aucune image de référence pour
						<br />
						{#if label}
							<em>{label}</em>
						{:else}
							<code>{key}</code>
						{/if}
					</p>
				</div>
			{/if}
		{/await}
	</div>
	<div class="image" style:grid-area="image">
		<CroppedImg
			src={uiState.getPreviewURL(image!.fileId)}
			box={toTopLeftCoords(uiState.cropMetadataValueOf(image!)!.value!)}
			background
		/>
	</div>
	<div class="panel" style:grid-area="panel">
		<header style:grid-area="header">
			<div class="line">
				<ButtonInk href={resolve('/classify')}>
					<IconGallery />
					Toutes les images
					<KeyboardHint shortcut="Escape" />
				</ButtonInk>
				<ButtonInk
					dangerous
					help={{
						text: 'Supprimer cette image et passer à la suivante',
						keyboard: '$mod+Delete'
					}}
				>
					<IconDelete />
					Supprimer
				</ButtonInk>
			</div>

			<div class="line">
				<Field label="Focus sur">
					<DropdownMenu
						items={tables.Metadata.state.map((m) => ({
							label: m.label,
							key: m.id,
							onclick() {
								focusedMetadata = { ...m };
							}
						}))}
					>
						{#snippet trigger({ onclick })}
							<ButtonSecondary {onclick}>
								<IconExpand />
								{#if focusedMetadata}
									{focusedMetadata.label}
								{:else}
									Aucune
								{/if}
							</ButtonSecondary>
						{/snippet}
					</DropdownMenu>
				</Field>
				<h1>
					<OverflowableText text={`${image.filename} #${imageNo}`} />
				</h1>
			</div>
		</header>

		<div class="layout-switcher" style:grid-area="layout-switcher">
			<SegmentedGroup options={LAYOUTS} aria-label="Disposition" bind:value={layout}>
				{#snippet customOption(option)}
					{#if option === 'left-right'}
						<IconLayoutTopBottom style="rotate: 90deg;" />
					{:else if option === 'top-bottom'}
						<IconLayoutTopBottom />
					{/if}
				{/snippet}
			</SegmentedGroup>
		</div>

		{#await allOptions() then options}
			<div class="focused-option" style:grid-area="focused-option">
				{#if image && focusedMetadata && currentMetadataValue}
					<OptionBar {options} {image} {focusedMetadata} {currentMetadataValue} />
				{/if}
			</div>

			{#await currentOption()}
				<LoadingSpinner />
			{:then option}
				<div class="cascades" style:grid-area="cascades" {@attach scrollfader}>
					<Field composite label="Métadonnées associées">
						{#await cascadeLabels( { cache: cascadeLabelsCache, db: databaseHandle(), protocolId: uiState.currentProtocolId, option } ) then cascades}
							<MetadataCascadesTable {cascades} />
						{/await}
					</Field>
				</div>

				<div class="synonyms" style:grid-area="synonyms" {@attach scrollfader}>
					<Field composite label="Synonymes">
						{#if option.synonyms.length === 0}
							<p>Aucun synonyme défini.</p>
						{:else}
							<ul>
								{#each option.synonyms as synonym}
									<li>{synonym}</li>
								{/each}
							</ul>
						{/if}
					</Field>
				</div>

				<div class="description" style:grid-area="description" {@attach scrollfader}>
					<Field composite label="Description">
						{#await marked(option.description ?? '') then html}
							{@html html}
						{:catch error}
							{#if isDebugMode()}
								<p class="error">Markdown invalide: {error}</p>
							{/if}
							{option.description}
						{/await}
					</Field>
				</div>
			{/await}
		{/await}

		<nav style:grid-area="nav">
			<div class="image-switcher">
				<ButtonIcon
					help="Image précédente"
					keyboard="ArrowLeft"
					onclick={() => {
						// if (!prevFileId) return;
						// goto('/(app)/(sidepanel)/crop/[image]', { image: prevFileId });
					}}
				>
					<IconPrev />
				</ButtonIcon>
				<code class="numbers">
					1
					<div class="separator">⁄</div>
					1
				</code>
				<ButtonIcon
					help="Image suivante"
					keyboard="ArrowRight"
					onclick={() => {
						// if (!nextFileId) return;
						// goto('/(app)/(sidepanel)/crop/[image]', { image: nextFileId });
					}}
				>
					<IconNext />
				</ButtonIcon>
			</div>
			<div class="continue">
				<ButtonSecondary
					onclick={() => {
						// TODO
					}}
					keyboard="Space"
					help="Marquer le recadrage comme confirmé et passer à la prochaine image non confirmée"
				>
					Continuer
				</ButtonSecondary>
			</div>
		</nav>
	</div>
</main>

<style>
	main {
		display: grid;
		height: 100dvh;
	}

	main[data-layout='top-bottom'] {
		grid-template-areas: 'image panel' 'references panel';
		grid-template-columns: 50% 50%;
		grid-template-rows: 50% 50%;
	}

	main[data-layout='left-right'] {
		grid-template-areas: 'references image' 'panel panel';
		grid-template-columns: 50% 50%;
		grid-template-rows: 50% 50%;

		.image,
		.references {
			border-bottom: 3px solid var(--fg-neutral);
		}
	}

	.image {
		height: 100%;
		overflow: hidden;

		:global(picture) {
			height: 100%;
		}
	}

	.empty {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
		justify-content: center;
		align-items: center;
		height: 100%;

		p {
			max-width: 300px;
			text-align: center;
		}
	}

	.panel {
		display: grid;
	}

	main[data-layout='left-right'] .panel {
		margin-top: -1.4lh;
		z-index: 10;
		grid-template-columns: 25% 1fr 25%;
		grid-template-rows: min-content 1fr 1fr;
		gap: 2em;
		padding: 0 2em 1em 2em;
		height: 100%;
		grid-template-areas:
			'. focused-option layout-switcher'
			'cascades description header'
			'synonyms description nav';

		.layout-switcher {
			margin-top: 0.2lh;
			display: flex;
			justify-content: flex-end;
		}
	}

	main[data-layout='left-right'] .panel {
	}

	.panel {
		> div {
			overflow: hidden;
		}
		> .description,
		> .cascades,
		> .synonyms {
			overflow: auto;
		}
		> .focused-option {
			overflow: visible;
		}
	}

	.panel header {
		display: flex;
		gap: 1em;
		flex-direction: column;

		.line {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 3em;
		}

		:global(.field) {
			width: min-content;
		}

		h1 {
			overflow: hidden;
		}
	}

	.panel nav {
		display: flex;
		justify-content: space-between;
		align-self: flex-end;
		align-items: center;

		.image-switcher {
			display: flex;
			align-items: center;
			gap: 0.5em;

			.numbers {
				display: flex;
				align-items: center;
				gap: 0.2em;
				font-family: var(--font-mono);
			}
		}
	}
</style>
