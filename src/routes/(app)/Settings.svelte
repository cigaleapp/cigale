<script lang="ts">
	import type { Component } from 'svelte';

	import IconIncrease from '~icons/ri/add-line';
	import IconMore from '~icons/ri/arrow-right-s-line';
	import IconCheck from '~icons/ri/check-line';
	import Cross from '~icons/ri/close-circle-line';
	import IconDebugMode from '~icons/ri/code-line';
	import IconProtocols from '~icons/ri/file-list-3-line';
	import IconAccounts from '~icons/ri/group-line';
	import IconAbout from '~icons/ri/information-line';
	import Moon from '~icons/ri/moon-line';
	import IconNotifications from '~icons/ri/notification-line';
	import Gears from '~icons/ri/settings-3-line';
	import IconDecrease from '~icons/ri/subtract-line';
	import Sun from '~icons/ri/sun-line';
	import IconOffline from '~icons/ri/wifi-off-line';
	import { version } from '$app/environment';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { plural } from '$lib/i18n.js';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { IsMobile } from '$lib/mobile.svelte.js';
	import { globalModals } from '$lib/modals.svelte.js';
	import { askForNotificationPermission, hasNotificationsEnabled } from '$lib/notifications.js';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto } from '$lib/paths.js';
	import { getSettings, setSetting } from '$lib/settings.svelte';
	import { orEmpty, switchValue } from '$lib/utils.js';
	import { getTheme } from '$routes/+layout.svelte';

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

	const { showTechnicalMetadata, language, parallelism } = $derived(getSettings());

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
	title="Réglages"
	items={[
		{
			label: '',
			items: [
				...mobileOnly({
					type: 'clickable' as const,
					data: {
						icon: IconProtocols as Component | undefined,
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
						subtext: switchValue(theme.setting, {
							light: 'Clair',
							dark: 'Sombre',
							auto: 'Système',
						}),
					},
					async onclick() {
						await setSetting(
							'theme',
							switchValue(theme.setting, {
								light: 'dark',
								dark: 'auto',
								auto: 'light',
							})
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
					closeOnSelect: false,
					key: "parallelism",
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
					label: 'Mode debug',
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
						globalModals.modal_prepare_for_offline_use.open?.();
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
						globalModals.modal_keyboard_shortcuts_help.open?.();
					},
				}),
				{
					type: 'clickable' as const,
					data: { icon: IconAbout, subtext: `Version ${version}` },
					label: 'À propos',
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
			help={open ? 'Fermer' : 'Réglages'}
			{...props}
		>
			{#if open && !mobile.current}
				<Cross />
			{:else}
				<Gears />
			{/if}
		</ButtonIcon>
	{/snippet}
</DropdownMenu>

<style>
	.settings-item {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 1rem;

		@media (min-width: 600px) {
			max-width: 300px;
		}

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
			/* TODO: find a better way to prevent subtext overflow, maybe with a display:grid on the .settings-item? */
			max-width: 30%;
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
