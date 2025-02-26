<script>
	import Sup from '~icons/ph/greater-than';
	import Download from '~icons/ph/download-simple';
	import Gear from '~icons/ph/gear';
	import logo from '../favicon.png';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {String} current_pages
	 * @property {Boolean} has_images
	 */

	/** @type {Props} */
	let { current_pages = 'Import', has_images = true } = $props();

	let openFeur = $state();

	let where_do_i_go = 'Import';

	function click_import() {
		if (current_pages != 'Import') {
			where_do_i_go = 'Import';
			console.log('IL A CLICKEEEEEEEEEEE');
			openFeur();
		}
	}

	function click_crop() {
		if (current_pages == 'Import') {
			current_pages = 'Crop';
		} else if (current_pages != 'Crop') {
			where_do_i_go = 'Crop';
			openFeur();
		}
	}

	function click_classif() {
		if (current_pages == 'Import' || current_pages == 'Crop') {
			current_pages = 'Classif';
		} else if (current_pages != 'Classif') {
			where_do_i_go = 'Classif';
			openFeur();
		}
	}

	function click_download() {
		current_pages = 'Download';
	}
</script>

<ModalConfirm
	key="Confirmation"
	title="Attention"
	onconfirm={() => {
		current_pages = where_do_i_go;
	}}
	bind:open={openFeur}
>
	<p>
		Êtes vous sur de vouloir revenir en arrière? Cela peut engendrer de la perte de vos avancements.
	</p>
</ModalConfirm>

<div class="navigation">
	<div class="divLogo">
		<img class="logo" src={logo} alt="logo" />
		C.i.g.a.l.e.
	</div>

	<button onclick={click_import}>
		Import
		{#if current_pages == 'Import'}
			<div class="line"></div>
		{/if}
	</button>

	<Sup></Sup>

	<button disabled={!has_images} onclick={click_crop}>
		Crop
		{#if current_pages == 'Crop'}
			<div class="line"></div>
		{/if}
	</button>

	<Sup></Sup>

	<button disabled={current_pages == 'Import'} onclick={click_classif}>
		Classification
		{#if current_pages == 'Classif'}
			<div class="line"></div>
		{/if}
	</button>

	<Sup></Sup>
	<button disabled={current_pages == 'Import' || current_pages == 'Crop'} onclick={click_download}>
		<div class="download">
			<Download></Download>
			Résultats
		</div>
		{#if current_pages == 'Download'}
			<div class="line"></div>
		{/if}
	</button>

	<ButtonIcon onclick={() => {}}>
		<Gear></Gear>
	</ButtonIcon>
</div>

<style>
	.navigation {
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

	button {
		background: none;
		border: none;
		padding: 7.5px;
		padding-left: 15px;
		padding-right: 15px;
	}

	button:disabled {
		color: var(--gray);
	}

	button:hover:not(:disabled) {
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

	button:is(:disabled) .line {
		visibility: hidden;
	}
</style>
