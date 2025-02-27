<script>
	import Sup from '~icons/ph/greater-than';
	import Download from '~icons/ph/download-simple';
	import Gear from '~icons/ph/gear';
	import logo from '../favicon.png';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { page } from '$app/state';
	import { beforeNavigate } from '$app/navigation';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Boolean} hasImages
	 */

	/** @type {Props} */
	let { hasImages = true } = $props();

	let openConfirm = $state();

	// function clickImport() {
	// 	if (currentPage != 'Import') {
	// 		whereNext = 'Import';
	// 		openConfirm();
	// 	}
	// }

	// function clickCrop() {
	// 	if (currentPage == 'Import') {
	// 		currentPage = 'Crop';
	// 	} else if (currentPage != 'Crop') {
	// 		whereNext = 'Crop';
	// 		openConfirm();
	// 	}
	// }

	// function clickClassif() {
	// 	if (currentPage == 'Import' || currentPage == 'Crop') {
	// 		currentPage = 'Classif';
	// 	} else if (currentPage != 'Classif') {
	// 		whereNext = 'Classif';
	// 		openConfirm();
	// 	}
	// }

	// function clickDownload() {
	// 	currentPage = 'Download';
	// }

	let waitingConfirm = false;
	let reseau = 1;

	beforeNavigate(async ({ to, from }) => {
		if (to?.route?.id == '/classification' && from?.route?.id != '/crop') {
			openConfirm();

			await waitingConfirm;

			console.log(reseau);

			waitingConfirm = false;
		}
	});
</script>

<ModalConfirm
	key="Confirmation"
	title="Attention"
	onconfirm={() => {
		waitingConfirm = true;
		reseau = 1;
	}}
	oncancel={() => {
		waitingConfirm = true;
		reseau = 2;
	}}
	bind:open={openConfirm}
>
	<p>
		Êtes vous sur de vouloir revenir en arrière? Cela peut engendrer de la perte de vos avancements.
	</p>
</ModalConfirm>

<nav>
	<div class="divLogo">
		<img class="logo" src={logo} alt="logo" />
		C.i.g.a.l.e.
	</div>

	<a href="/#/import">
		Import
		{#if page.route.id == '/import'}
			<div class="line"></div>
		{/if}
	</a>

	<Sup></Sup>

	<a
		href="/#/crop"
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
		href="/#/classification"
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
		href="/#/resultats"
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

	<ButtonIcon
		onclick={() => {
			console.log(page.route.id);
		}}
	>
		<Gear></Gear>
	</ButtonIcon>
</nav>

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
