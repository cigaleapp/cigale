<script>
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { previewingPrNumber, tables } from '$lib/idb.svelte';
	import Logo from '$lib/Logo.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { uiState } from '$lib/state.svelte';
	import { tooltip } from '$lib/tooltips';
	import { clamp } from '$lib/utils';
	import IconNext from '~icons/ph/caret-right';
	import IconDownload from '~icons/ph/download-simple';
	import IconNoInference from '~icons/ph/lightning-slash';
	import DeploymentDetails from './DeploymentDetails.svelte';
	import DownloadResults from './DownloadResults.svelte';
	import Settings from './Settings.svelte';
	import { m } from '$lib/paraglide/messages.js';

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

	/** @type {number|undefined} */
	let navHeight = $state();

	let openExportModal = $state();

	/** @type {undefined | (() => void)} */
	let openPreviewPRDetails = $state();

	/* eslint-disable svelte/prefer-writable-derived */
	// The window object is not reactive
	let isNativeWindow = $state(false);
	$effect(() => {
		isNativeWindow = 'nativeWindow' in window;
	});
	/* eslint-enable svelte/prefer-writable-derived */

	$effect(() => {
		if (!navHeight) return;
		window.nativeWindow?.setControlsHeight(navHeight);
	});

	$effect(() => {
		window.nativeWindow?.setProgress(clamp(progress, 0, 1));

		if (progress >= 1) {
			window.nativeWindow?.startCallingAttention();
		}
	});
</script>

<DownloadResults {progress} bind:open={openExportModal} />

{#if previewingPrNumber}
	<DeploymentDetails bind:open={openPreviewPRDetails} />
{/if}

<header bind:clientHeight={height} class:native-window={isNativeWindow}>
	<nav bind:clientHeight={navHeight}>
		<div class="logo">
			<a href="#/">
				<Logo --fill="var(--bg-primary)" />
				C.i.g.a.l.e.
			</a>
			{#if previewingPrNumber}
				<button class="pr-number" onclick={openPreviewPRDetails}>
					{m.preview_pr_number({ number: previewingPrNumber })}
				</button>
			{/if}
		</div>

		<div class="steps">
			<a href="#/">
				{m.protocol()}
				<!-- Removing preselection GET params from URL removes the slash, which would unselect the tab w/o the == "" check -->
				{#if path == '/' || path == ''}
					<div class="line"></div>
				{/if}
			</a>
			<IconNext></IconNext>
			<a href="#/import" aria-disabled={!uiState.currentProtocolId}>
				Importer
				{#if path == '/import'}
					<div class="line"></div>
				{/if}
			</a>
			<IconNext></IconNext>
			<div class="with-inference-indicator">
				<a
					href="#/crop/{uiState.imageOpenedInCropper}"
					data-testid="goto-crop"
					aria-disabled={!uiState.currentProtocolId || !hasImages}
				>
					Recadrer
					{#if path.startsWith('/crop')}
						<div class="line"></div>
					{/if}
				</a>
				{@render noInferenceIndicator(
					uiState.cropInferenceAvailable,
					"Le protocole ne définit pas d'inférence automatique pour la détection"
				)}
			</div>
			<IconNext></IconNext>
			<div class="with-inference-indicator">
				<a href="#/classify" aria-disabled={!uiState.currentProtocolId || !hasImages}>
					Classifier
					{#if path == '/classify'}
						<div class="line"></div>
					{/if}
				</a>
				{@render noInferenceIndicator(
					uiState.classificationInferenceAvailable,
					"Le protocole ne définit pas d'inférence automatique pour la classification"
				)}
			</div>
			<IconNext></IconNext>
			<ButtonSecondary tight onclick={openExportModal}>
				<IconDownload />
				Résultats
			</ButtonSecondary>
		</div>

		<div class="settings" class:native={isNativeWindow}>
			<Settings {openKeyboardShortcuts} --navbar-height="{height}px" />
		</div>
	</nav>

	<!-- When generating the ZIP, the bar is shown inside the modal. Showing it here also would be weird & distracting -->
	<ProgressBar progress={uiState.processing.state === 'generating-zip' ? 0 : progress} />
</header>

{#snippet noInferenceIndicator(/** @type {boolean} */ available, /** @type {string} */ help)}
	<div class="inference-indicator" use:tooltip={help}>
		{#if !available && uiState.currentProtocol}
			<IconNoInference />
		{/if}
	</div>
{/snippet}

<style>
	header {
		app-region: drag;
	}

	header :global(:is(a, button)) {
		app-region: no-drag;
	}

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

	header.native-window nav {
		height: 50px;
	}

	nav .with-inference-indicator {
		display: flex;
		align-items: center;
	}

	nav .inference-indicator {
		color: var(--fg-warning);
		display: flex;
		align-items: center;
		font-size: 0.9em;
		width: 1ch;
		margin-left: -1ch;
	}

	nav a {
		background: none;
		border: none;
		padding: 7.5px 15px;
		text-decoration: none;
		color: var(--fg-neutral);
	}

	.steps {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		margin: 0 2rem;
		max-width: 800px;
	}

	header.native-window .steps {
		justify-content: center;
		gap: 1rem;
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

	header.native-window .logo {
		--size: 25px;
	}

	.logo a:first-child {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.settings {
		--hover-bg: var(--bg-neutral);
	}

	header.native-window .settings {
		margin-right: 130px;
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
