<script lang="ts">
	import type { CaptureDevice } from './device.svelte.js';

	import IconSwitchCameraSides from '~icons/ri/camera-switch-line';
	import IconBugReport from '~icons/ri/error-warning-line';
	import IconFlashOn from '~icons/ri/flashlight-fill';
	import IconFlashOff from '~icons/ri/flashlight-line';
	import IconMore from '~icons/ri/more-line';
	import IconStartTimer from '~icons/ri/timer-line';
	import IconSfxOff from '~icons/ri/volume-mute-line';
	import IconSfxOn from '~icons/ri/volume-up-line';
	import ButtonIcon from '#lib/ButtonIcon.svelte';
	import DropdownMenu from '#lib/DropdownMenu.svelte';
	import { goto } from '#lib/paths.js';
	import { getSettings, toggleSetting } from '#lib/settings.svelte.js';
	import { toasts } from '#lib/toasts.svelte.js';
	import { orEmpty, switchValue } from '#lib/utils.js';
	import ModalSubmitIssue from '#routes/(app)/ModalSubmitIssue.svelte';

	import { displayTimerConfig } from './timers.svelte.js';

	interface Props {
		device: CaptureDevice;
	}

	let submitBugReport = $state<() => void>();

	const { device }: Props = $props();
</script>

<ModalSubmitIssue type="bug" bind:open={submitBugReport} trigger={false} />

<DropdownMenu
	title="Options"
	position="top"
	items={[
		{
			label: '',
			items: [
				...orEmpty(device.timerConfigs.length > 0, {
					label: 'Timer',
					type: 'submenu' as const,
					data: {},
					icon: IconStartTimer,
					subtext: (device.timerName ?? 'Aucun') || 'Par défaut',
					submenu: {
						label: 'Timers',
						items: [
							...device.timerConfigs.map((t, i) => ({
								label: t.name || 'Par défaut',
								type: 'selectable' as const,
								key: t.name || 'default',
								selected: device.timerName === t.name,
								data: {},
								subtext: displayTimerConfig(t),
								async onclick() {
									await device.changeTimerConfig(i);
								},
							})),
							{
								label: 'Aucun',
								type: 'selectable' as const,
								key: '__none__',
								selected: !device.timer,
								data: {},
								async onclick() {
									await device.changeTimerConfig(null);
								},
							},
						],
					},
				}),
				...orEmpty(device.canFlipCamera, {
					label: "Basculer sur l'autre caméra",
					type: 'clickable' as const,
					icon: IconSwitchCameraSides,
					closeOnSelect: false,
					data: {},
					async onclick() {
						const side = await device.flipCameraSide();

						device.floatingmsg.set(
							'Objectif',
							switchValue(side, {
								rear: 'Arrière',
								front: 'Avant',
							})
						);
					},
				}),
				...orEmpty(device.canEmitSfx, {
					label: 'Son pour le timer',
					type: 'selectable' as const,
					key: 'sfx',
					data: {},
					selected: getSettings().timerSounds,
					closeOnSelect: false,
					icon: getSettings().timerSounds ? IconSfxOn : IconSfxOff,
					subtext: getSettings().timerSounds ? 'Activé' : 'Désactivé',
					onclick() {
						toggleSetting('timerSounds');
					},
				}),
				{
					label: 'Quitter et garder les photos',
					type: 'clickable',
					data: {},
					async onclick() {
						await goto('/import/');
					},
				},
				{
					label: 'Signaler un bug',
					icon: IconBugReport,
					type: 'clickable',
					data: {},
					onclick() {
						submitBugReport?.();
					},
				},
			]!,
		},
	]}
>
	{#snippet trigger(props)}
		<ButtonIcon {...props} help="Plus d'options">
			<IconMore />
		</ButtonIcon>
	{/snippet}
</DropdownMenu>

{#if device.canSetFlashMode}
	<ButtonIcon
		help={switchValue(device.nextFlashMode, {
			off: 'Désactiver le flash',
			on: 'Activer le flash',
			auto: 'Mettre le flash en auto',
			torch: 'Mettre le flash en torche',
		})}
		onclick={async () => {
			const mode = await device.setFlashMode(device.nextFlashMode).catch((err) => {
				toasts.error(err.toString());
				return;
			});

			if (!mode) return;

			device.floatingmsg.set(
				'Flash',
				switchValue(mode, {
					off: 'Off',
					on: 'On',
					auto: 'Auto',
					torch: 'Lampe-torche',
				})
			);
		}}
	>
		<div class="flash-icon" data-mode={device.flashMode}>
			{#if device.flashMode === 'off'}
				<IconFlashOff />
			{:else}
				<IconFlashOn />
			{/if}
		</div>
	</ButtonIcon>
{/if}

<style>
	.flash-icon {
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;

		&::after {
			position: absolute;
			top: -0.5em;
		}

		&[data-mode='auto']::after {
			content: 'A';
			font-size: 0.75em;
			right: -0.25em;
		}

		&[data-mode='torch']::after {
			content: '•';
			right: 0;
		}
	}
</style>
