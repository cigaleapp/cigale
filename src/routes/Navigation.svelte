<script>
	import Sup from '~icons/ph/greater-than';
	import Download from '~icons/ph/download-simple';
	import Gear from '~icons/ph/gear';
	import logo from '../favicon.png';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { page } from '$app/state';

	import DownloadModal from '$lib/DownloadModal.svelte';

	/** @type {Boolean} */
	let showDownloadModal = false;

	function toggleDownloadModal() {
		showDownloadModal = !showDownloadModal;
	}

	let hasImages;
</script>

<nav>
	<div class="divLogo">
		<img class="logo" src={logo} alt="logo C.i.g.a.l.e." />
		C.i.g.a.l.e.
	</div>

	<a href="#/import">
		Import
		{#if page.route.id === '/import'}
			<div class="line"></div>
		{/if}
	</a>

	<Sup></Sup>

	<a
		href="#/crop"
		aria-disabled={!hasImages &&
			page.route.id !== '/classification' &&
			page.route.id !== '/resultats' &&
			page.route.id !== '/crop' &&
			page.route.id !== '/import'}
	>
		Crop
		{#if page.route.id === '/crop'}
			<div class="line"></div>
		{/if}
	</a>

	<Sup></Sup>

	<a
		href="#/classification"
		aria-disabled={page.route.id !== '/classification' &&
			page.route.id !== '/resultats' &&
			page.route.id !== '/crop'}
	>
		Classification
		{#if page.route.id === '/classification'}
			<div class="line"></div>
		{/if}
	</a>

	<Sup></Sup>

	<a href="#/resultats">
		<div class="download">
			<button on:click={toggleDownloadModal} class="icon-clickable">
				<Download color="white" />
			</button>
			<span>Résultats</span>
		</div>
		{#if page.route.id === '/resultats'}
			<div class="line"></div>
		{/if}
	</a>

	<ButtonIcon onclick={() => console.log(page.route.id)}>
		<Gear></Gear>
	</ButtonIcon>
</nav>

<DownloadModal bind:show={showDownloadModal} />

<style>
	nav {
		background-color: var(--bg-primary-translucent);
		height: 8%;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding-left: 10px;
		padding-right: 10px;
		resize: vertical;
	}

	a {
		background: none;
		border: none;
		padding: 8px 15px;
		text-decoration: none;
		color: var(--fg-neutral);
		cursor: pointer;
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
		width: 60px;
		height: 40px;
	}
	.divLogo {
		display: flex;
		align-items: center;
		font-weight: bold;
		text-transform: uppercase;
	}

	.download {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	.icon-clickable {
		background: none;
		border: none;
		padding: 0;
		display: flex;
		align-items: center;
		cursor: pointer;
		color: inherit;
	}

	.icon-clickable:hover {
		transform: scale(1.1);
		opacity: 0.8;
	}

	.icon-clickable:focus {
		outline: none;
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
