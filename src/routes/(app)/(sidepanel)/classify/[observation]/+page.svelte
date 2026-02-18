<script module lang="ts">
	export type Expandable = 'references' | 'subject' | 'none';
</script>

<script lang="ts">
	import { marked } from 'marked';
	import type { Attachment } from 'svelte/attachments';
	import { fade } from 'svelte/transition';

	import IconDescription from '~icons/ri/align-left';
	import IconCascades from '~icons/ri/corner-right-down-fill';
	import IconSynonyms from '~icons/ri/links-line';
	import { cascadeLabels, type CascadeLabelsCache } from '$lib/cascades';
	import Field from '$lib/Field.svelte';
	import { openDatabase } from '$lib/idb.svelte.js';
	import LearnMoreLink from '$lib/LearnMoreLink.svelte';
	import { getMetadataValue } from '$lib/metadata/index.js';
	import MetadataCascadesTable from '$lib/MetadataCascadesTable.svelte';
	import { observationMetadata } from '$lib/observations';
	import { namespaceOfMetadataId } from '$lib/schemas/metadata.js';
	import { scrollfader } from '$lib/scrollfader';
	import { isDebugMode } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/state.svelte.js';
	import { undo } from '$lib/undo.svelte';

	import Header from './Header.svelte';
	import LayoutSwitcher from './LayoutSwitcher.svelte';
	import Navigation from './Navigation.svelte';
	import OptionBar from './OptionBar.svelte';
	import References from './References.svelte';
	import Subject from './Subject.svelte';

	const { data } = $props();
	const {
		observation,
		images,
		navigation,
		focusedMetadata,
		metadataDefinitions,
		allOptions: options
	} = $derived(data);

	const cascadeLabelsCache: CascadeLabelsCache = $state({});

	const layout = $derived(uiState.currentSession?.fullscreenClassifier.layout ?? 'top-bottom');

	const currentMetadataValue = $derived.by(() => {
		if (!observation) return undefined;
		if (!focusedMetadata) return undefined;

		const metadata = observationMetadata({
			definitions: metadataDefinitions,
			observation,
			images
		});
		return getMetadataValue({ metadata }, 'enum', focusedMetadata.id);
	});

	const option = $derived(options.find((o) => o.key === currentMetadataValue?.value?.toString()));

	let expand = $state<Expandable>('none');
	let layoutTransitions = $state(true);
	let currentImage = $state(images[0]);

	undo.initialize(100);

	function area(areaName: string): Attachment {
		return (node) => {
			if (!(node instanceof HTMLElement)) return;
			node.style.gridArea = areaName;
			node.dataset.testid = areaName;
		};
	}
</script>

<main data-layout={layout} data-expand={expand} data-layout-transitions={layoutTransitions}>
	<div class="references" {@attach area('references')} in:fade={{ duration: 200 }}>
		{#if option}
			<References {option} bind:expand />
		{/if}
	</div>
	<div class="subject" {@attach area('subject')} in:fade={{ duration: 200 }}>
		{#if observation}
			<Subject {images} bind:expand bind:currentImage />
		{/if}
	</div>
	<div class="panel" {@attach area('panel')}>
		<div class="header" {@attach area('header')}>
			<Header {observation} {focusedMetadata} {currentImage} />
		</div>

		<div class="layout-switcher" {@attach area('layout-switcher')}>
			<LayoutSwitcher
				toggleLayoutTransitions={(enable) => {
					layoutTransitions = enable;
				}}
			/>
		</div>

		<div class="focused-option" {@attach area('focused-option')} in:fade={{ duration: 200 }}>
			{#if observation && focusedMetadata}
				<OptionBar {options} {observation} {focusedMetadata} {currentMetadataValue} />
			{/if}
		</div>

		{#if option && focusedMetadata}
			<div
				class="cascades"
				{@attach area('cascades')}
				{@attach scrollfader}
				in:fade={{ duration: 200 }}
			>
				<Field
					composite
					label="Métadonnées associées"
					Icon={IconCascades}
					indent-icon={false}
				>
					{#await openDatabase() then db}
						{#await cascadeLabels( { cache: cascadeLabelsCache, db, protocolId: namespaceOfMetadataId(focusedMetadata.id), option } ) then cascades}
							<MetadataCascadesTable {cascades} />
						{/await}
					{/await}
				</Field>
			</div>

			<div
				class="synonyms"
				{@attach area('synonyms')}
				{@attach scrollfader}
				in:fade={{ duration: 200 }}
			>
				<Field composite label="Synonymes" Icon={IconSynonyms} indent-icon={false}>
					{#if option.synonyms.length === 0}
						<p>Aucun synonyme défini.</p>
					{:else}
						<ul>
							{#each option.synonyms as synonym (synonym)}
								<li>{synonym}</li>
							{/each}
						</ul>
					{/if}
				</Field>
			</div>

			<div
				class="description"
				{@attach area('description')}
				{@attach scrollfader}
				in:fade={{ duration: 200 }}
			>
				<Field composite label="Description" Icon={IconDescription} indent-icon={false}>
					{#await marked(option.description ?? '') then html}
						{@html html}
					{:catch error}
						{#if isDebugMode()}
							<p class="error">Markdown invalide: {error}</p>
						{/if}
						{option.description}
					{/await}

					{#if option.learnMore}
						<div class="learn-more">
							<LearnMoreLink href={option.learnMore} />
						</div>
					{/if}
				</Field>
			</div>
		{/if}

		<div class="nav" {@attach area('nav')}>
			<Navigation {...navigation} {focusedMetadata} currentObservation={observation} />
		</div>
	</div>
</main>

<style>
	main {
		display: grid;
		height: 100dvh;
		overflow: hidden;
	}

	main[data-layout-transitions='true'] {
		transition:
			grid-template-rows 0.2s,
			grid-template-columns 0.2s,
			grid-template-areas 0.2s;
	}

	/* We want the layout switcher to transition IN but NOT transition out */
	main[data-expand='none'] {
		.layout-switcher {
			transition: opacity 0.2s 0.2s;
		}
	}

	main[data-expand='references'],
	main[data-expand='subject'] {
		.layout-switcher {
			opacity: 0;
			pointer-events: none;
		}
	}

	main[data-expand='references'] {
		.panel,
		.subject {
			opacity: 0.25;
		}
	}

	main[data-expand='subject'] {
		.panel,
		.references {
			opacity: 0.25;
		}
	}

	.panel,
	.subject,
	.references {
		transition: opacity 0.4s;
	}

	main[data-layout='top-bottom'] {
		grid-template-areas: 'subject panel' 'references panel';
		grid-template-columns: 3fr 2fr;
		grid-template-rows: 50% 50%;

		&[data-expand='subject'] {
			grid-template-columns: 90dvw 1fr;
			grid-template-rows: 90dvh 1fr;
		}

		&[data-expand='references'] {
			grid-template-columns: 90dvw 1fr;
			grid-template-rows: 1fr 90dvh;
		}

		.subject,
		.references {
			border-right: 3px solid var(--fg-neutral);
		}

		.references {
			border-top: 3px solid var(--fg-neutral);
			height: calc(100% - 3px);
		}
	}

	main[data-layout='left-right'] {
		grid-template-areas: 'references subject' 'panel panel';
		grid-template-columns: 50% 50%;
		grid-template-rows: 50% 50%;

		&[data-expand='subject'] {
			grid-template-columns: 1fr 90dvw;
			grid-template-rows: 90dvh 1fr;
		}

		&[data-expand='references'] {
			grid-template-columns: 90dvw 1fr;
			grid-template-rows: 90dvh 1fr;
		}

		.subject,
		.references {
			border-bottom: 3px solid var(--fg-neutral);
		}

		.references {
			border-right: 3px solid var(--fg-neutral);
			width: calc(100% - 3px);
		}
	}

	main[data-layout='left-right'] .panel {
		margin-top: -1.4lh;
		height: calc(100% + 1.4lh);
		z-index: 10;
		grid-template-columns: 25% 1fr 25%;
		grid-template-rows: min-content 1fr 1fr;
		padding: 0 2em 2em 2em;
		row-gap: 0.5em;
		grid-template-areas:
			'. focused-option layout-switcher'
			'cascades description header'
			'synonyms description nav';

		.layout-switcher {
			margin-top: 0.4lh;
			display: flex;
			justify-self: flex-end;
		}
	}

	main[data-layout='top-bottom'] .panel {
		padding: 1em 2em;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: min-content min-content 1.5fr min-content min-content;
		grid-template-areas:
			'header header'
			'focused-option focused-option'
			'description description'
			'cascades synonyms'
			'nav nav';

		.layout-switcher {
			z-index: 10;
			position: absolute;
			left: 60%;
			top: 50%;
			translate: -50% -50%;
		}
	}

	.references {
		height: 100%;
	}

	.subject {
		height: 100%;
		overflow: hidden;
	}

	.panel {
		display: grid;
		gap: 2em;
	}

	.panel {
		> div {
			overflow: hidden;
		}
		> .description,
		> .cascades,
		> .synonyms {
			overflow-y: auto;
		}
		> .focused-option {
			overflow: visible;
		}
	}

	.panel .synonyms {
		max-height: 15rem;

		ul {
			padding-left: 0;
		}
	}

	.panel .nav {
		align-self: flex-end;
	}

	.panel .description .learn-more {
		margin-top: 1.5em;
	}
</style>
