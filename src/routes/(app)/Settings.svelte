<script>
	import { watch } from 'runed';

	import IconIncrease from '~icons/ri/add-line';
	import Cross from '~icons/ri/close-circle-line';
	import IconSyncWithSystemTheme from '~icons/ri/loop-left-fill';
	import Moon from '~icons/ri/moon-line';
	import Gears from '~icons/ri/settings-3-line';
	import IconDecrease from '~icons/ri/subtract-line';
	import Sun from '~icons/ri/sun-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { askForNotificationPermission, hasNotificationsEnabled } from '$lib/notifications.js';
	import { resolve } from '$lib/paths';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { getColorScheme, getSettings, setSetting } from '$lib/settings.svelte';
	import Switch from '$lib/Switch.svelte';

	/**
	 * @type {{openKeyboardShortcuts?: (() => void) | undefined, openPrepareForOfflineUse?: (() => void) | undefined}}
	 */
	const { openKeyboardShortcuts, openPrepareForOfflineUse } = $props();

	let open = $state(false);
	/** @type {HTMLDialogElement|undefined} */
	let dialogElement = $state();

	const notificationsEnabled = $derived(hasNotificationsEnabled() && getSettings().notifications);

	$effect(() => {
		window.addEventListener('mouseup', ({ target }) => {
			if (target === dialogElement) return;
			// @ts-ignore
			if (dialogElement?.contains(target)) return;
			open = false;
		});
	});

	const { theme, showTechnicalMetadata, gridSize, language, parallelism } =
		$derived(getSettings());

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
				getComputedStyle(document.documentElement).getPropertyValue(
					`--${theme}__fg-primary`
				)
			);
		}
	);
</script>

<ButtonIcon
	--fg="var(--trigger-fg)"
	--bg="var(--trigger-bg)"
	--hover-fg="var(--trigger-hover-fg)"
	--hover-bg="var(--trigger-hover-bg)"
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
	style:color-scheme={getColorScheme()}
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
				value={theme === 'auto' ? systemIsLight : theme === 'light'}
				onchange={async (isLight) => {
					await setSetting('theme', isLight ? 'light' : 'dark');
				}}
				icons={{ on: Sun, off: Moon }}
			></Switch>
			<ButtonIcon
				disabled={theme === 'auto'}
				onclick={async () => await setSetting('theme', 'auto')}
				help="Synchroniser avec le thème du système"
			>
				<IconSyncWithSystemTheme />
			</ButtonIcon>
		</div>
		<div class="label">
			Notifications
			<p class="details">Quand un traitement est terminé</p>
		</div>
		<div class="setting">
			<Switch
				data-testid="notifications"
				value={notificationsEnabled}
				onchange={async (enabled) => {
					if (enabled) {
						await askForNotificationPermission();
						setSetting('notifications', hasNotificationsEnabled());
					} else {
						setSetting('notifications', false);
					}
				}}
			/>
		</div>
		<div class="label">Mode debug</div>
		<div class="setting">
			<Switch
				data-testid="debug-mode"
				value={showTechnicalMetadata}
				onchange={async (show) => {
					await setSetting('showTechnicalMetadata', show);
				}}
			/>
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
					() => gridSize,
					(value) => {
						// Don't write to database too eagerly, it lags the UI
						const settings = tables.Settings.state;
						settings[settings.findIndex((s) => s.id === 'user')].gridSize = value;
					}
				}
				onblur={async () => setSetting('gridSize', gridSize)}
			/>
			<datalist id="gridsize-marks">
				<option value="1"></option>
			</datalist>
		</div>
		<div class="label">Langue</div>
		<div class="setting">
			<SegmentedGroup
				data-testid="language-selection"
				aria-label="Langue de l'interface"
				clickable-custom-options
				options={['en', 'fr']}
				value={language}
				onchange={async (code) => {
					await setSetting('language', code);
					window.location.reload();
				}}
			>
				{#snippet customOption(code)}
					<!-- @wc-ignore: language names are left in their native language on purpose -->
					{@const names = { en: 'English', fr: 'Français', ja: '日本語' }}
					{names[code] || code}
				{/snippet}
			</SegmentedGroup>
		</div>
		<div class="label">
			Parallélisme
			<p class="details">Nombre de tâches en parallèle</p>
		</div>
		<div class="setting">
			<ButtonIcon
				help="Réduire"
				onclick={async () => {
					await setSetting('parallelism', Math.max(1, parallelism - 1));
				}}
			>
				<IconDecrease />
			</ButtonIcon>
			<div class="number-input">
				<InlineTextInput
					label="Nombre de tâches en parallèle"
					value={parallelism}
					onblur={async (value) => {
						await setSetting('parallelism', Number.parseInt(value));
					}}
				/>
			</div>
			<ButtonIcon
				help="Augmenter"
				onclick={async () => {
					await setSetting('parallelism', parallelism + 1);
				}}
			>
				<IconIncrease />
			</ButtonIcon>
		</div>
	</div>
	<section class="actions">
		<ButtonSecondary
			onclick={() => {
				openKeyboardShortcuts?.();
			}}
		>
			Raccourcis clavier
		</ButtonSecondary>
		<ButtonSecondary
			help="Télécharger tout ce qu'il est nécéssaire pour pouvoir utiliser l'application hors-ligne. Télécharge tout les modèles pour tout les protocoles actuellement installés."
			onclick={() => {
				openPrepareForOfflineUse?.();
			}}
		>
			Préparation hors-ligne
		</ButtonSecondary>
	</section>
	<footer>
		CIGALE ver. <a
			href="https://github.com/cigaleapp/cigale/tree/{import.meta.env.buildCommit}"
		>
			{import.meta.env.buildCommit.slice(0, 7)}
		</a>
		·
		<a
			onclick={() => {
				open = false;
			}}
			href={resolve('/about')}>À propos</a
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
		margin-right: 1rem;
		display: flex;
		flex-direction: column;
		padding: 2rem;
		z-index: 2;
		background-color: var(--bg-neutral);
		border-radius: var(--corner-radius);
		border: 1px solid var(--fg-primary);
		font-size: smaller;
	}

	header {
		font-size: 1.5em;
		font-weight: bold;
		margin-bottom: 0.5em;
	}

	.listParam {
		display: grid;
		grid-template-columns: max-content auto;
		gap: 1em;
	}

	.listParam > div {
		display: flex;
		align-items: center;
		gap: 0 1em;
	}

	.listParam .label {
		font-weight: bold;
		flex-wrap: wrap;
		max-width: 10rem;
	}

	.listParam .label .details {
		font-weight: normal;
		font-size: 0.8em;
	}

	.listParam .setting {
		max-width: 12rem;
	}

	.listParam .number-input {
		font-family: var(--font-mono);
		width: 3ch;
		font-size: 1.4em;
		font-weight: 200;
	}

	.actions {
		display: flex;
		justify-content: center;
		gap: 1em;
		margin-top: 2em;
		margin-bottom: 1em;
		/* flex-wrap: wrap; */
		max-width: 400px;
	}

	footer {
		font-weight: bold;
		text-align: center;
	}
</style>
