<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { tables } from '$lib/idb.svelte';
	import Logo from '$lib/Logo.svelte';
	import { previewingPrNumber, uiState } from '$lib/state.svelte';
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
		if (!hasImages && !uiState.currentProtocol) goto('#/');
		if (!hasImages) goto('#/import');
	});

	/** @type {undefined | (() => void)} */
	let openPreviewPRDetails = $state();
</script>

<DownloadResults bind:open={openExportModal} />
<DeploymentDetails bind:open={openPreviewPRDetails} />

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
			<a href="#/import" aria-disabled={!uiState.currentProtocol}>
				Importer
				{#if path == '/import'}
					<div class="line"></div>
				{/if}
			</a>
			<Sup></Sup>
			<a href="#/crop" aria-disabled={!uiState.currentProtocol || !hasImages}>
				Recadrer
				{#if path == '/crop'}
					<div class="line"></div>
				{/if}
			</a>
			<Sup></Sup>
			<a href="#/classify" aria-disabled={!uiState.currentProtocol || !hasImages}>
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

		<Reglages {openKeyboardShortcuts} --navbar-height="{height}px" />
	</nav>
	<div class="global-progress-bar" class:inactive={[0, 1].includes(progress)}>
		<div class="completed" style:width="{progress * 100}%"></div>
	</div>
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

	.global-progress-bar.inactive {
		opacity: 0;
		transition: opacity 1s;
	}

	.global-progress-bar {
		width: 100%;
		height: 0.25rem;
	}

	.global-progress-bar .completed {
		height: 100%;
		background: var(--fg-primary);
		transition: width 0.5s;
	}
</style>
