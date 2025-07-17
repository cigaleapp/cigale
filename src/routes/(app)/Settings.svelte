<script>
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Switch from '$lib/Switch.svelte';
	import Gears from '~icons/ph/gear-light';
	import Sun from '~icons/ph/sun-light';
	import IconSyncWithSystemTheme from '~icons/ph/arrows-counter-clockwise';
	import Moon from '~icons/ph/moon-light';
	import Cross from '~icons/ph/x-circle-light';
	import { goto } from '$app/navigation';
	import { getSettings, setSetting } from '$lib/settings.svelte';

	/**
	 * @type {{openKeyboardShortcuts?: (() => void) | undefined}}
	 */
	const { openKeyboardShortcuts } = $props();

	let open = $state(false);
	/** @type {HTMLDialogElement|undefined} */
	let dialogElement = $state();

	$effect(() => {
		window.addEventListener('mouseup', ({ target }) => {
			if (target === dialogElement) return;
			// @ts-ignore
			if (dialogElement?.contains(target)) return;
			open = false;
		});
	});

	let systemIsLight = $state(true);
	$effect(() => {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			systemIsLight = !e.matches;
		});
	});
</script>

<ButtonIcon
	data-testid="settings-button"
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

<dialog
	data-theme={getSettings().theme}
	class="container"
	open={open ? true : undefined}
	bind:this={dialogElement}
>
	<div class="listParam">
		<div class="setting">
			Thème
			<Switch
				value={getSettings().theme === 'auto' ? systemIsLight : getSettings().theme === 'light'}
				onchange={async (isLight) => {
					await setSetting('theme', isLight ? 'light' : 'dark');
				}}
				icons={{ on: Sun, off: Moon }}
			></Switch>
			<ButtonIcon
				disabled={getSettings().theme === 'auto'}
				onclick={async () => await setSetting('theme', 'auto')}
				help="Synchroniser avec le thème du système"
			>
				<IconSyncWithSystemTheme />
			</ButtonIcon>
		</div>
		<div class="setting">
			Mode debug
			<Switch
				data-testid="debug-mode"
				value={getSettings().showTechnicalMetadata}
				onchange={async (show) => {
					await setSetting('showTechnicalMetadata', show);
				}}
			/>
		</div>
		<div class="setting">
			<ButtonSecondary
				onclick={async () => {
					open = false;
					await goto('#/protocols');
				}}
			>
				Gérer les protocoles
			</ButtonSecondary>
		</div>
		<div class="setting">
			<ButtonSecondary
				onclick={() => {
					openKeyboardShortcuts?.();
				}}
			>
				Raccourcis clavier
			</ButtonSecondary>
		</div>
		<footer>
			CIGALE ver. <a href="https://github.com/cigaleapp/cigale/tree/{import.meta.env.buildCommit}">
				{import.meta.env.buildCommit.slice(0, 7)}
			</a>
			·
			<a
				onclick={() => {
					open = false;
				}}
				href="#/about">À propos</a
			>
		</footer>
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

	.setting {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1em;
	}
</style>
