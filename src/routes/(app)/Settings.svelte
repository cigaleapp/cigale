<script lang="ts">
	import type { Component } from 'svelte';

	import IconIncrease from '~icons/ri/add-line';
	import IconMore from '~icons/ri/arrow-right-s-line';
	import IconCheck from '~icons/ri/check-line';
	import Cross from '~icons/ri/close-circle-line';
	import IconDebugMode from '~icons/ri/code-line';
	import IconTheme from '~icons/ri/contrast-2-line';
	import IconProtocols from '~icons/ri/file-list-3-line';
	import IconAccounts from '~icons/ri/group-line';
	import IconAbout from '~icons/ri/information-line';
	import IconSyncWithSystemTheme from '~icons/ri/loop-left-fill';
	import Moon from '~icons/ri/moon-line';
	import IconNotifications from '~icons/ri/notification-line';
	import IconManage from '~icons/ri/settings-3-line';
	import Gears from '~icons/ri/settings-3-line';
	import IconDecrease from '~icons/ri/subtract-line';
	import Sun from '~icons/ri/sun-line';
	import IconOffline from '~icons/ri/wifi-off-line';
	import { version } from '$app/environment';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { plural } from '$lib/i18n.js';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import InputRange from '$lib/InputRange.svelte';
	import KeyboardShortcuts from '$lib/KeyboardShortcuts.svelte';
	import Logo from '$lib/Logo.svelte';
	import { IsMobile } from '$lib/mobile.svelte.js';
	import { askForNotificationPermission, hasNotificationsEnabled } from '$lib/notifications.js';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { resolve } from '$lib/paths';
	import { goto } from '$lib/paths.js';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { getColorScheme, getSettings, setSetting } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import Switch from '$lib/Switch.svelte';
	import { orEmpty } from '$lib/utils.js';
	import { getTheme } from '$routes/+layout.svelte';

	import PrepareForOffline from './PrepareForOffline.svelte';

	let openPrepareForOfflineUse = $state<() => void>();
	let openKeyboardShortcuts = $state<() => void>();

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

	const { showTechnicalMetadata, gridSize, language, parallelism } = $derived(getSettings());

	const theme = getTheme();

	$effect(() => {
		window.nativeWindow?.setControlsColor(
			getComputedStyle(document.documentElement).getPropertyValue(
				`--${theme.effective}__fg-primary`
			)
		);
	});

	const mobile = new IsMobile();

	const mobileOnly = <T,>(item: T) => orEmpty(mobile.current, item);
	const desktopOnly = <T,>(item: T) => orEmpty(!mobile.current, item);
</script>

<DropdownMenu
	items={[
		{
			items: [
				...mobileOnly({
					type: 'clickable' as const,
					data: {
						icon: IconProtocols,
						subtext: plural(tables.Protocol.state.length, [
							'# installé',
							'# installés',
						]),
					},
					label: 'Gérer les protocoles',
					async onclick() {
						await goto('/(app)/protocols');
					},
				}),
				...mobileOnly({
					type: 'clickable' as const,
					data: {
						icon: IconAccounts,
						subtext: plural(tables.Account.state.length, ['# connecté', '# connectés']),
					},
					label: 'Gérer les comptes',
					async onclick() {
						await goto('/(app)/accounts');
					},
				}),

				{
					type: 'clickable',
					label: 'Thème',
					closeOnSelect: false,
					data: {
						icon: theme.effective === 'dark' ? Moon : Sun,
						subtext:
							{
								light: 'Clair',
								dark: 'Sombre',
								auto: 'Système',
							}[theme.setting] ?? '?',
					},
					async onclick() {
						await setSetting(
							'theme',
							{
								light: 'dark',
								dark: 'auto',
								auto: 'light',
							}[theme.setting]
						);
					},
				},
				{
					type: 'selectable',
					key: 'notifications',
					label: 'Notifications',
					selected: Boolean(notificationsEnabled),
					closeOnSelect: false,
					data: {
						icon: IconNotifications,
						subtext: '',
					},
					async onclick() {
						if (notificationsEnabled) {
							await setSetting('notifications', false);
						} else {
							await askForNotificationPermission();
							await setSetting('notifications', true);
						}
					},
				},

				{
					type: 'submenu',
					label: 'Langue',
					data: {
						icon: undefined,
						subtext:
							{
								fr: 'Français',
								en: 'English',
							}[language] ?? '?',
					},
					submenu: {
						label: 'Langue',
						items: [
							{
								type: 'selectable',
								key: 'language-fr',
								label: 'Français',
								selected: language === 'fr',
								data: {
									icon: undefined,
									subtext: '',
								},
								async onclick() {
									await setSetting('language', 'fr');
									window.location.reload();
								},
							},
							{
								type: 'selectable',
								key: 'language-en',
								label: 'English',
								selected: language === 'en',
								data: {
									icon: undefined,
									subtext: '',
								},
								async onclick() {
									await setSetting('language', 'en');
									window.location.reload();
								},
							},
						],
					},
				},
				{
					type: 'clickable',
					label: 'Parallélisme',
					key: 'parallelism',
					closeOnSelect: false,
					data: {
						icon: undefined,
						subtext: '',
					},
					onclick() {
						// noop, handled in a custom way belowk
					},
				},
				{
					type: 'selectable',
					key: 'debug-mode',
					label: 'Mode débug',
					selected: showTechnicalMetadata,
					closeOnSelect: false,
					data: {
						icon: IconDebugMode,
						subtext: '',
					},
					async onclick() {
						await setSetting('showTechnicalMetadata', !showTechnicalMetadata);
					},
				},
				{
					type: 'clickable',
					label: 'Préparation hors-ligne…',
					data: {
						icon: IconOffline,
						subtext: '',
					},
					closeOnSelect: !mobile.current,
					onclick() {
						openPrepareForOfflineUse?.();
					},
				},
				...desktopOnly({
					type: 'clickable' as const,
					label: 'Raccourcis clavier…',
					data: {
						icon: undefined,
						subtext: '',
					},
					closeOnSelect: !mobile.current,
					onclick() {
						openKeyboardShortcuts?.();
					},
				}),
				{
					type: 'clickable' as const,
					data: { icon: IconAbout, subtext: `Version ${version}` },
					label: 'À propos…',
					async onclick() {
						await goto('/(app)/about');
					},
				},
			],
		},
	]}
>
	{#snippet item({ icon: Icon, subtext }, { label, selected, key, type })}
		<div class="settings-item">
			<div class="icon">
				{#if Icon}
					<Icon />
				{:else if selected}
					<IconCheck />
				{/if}
			</div>
			<!-- 
				On mobile, the … is replaced with a caret icon at the right 
				This is because the expectation on mobile is the same whether it opens a modal or goes into a submenu (it changes the screen completely)

				Whereas on desktop, the caret icon sets an expectation of a sub-dropdown, so it only appears when there is actually a submenu
			-->
			<span>{mobile.current ? label.replace(/…$/, '') : label}</span>
			{#if key === 'parallelism'}
				<div class="input">
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
			{:else}
				<span class="subtext">
					{#if subtext}
						<OverflowableText text={subtext} />
						<!-- If the selected state is already indicated by the checkmark, don't show this -->
					{:else if type === 'selectable' && Icon !== undefined}
						{selected ? 'Oui' : 'Non'}
					{/if}
				</span>
			{/if}

			{#if type === 'submenu' || (mobile.current && label.endsWith('…'))}
				<div class="icon">
					<IconMore />
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet trigger({ open, ...props })}
		<ButtonIcon
			--fg="var(--trigger-fg)"
			--bg="var(--trigger-bg)"
			--hover-fg="var(--trigger-hover-fg)"
			--hover-bg="var(--trigger-hover-bg)"
			data-testid="settings-button"
			help={open ? 'Fermer' : 'Réglages'}
			{...props}
		>
			{#if open}
				<Cross />
			{:else}
				<Gears />
			{/if}
		</ButtonIcon>
	{/snippet}
</DropdownMenu>

<KeyboardShortcuts bind:openHelp={openKeyboardShortcuts} preventDefault binds={uiState.keybinds} />
<PrepareForOffline bind:open={openPrepareForOfflineUse} />

<style>
	.settings-item {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 1rem;

		.icon {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 1.5em;
			height: 1.5em;
		}

		.subtext {
			display: flex;
			align-items: center;
			margin-left: auto;
			color: var(--gay);
			font-size: 0.875rem;
		}
	}

	.input {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-left: auto;
	}

	.number-input {
		font-family: var(--font-mono);
		width: 3ch;
		font-size: 1rem;
		font-weight: 200;
	}
</style>
