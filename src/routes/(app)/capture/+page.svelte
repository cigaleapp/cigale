<script lang="ts">
	import { fade } from 'svelte/transition';

	import '@layflags/rolling-number';

	import type { PageData, PageProps } from './$types.js';

	import IconSwitchCameraSides from '~icons/ri/camera-switch-line';
	import IconFinish from '~icons/ri/check-line';
	import IconQuit from '~icons/ri/close-large-line';
	import IconBugReport from '~icons/ri/error-warning-line';
	import IconFlashOn from '~icons/ri/flashlight-fill';
	import IconFlashOff from '~icons/ri/flashlight-line';
	import IconMore from '~icons/ri/more-line';
	import IconGallery from '~icons/ri/multi-image-line';
	import IconPause from '~icons/ri/pause-line';
	import IconPlayFill from '~icons/ri/play-fill';
	import IconPlay from '~icons/ri/play-large-line';
	import IconStartTimer from '~icons/ri/timer-line';
	import IconSfxOff from '~icons/ri/volume-mute-line';
	import IconSfxOn from '~icons/ri/volume-up-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import DebugOnly from '$lib/DebugOnly.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { percent, plural } from '$lib/i18n.js';
	import { tables } from '$lib/idb.svelte.js';
	import LoadingScreen from '$lib/LoadingScreen.svelte';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { goto } from '$lib/paths.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { getSettings, toggleSetting } from '$lib/settings.svelte.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { orEmpty, switchValue } from '$lib/utils.js';
	import ModalSubmitIssue from '$routes/(app)/ModalSubmitIssue.svelte';

	import { CaptureDevice } from './device.svelte.js';
	import { displayTimerConfig } from './timers.svelte.js';

	let submitBugReport = $state<() => void>();

	const { data }: PageProps = $props();
	const device = new CaptureDevice(data.deviceInit);

	$inspect('sto', device.storage.count)

	let askBeforeQuitting = $state<() => Promise<boolean>>();
	async function quit() {
		// Modal not ready yet
		if (!askBeforeQuitting) return;

		if (device.storage.count > 0) {
			const quitAnyways = await askBeforeQuitting();
			if (!quitAnyways) return;
		}

		void device.storage.clear();
		device.resetShootingPhase();
		await goto('/import/');
	}

	async function finish() {
		const allOk = await device.storage.flush({
			onProgress({ done, total }) {
				device.floatingmsg.set('Import', `${done}/${total} (${percent(done / total)})`);
			},
		});

		if (allOk) {
			device.resetShootingPhase();
			await goto('/import/');
		}
	}
</script>

<ModalSubmitIssue type="bug" bind:open={submitBugReport} trigger={false} />

<!-- TODO: add other options: finish() (import & quit), quit without clearing -->
<ModalConfirm
	key="modal_confirm_cancel_capture"
	cancel="Ne pas quitter"
	confirm="Quitter"
	title="Photos en attente"
	dangerous
	bind:show={askBeforeQuitting}
>
	Il y a {device.storage?.count ?? 0} photos en attente qui seront supprimées si tu quitte
</ModalConfirm>

<main data-snapping={device.camera.snapping} data-transparent={device.needsTransparentDocument}>
	<div class="debuginfo">
		<DebugOnly
			data={{
				shootingPhase: device.shootingPhase,
				timer: device.timer?.config.name ?? null,
			}}
		/>
	</div>

	<header class="actions" pw-testid="actions-top">
		<section class="left">
			<DropdownMenu
				title="Options"
				position="top"
				items={[
					{
						label: '',
						items: [
							...orEmpty(device.timerConfigs.length > 0, {
								label: 'Timer',
								type: 'submenu',
								data: {},
								icon: IconStartTimer,
								subtext: (device.timerName ?? 'Aucun') || 'Par défaut',
								submenu: {
									label: 'Timers',
									items: [
										...device.timerConfigs.map((t, i) => ({
											label: t.name || 'Par défaut',
											type: 'selectable',
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
											type: 'selectable',
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
								type: 'selectable',
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
									await goto('/(app)/(sidepanel)/import');
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
						const mode = await device
							.setFlashMode(device.nextFlashMode)
							.catch((err) => {
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
		</section>
		<section class="center">
			{#if device.timer?.started}
				<div class="info">
					{#each device.timer!.config.messages.status as line, i (i)}
						{const formatted = $derived(device.timer!.formatMessage(line))}
						{const stopwatchPattern = new RegExp(`^[0-9.,'":-\\s]+$`)}

						<svelte:element
							this={stopwatchPattern.test(formatted) ? 'code' : 'div'}
							class="line">{formatted}</svelte:element
						>
					{/each}
				</div>
			{:else}
				<div class="modes">
					<SegmentedGroup
						disabled={device.shooting}
						bind:current={device.selectedType}
						options={['photo', 'sound'] as const}
					>
						{#snippet option_photo()}
							Photo
						{/snippet}
						{#snippet option_sound()}
							Son
						{/snippet}
					</SegmentedGroup>
				</div>
			{/if}
		</section>
		<section class="quit">
			<ButtonIcon help="Quitter" loading onclick={quit}>
				<IconQuit />
			</ButtonIcon>
		</section>
	</header>

	<div class="notready">
		<LoadingScreen failure={device.failure} loading={!device.ready} />
	</div>

	{#if device.type === 'photo'}
		<!-- https://github.com/capacitor-community/camera-preview#extra-web-installation-steps -->
		<div id="viewport" {@attach device.cameraViewport}></div>
	{:else if device.type === 'sound'}
		<!-- TODO: realtime audio level meter + waveform (or just coarse graph of amplitude history)? -->

		<div class="audio-monitor">
			<div class="vu-meter">
				<!-- < value={(amplitudeTracker.history.at(-1) ?? 0) * 10 * 1e6} max={1e6}
				></progress> -->
				<ProgressBar
					alwaysActive
					progress={device.amplitudeTracker.latestFrame.amplitude * 20}
				/>
			</div>

			<div class="history">
				{#each device.amplitudeTracker.history as { amplitude, recorded }, i (i)}
					<div class="tick" class:recorded style:--amplitude={amplitude}></div>
				{/each}
			</div>
		</div>
	{/if}

	<section class="floating-messages" pw-testid="floating-messages">
		{#if device.floatingmsg.text}
			<p transition:fade={{ duration: 500 }}>
				{device.floatingmsg.text}
			</p>
		{/if}
	</section>

	<section class="floating-action" data-blink={device.timer?.paused}>
		{const canPause = $derived(device.timer?.started)}
		{#if canPause}
			<ButtonInk onclick={() => device.timer?.togglePause()}>
				{#if device.timer?.paused}
					<IconPlayFill />
					Reprendre
				{:else}
					<IconPause />
					Pause
				{/if}
			</ButtonInk>
		{/if}
	</section>

	<footer class="actions" data-is-shooting={device.shooting}>
		<section class="left">
			<ButtonSecondary
				subtle
				onclick={async () => goto('/(app)/capture/gallery')}
				aria-label={plural(device.storage.count ?? 0, [
					'Voir la photo prise',
					'Voir les # photos prises',
				])}
				help="Voir les photos prises"
			>
				<IconGallery />
				<span class="photo-count">
					<LoadingText value={device.storage.count ?? Loading} mask="0">
						{#snippet loaded(count)}
							<layflags-rolling-number
								style:--roll-duration="250ms"
								{@attach (node: HTMLElement & { value: number }) => {
									node.value = count;
								}}
							>
								{count}
							</layflags-rolling-number>
						{/snippet}
					</LoadingText>
				</span>
			</ButtonSecondary>
		</section>

		<button
			class="shoot"
			disabled={!device.ready}
			title="Prendre une photo"
			onclick={async () => {
				await device.shoot();
			}}
		>
			{const Icon = $derived(
				switchValue(device.shootingPhase, {
					inert: device.timer ? IconStartTimer : null,
					'before-timer': null,
					'wait-start-timer': IconPlay,
					'timer-running': switchValue(device.timerShoot, {
						manually: null,
						'on-timer': 'A',
					}),
					'after-timer': null,
					done: null,
				})
			)}

			{#if Icon}
				<div
					class="start-timer-icon"
					style:color={typeof Icon === 'string' ? 'black' : 'white'}
				>
					{#if typeof Icon === 'string'}
						{Icon}
					{:else}
						<Icon />
					{/if}
				</div>
			{/if}

			<svg
				class="shoot-icon"
				data-phase={device.shootingPhase}
				data-shoot={device.timerShoot}
			>
				<circle
					class="ring"
					cx="50%"
					cy="50%"
					r="43%"
					fill="none"
					stroke="var(--color, white)"
					stroke-width="2px"
					stroke-linecap="round"
					{@attach (node: SVGCircleElement) => {
						if (!device.timer) {
							node.style.strokeDasharray = '';
							node.style.stroke = 'white';
							return;
						}

						if (!['wait-start-timer', 'timer-running'].includes(device.shootingPhase)) {
							node.style.strokeDasharray = '';
							node.style.stroke = 'white';
							return;
						}

						const length = node.getTotalLength();

						const gap = 4;
						const nongap = Math.round(
							(length - gap * device.timer.lapsTotalCount) /
								device.timer.lapsTotalCount
						);

						node.style.strokeDasharray = `${nongap} ${gap}`;
						node.style.stroke = 'var(--gay)';
					}}
				></circle>

				{#if !Icon || typeof Icon === 'string'}
					<rect
						class="inside"
						class:recording={device.audioRecording}
						x="14%"
						y="14%"
						width="72%"
						height="72%"
						fill="var(--color, white)"
					></rect>
				{/if}

				{#if device.timer?.started}
					{#key device.timer.globalProgress}
						<circle
							class="timer-progress"
							cx="50%"
							cy="50%"
							r="43%"
							fill="none"
							stroke="var(--progress-color, white)"
							stroke-width="3px"
							{@attach (node: SVGCircleElement) => {
								const length = node.getTotalLength();
								node.style.strokeDasharray = `${device.timer.globalProgress * length} 1000000`;
							}}
						></circle>
					{/key}

					{#key device.timer.lapProgress}
						<circle
							class="lap-progress"
							cx="50%"
							cy="50%"
							r="39%"
							fill="none"
							stroke="var(--lap-progress-color, red)"
							stroke-width="1px"
							{@attach (node: SVGCircleElement) => {
								const length = node.getTotalLength();
								node.style.strokeDasharray = `${device.timer.lapProgress * length} 1000000`;
							}}
						></circle>
					{/key}
				{/if}
			</svg>
		</button>
		<section class="right">
			<ButtonSecondary subtle loading onclick={finish}>
				{#snippet children({ loading })}
					{#if !loading}
						<IconFinish />
					{/if}
					Fini
				{/snippet}
			</ButtonSecondary>
		</section>
	</footer>
</main>

<style>
	main {
		color-scheme: dark;
		/** Prevent zooming the UI itself when pinching to zoom */
		touch-action: none;
	}

	.notready {
		position: fixed;
		inset: 0;
		/* background: var(--bg-neutral); */
		color-scheme: dark;
		z-index: 10;
	}

	#viewport {
		position: fixed;
		inset: 0;

		:global(video) {
			height: 100%;
			width: 100%;
			object-fit: contain;
		}

		/* Used to show that a pic has been snapped */
		&::after {
			content: '';
			position: fixed;
			inset: 0;
			pointer-events: none;
			opacity: 0;
			background: black;
			transition: opacity 75ms ease;
		}
	}

	main[data-snapping='true'] #viewport::after {
		opacity: 1;
	}

	main {
		--bottom-actions-height: 120px;
		--ui-surfaces: rgba(0 0 0 / 25%);
	}

	.floating-messages {
		z-index: 20;
		position: fixed;
		inset-inline: 0;
		bottom: calc(var(--bottom-actions-height) + 1.5em);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;

		p {
			color: white;
			background: var(--ui-surfaces);
			border-radius: 99999px;
			padding: 0.5em 1em;
		}
	}

	.floating-action {
		z-index: 15;
		position: fixed;
		inset-inline: 0;
		bottom: calc(var(--bottom-actions-height) - 0.75em);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;

		--fg: white;

		&[data-blink='true'] {
			animation: blink infinite 1s;
		}
	}

	.actions {
		z-index: 20;
		position: fixed;
		inset-inline: 0;
		display: grid;
		grid-template-columns: 1fr 1.5fr 1fr;

		/* ButtonIcon & ButtonInk colors */
		--fg: white;
		--bg: var(--ui-surfaces);
		--bg-hover: var(--ui-surfaces);

		& > * {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.25em;
			transition: opacity 500ms;

			&:first-child {
				justify-content: flex-start;
			}

			&:last-child {
				justify-content: flex-end;
			}
		}

		&[data-is-shooting='true'] > *:not(.shoot) {
			opacity: 0;
		}

		&:is(header) {
			top: 0;
			padding: 1em;
		}

		&:is(footer) {
			bottom: 0;
			/* XXX: so that floating-messages can be positioned right */
			height: var(--bottom-actions-height);
			padding: 1.5em;
			/* background: linear-gradient(to bottom, transparent 25%, rgba(0 0 0 / 50%)); */
		}

		button {
			background: none;
			font-size: 1rem;
		}

		.photo-count {
			font-size: 1rem;
			font-weight: normal;
			font-variant-numeric: tabular-nums;
		}

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

		.info {
			color: white;
			text-align: center;

			code {
				font-size: 0.9em;
			}
		}
	}

	button.shoot {
		.shoot-icon {
			height: 5em;
			width: 5em;
			--color: white;
		}

		&:active,
		&:focus-visible {
			.shoot-icon circle.inside {
				scale: 0.5;
			}
		}

		&:disabled .shoot-icon {
			--color: darkgray;
		}

		.shoot-icon circle {
			transition: 500ms;
			transform-origin: 50% 50%;
			rotate: -90deg;

			--lap-progress-color: white;

			&.timer-progress,
			&.lap-progress {
				transition: 50ms linear;
			}
		}

		.shoot-icon .inside {
			transform-origin: 50% 50%;
			rx: 50%;
			transition:
				scale 100ms ease,
				rx 100ms ease;

			&.recording {
				scale: 50%;
				rx: 10%;
				--color: red;
			}
		}

		.shoot-icon[data-phase='wait-start-timer'] .ring {
			animation: blink infinite 1s ease;
		}

		.shoot-icon[data-shoot='on-timer'][data-phase='timer-running'] .lap-progress {
			stroke-width: 2px;
		}

		& {
			position: relative;

			.start-timer-icon {
				position: absolute;
				inset: 0;
				display: flex;
				justify-content: center;
				align-items: center;
			}
		}
	}

	@keyframes blink {
		from {
			opacity: 1;
		}
		50% {
			opacity: 0.125;
		}
		to {
			opacity: 1;
		}
	}

	main {
		height: 100vh;

		&:not([data-transparent='true']) {
			background: black;
		}
	}

	.audio-monitor {
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: var(--fg-neutral);
		padding: 2rem;

		.history {
			height: 200px;
			width: 100%;
			display: flex;
			justify-content: end;
			align-items: end;
			gap: 5px;
			overflow: clip;
		}

		.history .tick {
			width: 1px;
			flex-shrink: 0;
			height: calc(max(1px, var(--amplitude) * 10 * 100%));
			background: var(--fg-neutral);
			border-radius: 1000px;

			&.recorded {
				background: var(--fg-primary);
			}
		}

		.vu-meter {
			rotate: -90deg;
			width: 200px;
			--height: 100px;
			--inactive-bg: rgb(from var(--fg-primary) r g b / 25%);
		}
	}

	.debuginfo {
		position: absolute;
		top: 7rem;
		left: 0;
		color: var(--fg-neutral);
	}
</style>
