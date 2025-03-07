<script>
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import Switch from '$lib/Switch.svelte';
	import Gears from '~icons/ph/gear-light';
	import Sun from '~icons/ph/sun-light';
	import Moon from '~icons/ph/moon-light';
	import Cross from '~icons/ph/x-circle-light';

	let open = $state(false);
	/** @type {HTMLDialogElement|undefined} */
	let dialogElement = $state();

	$effect(() => {
		window.addEventListener('mouseup', ({ target }) => {
			if (target === dialogElement) return;
			if (dialogElement?.contains(target)) return;
			open = false;
		});
	});

	$effect(() => {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
			if (matches) console.log('sombr');
			else console.log('clèr');
		});
	});
</script>

<ButtonIcon
	help={open ? 'Fermer' : 'Réglages'}
	onclick={() => {
		open = !open;
	}}
>
	{#if open}
		<Cross />
	{:else}
		<Gears />
	{/if}
</ButtonIcon>

<dialog class="container" open={open ? true : undefined} bind:this={dialogElement}>
	<div class="listParam">
		<div class="Language">
			Langue :
			<ButtonPrimary
				onclick={() => {
					console.log("J'aime le français");
				}}>Français</ButtonPrimary
			>
			<ButtonPrimary
				onclick={() => {
					console.log("J'aime le Anglais");
				}}>English</ButtonPrimary
			>
		</div>
		<div class="Theme">
			Thème :
			<Switch icons={{ on: Sun, off: Moon }}></Switch>
		</div>
		<div class="Protocole">
			Protocoles :

			<ButtonPrimary
				onclick={() => {
					window.location.href = '#/reglages';
					open = false;
				}}
			>
				Gérer
			</ButtonPrimary>
		</div>
	</div>
</dialog>

<style>
	dialog:not([open]) {
		opacity: 0;
		pointer-events: none;
		transform: scale(0.75);
	}

	.container {
		position: fixed;
		top: var(--navbar-height, 70px);
		border: none;
		margin-left: auto;
		margin-right: 0;
		display: flex;
		flex-direction: column;
		padding-left: 25px;
		padding-right: 25px;
		z-index: 2;
		background-color: var(--bg-primary-translucent);
		border-bottom-left-radius: 5px;
	}

	.listParam {
		margin: inherit;
		flex-direction: column;
		flex-grow: 1;
		display: flex;
		gap: 1em;
		align-items: center;
		padding-left: 10px;
		padding-right: 20px;
		padding-top: 10px;
		padding-bottom: 10px;
		border-width: 3px;
		border-color: var(--gay);
		font-size: smaller;
		font-weight: bold;
		color: var(--fg-primary);
	}

	.Language {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1em;
	}
	.Theme {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1em;
	}
	.Protocole {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1em;
	}
</style>
