<script>
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { tables } from '$lib/idb.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import Logo from '$lib/Logo.svelte';
	import { ensureNoLoneImages } from '$lib/observations';
	import { generateResultsZip } from '$lib/results';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import Sup from '~icons/ph/caret-right';
	import Download from '~icons/ph/download-simple';
	import Reglages from './Reglages.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Boolean} hasImages
	 * @property {number} [progress=0]
	 */

	/** @type {Props} */
	let { hasImages = true, progress = 0 } = $props();

	const path = $derived(page.url.hash.replace(/^#/, ''));

	/** @type {number|undefined} */
	let height = $state();

	let exporting = $state(false);
</script>

<header bind:clientHeight={height}>
	<nav>
		<a class="logo" href="#/">
			<Logo --fill="var(--bg-primary)" />
			C.i.g.a.l.e.
		</a>

		<a href="#/">
			Importer
			{#if path == '/'}
				<div class="line"></div>
			{/if}
		</a>

		<Sup></Sup>

		<a
			href="#/crop"
			aria-disabled={!hasImages &&
				path != '/classify' &&
				path != '/results' &&
				path != '/crop' &&
				path != '/import'}
		>
			Recadrer
			{#if path == '/crop'}
				<div class="line"></div>
			{/if}
		</a>

		<Sup></Sup>

		<a
			href="#/classify"
			aria-disabled={path != '/classify' && path != '/results' && path != '/crop'}
		>
			Classifier
			{#if path == '/classify'}
				<div class="line"></div>
			{/if}
		</a>

		<Sup></Sup>
		<!-- <a href="#/results">
			<div class="download">
				<Download />
				Résultats
			</div>
			{#if path == '/results'}
				<div class="line"></div>
			{/if}
		</a> -->

		<ButtonSecondary
			onclick={async () => {
				exporting = true;
				const chosenProtocol = tables.Protocol.state.find((p) => p.id === uiState.currentProtocol);
				if (!chosenProtocol) {
					toasts.error('Aucun protocole sélectionné');
					exporting = false;
					return;
				}
				try {
					await ensureNoLoneImages();
					await generateResultsZip(base, tables.Observation.state, chosenProtocol);
				} catch (error) {
					console.error(error);
					toasts.error(
						`Erreur lors de l'exportation des résultats: ${error?.toString() ?? 'Erreur inattendue'}`
					);
				} finally {
					exporting = false;
				}
			}}
		>
			{#if exporting}
				<LoadingSpinner />
			{:else}
				<Download />
			{/if}
			Résultats
		</ButtonSecondary>

		<Reglages --navbar-height="{height}px" />
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

	a {
		background: none;
		border: none;
		padding: 7.5px;
		padding-left: 15px;
		padding-right: 15px;
		text-decoration: none;
		color: var(--fg-neutral);
	}

	a[aria-disabled='true'] {
		pointer-events: none;
		color: var(--gray);
	}

	a:hover[aria-disabled='true'] {
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

	.line {
		height: 3px;
		background-color: var(--bg-primary);
		width: auto;
		border-radius: 1000000px;
	}

	a[aria-disabled='true'] .line {
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
