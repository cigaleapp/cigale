<script>
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { tables } from '$lib/idb.svelte';
	import { goto, href } from '$lib/paths.js';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { getSettings, setSetting } from '$lib/settings.svelte';
	import Switch from '$lib/Switch.svelte';
	import { watch } from 'runed';
	import IconSyncWithSystemTheme from '~icons/ph/arrows-counter-clockwise';
	import Gears from '~icons/ph/gear-light';
	import Moon from '~icons/ph/moon-light';
	import IconSortAsc from '~icons/ph/sort-ascending';
	import IconSortDesc from '~icons/ph/sort-descending';
	import Sun from '~icons/ph/sun-light';
	import Cross from '~icons/ph/x-circle-light';

	/**
	 * @type {{openKeyboardShortcuts?: (() => void) | undefined, openPrepareForOfflineUse?: (() => void) | undefined}}
	 */
	const { openKeyboardShortcuts, openPrepareForOfflineUse } = $props();

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

	const effectiveTheme = $derived.by(() => {
		const theme = getSettings().theme;
		if (theme === 'auto') return systemIsLight ? 'light' : 'dark';
		return theme;
	});

	watch(
		() => effectiveTheme,
		(theme) => {
			window.nativeWindow?.setControlsColor(
				getComputedStyle(document.documentElement).getPropertyValue(`--${theme}__fg-primary`)
			);
		}
	);
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
	data-testid="app-settings"
	open={open ? true : undefined}
	bind:this={dialogElement}
>
	<header>Réglages</header>
	<div class="listParam">
		<div class="label">Thème</div>
		<div class="setting">
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
		<div class="label">Mode debug</div>
		<div class="setting">
			<Switch
				data-testid="debug-mode"
				value={getSettings().showTechnicalMetadata}
				onchange={async (show) => {
					await setSetting('showTechnicalMetadata', show);
				}}
			/>
		</div>
		<div class="label">Trier les images par</div>
		<div class="setting">
			<SegmentedGroup
				options={['filename', 'date']}
				bind:value={
					() => getSettings().gallerySort.key,
					(key) => setSetting('gallerySort', { ...getSettings().gallerySort, key })
				}
				labels={{ filename: 'Fichier', date: 'Date' }}
			/>
			<ButtonIcon
				data-testid="toggle-sort-direction"
				onclick={async () =>
					await setSetting('gallerySort', {
						...getSettings().gallerySort,
						direction: getSettings().gallerySort.direction === 'asc' ? 'desc' : 'asc'
					})}
				help={getSettings().gallerySort.direction === 'asc'
					? 'Trier par ordre décroissant'
					: 'Trier par ordre croissant'}
			>
				{#if getSettings().gallerySort.direction === 'asc'}
					<IconSortAsc />
				{:else}
					<IconSortDesc />
				{/if}
			</ButtonIcon>
		</div>
		<div class="label">Taille des images</div>
		<div class="setting">
			<input
				type="range"
				min="0.5"
				max="2"
				step="0.01"
				list="gridsize-marks"
				bind:value={
					() => getSettings().gridSize,
					(value) => {
						// Don't write to database too eagerly, it lags the UI
						const settings = tables.Settings.state;
						settings[settings.findIndex((s) => s.id === 'user')].gridSize = value;
					}
				}
				onblur={async () => setSetting('gridSize', getSettings().gridSize)}
			/>
			<datalist id="gridsize-marks">
				<option value="1"></option>
			</datalist>
		</div>
		<div class="label">Langue</div>
		<div class="setting">
			<SegmentedGroup
				clickable-custom-options
				options={['en', 'fr']}
				bind:value={() => getSettings().language, (code) => setSetting('language', code)}
			>
				{#snippet customOption(code)}
					<!-- @wc-ignore: language names are left in their native language on purpose -->
					{@const names = { en: 'English', fr: 'Français', ja: '日本語' }}
					{names[code] || code}
				{/snippet}
			</SegmentedGroup>
		</div>
	</div>
	<section class="actions">
		<ButtonSecondary
			onclick={async () => {
				open = false;
				await goto('/protocols');
			}}
		>
			Gérer les protocoles
		</ButtonSecondary>
		<ButtonSecondary
			onclick={() => {
				openKeyboardShortcuts?.();
			}}
		>
			Raccourcis clavier
		</ButtonSecondary>
		<ButtonSecondary
			help={"Télécharger tout ce qu'il est nécéssaire pour pouvoir utiliser l'application hors-ligne. Télécharge tout les modèles pour tout les protocoles actuellement installés."}
			onclick={() => {
				openPrepareForOfflineUse?.();
			}}
		>
			Préparation hors-ligne
		</ButtonSecondary>
	</section>
	<footer>
		CIGALE ver. <a href="https://github.com/cigaleapp/cigale/tree/{import.meta.env.buildCommit}">
			{import.meta.env.buildCommit.slice(0, 7)}
		</a>
		·
		<a
			onclick={() => {
				open = false;
			}}
			href={href('/about')}>À propos</a
		>
	</footer>
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
		font-size: smaller;
	}

	header {
		font-size: 1.5em;
		font-weight: bold;
		margin-top: 0.5em;
		margin-bottom: 0.5em;
		color: var(--fg-primary);
	}

	.listParam {
		display: grid;
		grid-template-columns: max-content auto;
		gap: 1em;
	}

	.listParam > div {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	.listParam .label {
		font-weight: bold;
	}

	.actions {
		display: flex;
		justify-content: center;
		gap: 1em;
		margin-top: 2em;
		margin-bottom: 1em;
	}

	footer {
		font-weight: bold;
		text-align: center;
	}
</style>
