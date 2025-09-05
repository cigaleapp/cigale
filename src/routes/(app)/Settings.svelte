<script>
	import { goto } from '$app/navigation';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import { languagesCompletions } from '$lib/i18n';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, locales, setLocale } from '$lib/paraglide/runtime.js';
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
	help={open ? m.close() : m.settings()}
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
	<header>{m.settings()}</header>
	<div class="listParam">
		<div class="label">{m.theme()}</div>
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
				help={m.sync_with_system_theme()}
			>
				<IconSyncWithSystemTheme />
			</ButtonIcon>
		</div>
		<div class="label">{m.debug_mode()}</div>
		<div class="setting">
			<Switch
				data-testid="debug-mode"
				value={getSettings().showTechnicalMetadata}
				onchange={async (show) => {
					await setSetting('showTechnicalMetadata', show);
				}}
			/>
		</div>
		<div class="label">{m.sort_gallery_by()}</div>
		<div class="setting">
			<SegmentedGroup
				options={['filename', 'date']}
				bind:value={
					() => getSettings().gallerySort.key,
					(key) => setSetting('gallerySort', { ...getSettings().gallerySort, key })
				}
				labels={{ filename: m.sort_key_filename(), date: m.sort_key_date() }}
			/>
			<ButtonIcon
				data-testid="toggle-sort-direction"
				onclick={async () =>
					await setSetting('gallerySort', {
						...getSettings().gallerySort,
						direction: getSettings().gallerySort.direction === 'asc' ? 'desc' : 'asc'
					})}
				help={getSettings().gallerySort.direction === 'asc'
					? m.change_sort_direction_to_desc()
					: m.change_sort_direction_to_asc()}
			>
				{#if getSettings().gallerySort.direction === 'asc'}
					<IconSortAsc />
				{:else}
					<IconSortDesc />
				{/if}
			</ButtonIcon>
		</div>
		<div class="label">{m.card_size()}</div>
		<div class="setting">
			<input
				type="range"
				min="0.5"
				max="2"
				step="0.01"
				list="gridsize-marks"
				bind:value={() => getSettings().gridSize, (value) => setSetting('gridSize', value)}
			/>
			<datalist id="gridsize-marks">
				<option value="1"></option>
			</datalist>
		</div>
		<div class="label">{m.language()}</div>
		<div class="setting">
			<SegmentedGroup
				clickable-custom-options
				options={[...locales]}
				bind:value={getLocale, setLocale}
			>
				{#snippet customOption(code)}
					{@const names = { en: 'English', fr: 'Français', ja: '日本語' }}
					{names[code] || code}
					{#await languagesCompletions() then completions}
						{#if completions[code] < 0.85}
							<ConfidencePercentage
								tooltip={(percentage) => m.language_translation_completion({ percentage })}
								value={completions[code]}
							/>
						{/if}
					{/await}
				{/snippet}
			</SegmentedGroup>
		</div>
	</div>
	<section class="actions">
		<ButtonSecondary
			onclick={async () => {
				open = false;
				await goto('#/protocols');
			}}
		>
			{m.manage_protocols()}
		</ButtonSecondary>
		<ButtonSecondary
			onclick={() => {
				openKeyboardShortcuts?.();
			}}
		>
			{m.keyboard_shortcuts()}
		</ButtonSecondary>
		<ButtonSecondary
			help={m.prepare_for_offline_help()}
			onclick={() => {
				openPrepareForOfflineUse?.();
			}}
		>
			{m.prepare_for_offline()}
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
			href="#/about">{m.about()}</a
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
