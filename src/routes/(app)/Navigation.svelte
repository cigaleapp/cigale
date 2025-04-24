<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { previewingPrNumber, tables } from '$lib/idb.svelte';
	import Logo from '$lib/Logo.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { uiState } from '$lib/state.svelte';
	import Sup from '~icons/ph/caret-right';
	import Download from '~icons/ph/download-simple';
	import DeploymentDetails from './DeploymentDetails.svelte';
	import DownloadResults from './DownloadResults.svelte';
	import Reglages from './Reglages.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {number} [progress=0]
	 * @property {() => void} [openKeyboardShortcuts]
	 */

	/** @type {Props} */
	let { openKeyboardShortcuts, progress = 0 } = $props();

	const path = $derived(page.url.hash.replace(/^#/, ''));

	const hasImages = $derived(tables.Image.state.length > 0);

	/** @type {number|undefined} */
	let height = $state();

	let openExportModal = $state();

	$effect(() => {
		if (!uiState.currentProtocolId) goto('#/');
		if (uiState.currentProtocolId && !hasImages) goto('#/import');
	});

	/** @type {undefined | (() => void)} */
	let openPreviewPRDetails = $state();
</script>

<DownloadResults {progress} bind:open={openExportModal} />

{#if previewingPrNumber}
	<DeploymentDetails bind:open={openPreviewPRDetails} />
{/if}

<header bind:clientHeight={height}>
	<nav>
		<div class="logo">
			<a href="#/">
				<Logo --fill="var(--bg-primary)" />
				C.i.g.a.l.e.
			</a>
			{#if previewingPrNumber}
				<button class="pr-number" onclick={openPreviewPRDetails}>
					Preview #{previewingPrNumber}
				</button>
			{/if}
		</div>

		<div class="steps">
			<a href="#/">
				Protocole
				{#if path == '/'}
					<div class="line"></div>
				{/if}
			</a>
			<Sup></Sup>
			<a href="#/import" aria-disabled={!uiState.currentProtocolId}>
				Importer
				{#if path == '/import'}
					<div class="line"></div>
				{/if}
			</a>
			<Sup></Sup>
			<a
				href="#/crop/{uiState.imageOpenedInCropper}"
				aria-disabled={!uiState.currentProtocolId || !hasImages}
			>
				Recadrer
				{#if path.startsWith('/crop')}
					<div class="line"></div>
				{/if}
			</a>
			<Sup></Sup>
			<a href="#/classify" aria-disabled={!uiState.currentProtocolId || !hasImages}>
				Classifier
				{#if path == '/classify'}
					<div class="line"></div>
				{/if}
			</a>
			<Sup></Sup>
			<ButtonSecondary onclick={openExportModal}>
				<Download />
				Résultats
			</ButtonSecondary>
		</div>

		<div class="settings">
			<Reglages {openKeyboardShortcuts} --navbar-height="{height}px" />
		</div>
	</nav>

	<!-- When generating the ZIP, the bar is shown inside the modal. Showing it here also would be weird & distracting -->
	<ProgressBar progress={uiState.processing.state === 'generating-zip' ? 0 : progress} />
</header>

<style>
	nav {
		background-color: var(--bg-primary-translucent);
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		resize: vertical;
		position: relative;
	}

	nav a {
		background: none;
		border: none;
		padding: 7.5px;
		padding-left: 15px;
		padding-right: 15px;
		text-decoration: none;
		color: var(--fg-neutral);
	}

	.steps {
		display: flex;
		align-items: center;
		justify-content: center;
		justify-content: space-between;
		width: 100%;
		margin: 0 2rem;
		max-width: 800px;
	}

	nav a[aria-disabled='true'] {
		pointer-events: none;
		color: var(--gray);
	}

	nav a:hover[aria-disabled='true'] {
		background-color: var(--bg-primary);
		border-radius: var(--corner-radius);
		color: var(--fg-primary);
	}

	.logo {
		--size: 40px;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.logo a:first-child {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.settings {
		--hover-bg: var(--bg-neutral);
	}

	.pr-number {
		font-size: 0.8em;
		color: var(--fg-primary);
		padding: 0.5em;
		border-radius: var(--corner-radius);
		border: 1px solid var(--fg-primary);
		margin-left: 1rem;
		background: none;
		cursor: pointer;
	}

	.pr-number:is(:hover, :focus-within) {
		background-color: var(--bg-primary);
	}

	.line {
		height: 3px;
		background-color: var(--bg-primary);
		width: auto;
		border-radius: 1000000px;
	}

	nav a[aria-disabled='true'] .line {
		visibility: hidden;
	}
</style>
