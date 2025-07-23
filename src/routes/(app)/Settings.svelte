<script>
	import { goto } from '$app/navigation';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { getLocale, locales, setLocale } from '$lib/paraglide/runtime.js';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { getSettings, setSetting } from '$lib/settings.svelte';
	import Switch from '$lib/Switch.svelte';
	import { watch } from 'runed';
	import { m } from '$lib/simple-messages.js';
	import IconSyncWithSystemTheme from '~icons/ph/arrows-counter-clockwise';
	import Gears from '~icons/ph/gear-light';
	import Moon from '~icons/ph/moon-light';
	import Sun from '~icons/ph/sun-light';
	import Cross from '~icons/ph/x-circle-light';

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
	open={open ? true : undefined}
	bind:this={dialogElement}
>
	<div class="listParam">
		<div class="setting">
			{m.theme()}
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
			<SegmentedGroup
				options={[...locales]}
				labels={{ en: 'English', fr: m.french() }}
				bind:value={getLocale, setLocale}
			/>
		</div>
		<div class="setting">
			<ButtonSecondary
				onclick={async () => {
					open = false;
					await goto('#/protocols');
				}}
			>
				{m.manage_protocols()}
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
				href="#/about">{m.about()}</a
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
