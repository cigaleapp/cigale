<script>
	import { page } from '$app/state';
	import Logo from '$lib/Logo.svelte';
	import Sup from '~icons/ph/caret-right';
	import Download from '~icons/ph/download-simple';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Boolean} hasImages
	 */

	/** @type {Props} */
	let { hasImages = true } = $props();
</script>

<nav>
	<a class="logo" href="#/">
		<Logo --fill="var(--bg-primary)" />
		C.i.g.a.l.e.
	</a>

	<a href="#/">
		Import
		{#if page.route.id == '/'}
			<div class="line"></div>
		{/if}
	</a>

	<Sup></Sup>

	<a
		href="#/crop"
		aria-disabled={!hasImages &&
			page.route.id != '/classification' &&
			page.route.id != '/resultats' &&
			page.route.id != '/crop' &&
			page.route.id != '/import'}
	>
		Crop
		{#if page.route.id == '/crop'}
			<div class="line"></div>
		{/if}
	</a>

	<Sup></Sup>

	<a
		href="#/classification"
		aria-disabled={page.route.id != '/classification' &&
			page.route.id != '/resultats' &&
			page.route.id != '/crop'}
	>
		Classification
		{#if page.route.id == '/classification'}
			<div class="line"></div>
		{/if}
	</a>

	<Sup></Sup>
	<a
		href="#/resultats"
		aria-disabled={page.route.id != '/classification' && page.route.id != '/resultats'}
	>
		<div class="download">
			<Download></Download>
			Résultats
		</div>
		{#if page.route.id == '/resultats'}
			<div class="line"></div>
		{/if}
	</a>
</nav>

<style>
	nav {
		background-color: var(--bg-primary-translucent);
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		resize: vertical;
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

	.download {
		display: flex;
		align-items: center;
		gap: 1em;
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
</style>
