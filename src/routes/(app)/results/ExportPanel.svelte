<script lang="ts">
	import IconExpand from '~icons/ri/skip-left-line';
	import IconCollapse from '~icons/ri/skip-right-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { uiState } from '$lib/uistate.svelte.js';
	import { switchValue } from '$lib/utils.js';

	import ExportGallery from './ExportGallery.svelte';
	import ExportLocalActions from './ExportLocalActions.svelte';
	import ExportLocalPreview from './ExportLocalPreview.svelte';
	import ExportLocalSettings from './ExportLocalSettings.svelte';
	import ExportPlatformsActions from './ExportPlatformsActions.svelte';
	import ExportPlatformsPreview from './ExportPlatformsPreview.svelte';
	import ExportPlatformsSettings from './ExportPlatformsSettings.svelte';
	import { exporter as remoteExporter } from './platforms.svelte.js';

	interface Props {
		confirmExportIfMetadataErrors: () => Promise<boolean>;
	}

	const { confirmExportIfMetadataErrors }: Props = $props();

	let exportDestinationTab = $derived<'platforms' | 'local'>(
		remoteExporter.compatibleAccounts.length > 0 ? 'platforms' : 'local'
	);

	let windowWidth: number | undefined = $state();

	let collapsedExportPanel = $derived((windowWidth ?? 0) <= 1400);
</script>

<svelte:window bind:innerWidth={windowWidth} />

<section class="export" pw-testid="export-results" class:collapsed={collapsedExportPanel}>
	<header>
		<div class="actions">
			<ButtonIcon
				help={collapsedExportPanel
					? "Montrer le panneau d'export"
					: "Cacher le panneau d'export"}
				onclick={() => {
					collapsedExportPanel = !collapsedExportPanel;
				}}
			>
				{#if collapsedExportPanel}
					<IconExpand />
				{:else}
					<IconCollapse />
				{/if}
			</ButtonIcon>
		</div>
		<h2>Exporter</h2>

		<div class="tabs">
			<SegmentedGroup
				options={['local', 'platforms'] as const}
				disabled={(opt) =>
					switchValue(opt, {
						local: false,
						platforms:
							remoteExporter.compatibleAccounts.length > 0
								? false
								: `Aucune plateforme disponible pour le protocole ${uiState.currentProtocol?.name ?? ''}`,
					})}
				bind:current={exportDestinationTab}
			>
				{#snippet option_local()}
					Fichiers
				{/snippet}
				{#snippet option_platforms()}
					Plateformes
				{/snippet}
			</SegmentedGroup>
		</div>
	</header>

	<div class="scrollable">
		<div class="settings-and-gallery">
			<div class="settings">
				{#if exportDestinationTab === 'local'}
					<ExportLocalSettings />
				{:else}
					<ExportPlatformsSettings />
				{/if}
			</div>

			<ExportGallery />
		</div>

		{#if exportDestinationTab === 'local'}
			<ExportLocalPreview />
		{:else if exportDestinationTab === 'platforms'}
			<ExportPlatformsPreview />
		{/if}
	</div>

	<div class="actions">
		{#if exportDestinationTab === 'local'}
			<ExportLocalActions {confirmExportIfMetadataErrors} />
		{:else if exportDestinationTab === 'platforms'}
			<ExportPlatformsActions {confirmExportIfMetadataErrors} />
		{/if}
	</div>
</section>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	header .tabs {
		margin-left: auto;
	}

	.export {
		position: fixed;
		z-index: 10;
		top: calc(var(--navbar-height, 20px));
		bottom: 3rem;
		right: 3rem;
		max-width: 50rem;
		border-radius: var(--corner-radius);
		border: 1px solid var(--gray);
		background-color: var(--bg-neutral);
		display: flex;
		flex-direction: column;
		/* z-index: 200; */

		transition: right 80ms ease;

		&.collapsed {
			right: -35rem;
		}
	}

	.export > * {
		/* So that the .scrollable's scrollbar kisses the actual card's borders */
		padding: 1rem 2rem;

		&:first-child {
			padding-top: 2rem;
		}

		&:last-child {
			padding-bottom: 2rem;
		}
	}

	.export .scrollable {
		display: flex;
		flex-direction: column;
		gap: 1em;
		overflow-y: auto;
		height: 100%;
		scrollbar-gutter: stable;
	}

	.settings-and-gallery {
		--gallery-thumb: 80px;
		--gallery-gap: 1em;
		display: grid;
		grid-template-columns: 400px calc(3 * (var(--gallery-thumb) + var(--gallery-gap)));
		gap: 3em;

		@media (max-width: 600px) {
			grid-template-columns: auto;
		}
	}

	.settings {
		display: flex;
		flex-direction: column;
		gap: 2em;
	}

	@media (max-width: 1300px) {
		.export {
			position: static;
			border: none;
			width: 100%;
			header .actions {
				display: none;
			}

			&,
			> * {
				padding-inline: 0;
			}
		}
	}

	.actions {
		display: flex;
		gap: 1em;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;

		.avatar {
			font-size: 0.75rem;
			margin-right: 0.5em;
		}
	}
</style>
