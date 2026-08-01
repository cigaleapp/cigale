<script lang="ts">
	import type { CameraState } from './camera.js';

	import { CameraPreview } from '@capacitor-community/camera-preview';
	import { App } from '@capacitor/app';
	import { Capacitor } from '@capacitor/core';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	import '@layflags/rolling-number';

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
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { geolocationAccuracyToConfidence, getCurrentLocation } from '$lib/geolocation.js';
	import { percent, plural } from '$lib/i18n.js';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import LoadingScreen from '$lib/LoadingScreen.svelte';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import { storeMetadataValue } from '$lib/metadata/storage.js';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { goto } from '$lib/paths.js';
	import { isMetadataInProtocol } from '$lib/schemas/protocols.js';
	import { getSettings, toggleSetting } from '$lib/settings.svelte.js';
	import { sfx } from '$lib/sound.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { afterDelay, cycleValues, orEmpty, switchValue } from '$lib/utils.js';

	import ModalSubmitIssue from '../ModalSubmitIssue.svelte';
	import {
		cameraStarted,
		capture,
		refreshSupportedFlashModes,
		startCamera,
		waitForCapture,
	} from './camera.js';
	import { PendingStorage } from './pendingstorage.svelte.js';
	import { displayTimerConfig, Timer } from './timers.svelte.js';

	let submitBugReport = $state<() => void>();

	type ShootingPhase =
		'inert' | 'before-timer' | 'wait-start-timer' | 'timer-running' | 'after-timer' | 'done';

	let shootingPhase = $state<ShootingPhase>('inert');

	$effect(() => {
		if (!uiState.currentSession) return;
		if (shootingPhase === 'inert') {
			shootingPhase = uiState.currentSession.captureModeShootingPhase;
		}
	});

	function setShootingPhase(phase: ShootingPhase) {
		shootingPhase = phase;
		if (!uiState.currentSessionId) return;
		void tables.Session.update(uiState.currentSessionId, 'captureModeShootingPhase', phase);
	}

	function resetShootingPhase() {
		// TODO: handle other phases too
		// we reset when re-opening the page from a state leaves us in a weird UI:
		// for example, (for now), if we restart the page with a phase set to timer-running,
		// the Timer instance won't be actually started so itll be weird.
		// same for after/before phases, the frozen messages wont be shown...

		setShootingPhase(
			switchValue(shootingPhase, {
				inert: 'inert', // duh
				'before-timer': 'inert',
				'wait-start-timer': 'wait-start-timer',
				// for timer-running, handle it slightly better by setting it to wait-start-timer instead
				'timer-running': 'wait-start-timer',
				'after-timer': 'inert',
				done: 'inert',
			})
		);
	}

	let floatingMessage = $state('');
	let floatingMessageFadeout = $state<number>();
	function setFloatingMessage(category: string, message: string) {
		if (!message || !category) return;

		if (floatingMessageFadeout) {
			clearTimeout(floatingMessageFadeout);
		}

		floatingMessage = `${category}: ${message}`;
		floatingMessageFadeout = afterDelay('3s', () => {
			floatingMessage = '';
		});
	}

	/**
	 * Sets a floating message but prevents it from being removed after a timemout
	 */
	function freezeFloatingMessage(category: string, message: string) {
		setFloatingMessage(category, message);
		if (floatingMessageFadeout) clearTimeout(floatingMessageFadeout);
	}

	function clearFloatingMessage() {
		if (floatingMessageFadeout) clearTimeout(floatingMessageFadeout);
		floatingMessage = '';
	}

	let camera = $state<CameraState>({
		ready: false,
		snapping: false,
		failure: '',
		side: 'rear',
		listeners: {
			onsaved: [],
		},
		flash: {
			current: 'off',
			supported: [],
		},
	});

	const ready = $derived(camera.ready);
	const failure = $derived(camera.failure);

	// The entire page needs to be transparent so that the native preview
	// (that isn't within the DOM) can be seen through the UI
	const transparentDocument = $derived(ready && Capacitor.isNativePlatform());

	let pendingStorage = $state<PendingStorage>();
	$effect(() => {
		if (!uiState.currentSessionId) {
			// No sessions: go back to pick a session first!!!
			void goto('/(app)/sessions');
			return;
		}

		PendingStorage.open(uiState.currentSessionId).then((storage) => {
			pendingStorage = storage;
		});
	});

	$effect(() => {
		if (ready) console.debug('Camera is ready');
	});

	$effect(() => {
		document.body.dataset.transparent = transparentDocument.toString();

		return () => {
			document.body.dataset.transparent = 'false';
		};
	});

	$effect(() => {
		App.addListener('resume', async () => {
			console.debug('Resuming camera');
			if (await cameraStarted(true)) await CameraPreview.stop();
			const webPreview = document.getElementById('preview');
			await startCamera(webPreview, camera);
		});
	});

	onDestroy(() => {
		CameraPreview.stop();
	});

	let askBeforeQuitting = $state<() => Promise<boolean>>();
	async function quit() {
		// Storage not ready yet
		if (!pendingStorage) return;
		// Modal not ready yet
		if (!askBeforeQuitting) return;

		if (pendingStorage.count > 0) {
			const quitAnyways = await askBeforeQuitting();
			if (!quitAnyways) return;
		}

		void pendingStorage.clear();
		resetShootingPhase();
		await goto('/(app)/(sidepanel)/import');
	}

	async function finish() {
		const allOk = await pendingStorage?.flush({
			onProgress({ done, total }) {
				setFloatingMessage('Import', `${done}/${total} (${percent(done / total)})`);
			},
		});

		if (allOk) {
			resetShootingPhase();
			await goto('/(app)/(sidepanel)/import');
		}
	}

	async function runCaptureInferences(selector: 'before-timer' | 'after-timer') {
		if (!uiState.currentProtocol) return;

		const beforeTimerInferences = tables.Metadata.state
			.filter((m) => isMetadataInProtocol(uiState.currentProtocol, m.id))
			.filter((m) => m.infer && 'capture' in m.infer && m.infer.capture === selector);

		async function askForPics() {
			// Gather all file-type metadata with before-timer capture inference
			const picsToTake = beforeTimerInferences
				.filter((m) => m.type === 'file')
				.filter((m) => m.accept.includes('image/*'));

			pendingStorage?.freezeCount();

			for (const metadata of picsToTake) {
				freezeFloatingMessage('Prendre en photo', metadata.label);
				const pic = await waitForCapture(camera);
				await pendingStorage?.flushToMetadata(pic.name, metadata.id);
			}

			await pendingStorage?.unfreezeCount();

			clearFloatingMessage();
		}

		if (selector === 'before-timer') await askForPics();

		// Gather all other before-timer capture inferences
		for (const metadata of beforeTimerInferences) {
			freezeFloatingMessage('Collecte', metadata.label);
			switch (metadata.type) {
				case 'file':
					continue;
				case 'date': {
					await storeMetadataValue({
						db: databaseHandle(),
						type: 'date',
						value: new Date(),
						metadataId: metadata.id,
						sessionId: uiState.currentSessionId!,
						subjectId: uiState.currentSessionId!,
					});
					break;
				}
				case 'location': {
					const position = await getCurrentLocation();
					if (!position) return;

					await storeMetadataValue({
						db: databaseHandle(),
						type: 'location',
						confidence: geolocationAccuracyToConfidence(position.accuracy),
						value: position,
						metadataId: metadata.id,
						sessionId: uiState.currentSessionId!,
						subjectId: uiState.currentSessionId!,
					});
					break;
				}
			}
		}

		clearFloatingMessage();

		if (selector === 'after-timer') await askForPics();
	}

	const timers = $derived(uiState.currentProtocol?.capture?.timers ?? []);

	const timerIndex = $derived(uiState.currentSession?.captureModeSelectedTimerIndex);

	$effect(() => {
		if (!timer) setShootingPhase('inert');
	});

	const timer = $derived.by(() => {
		const settings = timers[timerIndex ?? -1];

		if (!settings) return;
		return new Timer(settings, {
			onstart(t) {
				setShootingPhase('timer-running');
				setFloatingMessage('Timer', t.formatMessage(settings.messages.start));
				void Haptics.impact({ style: ImpactStyle.Heavy });
			},
			async onlap(t) {
				setFloatingMessage('Timer', t.formatMessage(settings.messages.lap));

				if (settings.shoot === 'on-timer') {
					await capture(camera, pendingStorage);
				} else if (getSettings().timerSounds) {
					sfx('timer-lap');
				}

				void Haptics.impact({ style: ImpactStyle.Medium });
			},
			async onfinished(t) {
				if (getSettings().timerSounds) sfx('timer-finished');
				setShootingPhase('after-timer');
				await Haptics.impact({ style: ImpactStyle.Heavy });
				await runCaptureInferences('after-timer');
				setFloatingMessage('Timer', t.formatMessage(settings.messages.end));
				setShootingPhase('done');
			},
		});
	});

	async function shoot() {
		if (!pendingStorage) return;
		if (!timer) {
			await capture(camera, pendingStorage);
			return;
		}

		switch (shootingPhase) {
			case 'inert': {
				setShootingPhase('before-timer');
				void runCaptureInferences('before-timer').then(() => {
					setShootingPhase('wait-start-timer');
					freezeFloatingMessage('Timer', 'En attente du démarrage');
				});
				break;
			}
			case 'before-timer': {
				await capture(camera, pendingStorage);
				break;
			}
			case 'wait-start-timer': {
				timer.start();
				break;
			}
			case 'timer-running': {
				await capture(camera, pendingStorage);
				break;
			}
			case 'after-timer': {
				await capture(camera, pendingStorage);
				break;
			}
			case 'done': {
				await capture(camera, pendingStorage);
				break;
			}
		}
	}

	onDestroy(() => {
		timer?.stop();
	});
</script>

<ModalSubmitIssue type="bug" bind:open={submitBugReport} trigger={false} />

<ModalConfirm
	key="modal_confirm_cancel_capture"
	cancel="Ne pas quitter"
	confirm="Quitter"
	title="Photos en attente"
	dangerous
	bind:show={askBeforeQuitting}
>
	Il y a {pendingStorage?.count ?? 0} photos en attente qui seront supprimées si tu quitte
</ModalConfirm>

<main data-snapping={camera.snapping} data-transparent={transparentDocument}>
	<header class="actions" pw-testid="actions-top">
		<section class="left">
			<DropdownMenu
				title="Options"
				position="top"
				items={[
					{
						label: '',
						items: [
							...orEmpty(timers.length > 0, {
								label: 'Timer',
								type: 'submenu',
								data: {},
								icon: IconStartTimer,
								subtext: (timer?.config.name ?? 'Aucun') || 'Par défaut',
								submenu: {
									label: 'Timers',
									items: [
										...timers.map((t, i) => ({
											label: t.name || 'Par défaut',
											type: 'selectable',
											key: t.name || 'default',
											selected: timer?.config.name === t.name,
											data: {},
											subtext: displayTimerConfig(t),
											async onclick() {
												timer?.stop();
												await tables.Session.update(
													uiState.currentSessionId!,
													'captureModeSelectedTimerIndex',
													i
												);
												resetShootingPhase();
												setFloatingMessage('Timer', t.name);
											},
										})),
										{
											label: 'Aucun',
											type: 'selectable',
											key: '__none__',
											selected: !timer,
											data: {},
											async onclick() {
												timer?.stop();
												await tables.Session.update(
													uiState.currentSessionId!,
													'captureModeSelectedTimerIndex',
													null
												);
												setShootingPhase('inert');
												setFloatingMessage('Timer', 'Aucun');
											},
										},
									],
								},
							}),
							...orEmpty(Capacitor.isNativePlatform(), {
								label: "Basculer sur l'autre caméra",
								type: 'clickable' as const,
								icon: IconSwitchCameraSides,
								closeOnSelect: false,
								data: {},
								async onclick() {
									await CameraPreview.flip();
									camera.side = cycleValues(['rear', 'front'], camera.side);
									await refreshSupportedFlashModes(camera);

									setFloatingMessage(
										'Objectif',
										switchValue(camera.side, {
											rear: 'Arrière',
											front: 'Avant',
										})
									);
								},
							}),
							{
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
							},
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

			{#if camera.flash.supported.length > 0}
				{const nextFlashMode = $derived(
					cycleValues(camera.flash.supported, camera.flash.current)
				)}

				<ButtonIcon
					help={switchValue(nextFlashMode, {
						off: 'Désactiver le flash',
						on: 'Activer le flash',
						auto: 'Mettre le flash en auto',
						torch: 'Mettre le flash en torche',
					})}
					onclick={async () => {
						// Setting a flash mode when none are available (e.g. front cam)
						// can result in a outright crash

						await refreshSupportedFlashModes(camera);

						if (!camera.flash.supported.includes(nextFlashMode)) {
							toasts.error("Ce mode de flash n'est pas supporté");
							return;
						}

						await CameraPreview.setFlashMode({
							flashMode: nextFlashMode,
						});

						camera.flash.current = nextFlashMode;
						setFloatingMessage(
							'Flash',
							switchValue(camera.flash.current, {
								off: 'Off',
								on: 'On',
								auto: 'Auto',
								torch: 'Lampe-torche',
							})
						);
					}}
				>
					<div class="flash-icon" data-mode={camera.flash.current}>
						{#if camera.flash.current === 'off'}
							<IconFlashOff />
						{:else}
							<IconFlashOn />
						{/if}
					</div>
				</ButtonIcon>
			{/if}
		</section>
		<section class="center">
			{#if timer?.started}
				<div class="info">
					{#each timer.config.messages.status as line, i (i)}
						{const formatted = $derived(timer.formatMessage(line))}
						{const stopwatchPattern = new RegExp(`^[0-9.,'":-\\s]+$`)}

						<svelte:element
							this={stopwatchPattern.test(formatted) ? 'code' : 'div'}
							class="line">{formatted}</svelte:element
						>
					{/each}
				</div>
			{:else if uiState.currentSession}
				<div class="info">{uiState.currentSession.name}</div>
			{/if}
		</section>
		<section class="quit">
			<ButtonIcon help="Quitter" loading onclick={quit}>
				<IconQuit />
			</ButtonIcon>
		</section>
	</header>

	<div class="notready">
		<LoadingScreen {failure} loading={!ready} />
	</div>

	<!-- https://github.com/capacitor-community/camera-preview#extra-web-installation-steps -->
	<div
		id="viewport"
		{@attach (parent) => {
			void startCamera(parent, camera);

			return () => {
				(async () => {
					if (await cameraStarted(true)) {
						await CameraPreview.stop();
					}
				})();
			};
		}}
	></div>

	<section class="floating-messages" pw-testid="floating-messages">
		{#if floatingMessage}
			<p transition:fade={{ duration: 500 }}>
				{floatingMessage}
			</p>
		{/if}
	</section>

	{const shooting = $derived(
		shootingPhase !== 'inert' &&
			shootingPhase !== 'done' &&
			timer?.config.shoot === 'manually' &&
			!timer?.paused
	)}

	<section class="floating-action" data-blink={timer?.paused}>
		{const canPause = $derived(timer?.started)}
		{#if canPause}
			<ButtonInk onclick={() => timer?.togglePause()}>
				{#if timer.paused}
					<IconPlayFill />
					Reprendre
				{:else}
					<IconPause />
					Pause
				{/if}
			</ButtonInk>
		{/if}
	</section>

	<footer class="actions" data-is-shooting={shooting}>
		<section class="left">
			<ButtonSecondary
				subtle
				onclick={async () => goto('/(app)/capture/gallery')}
				aria-label={plural(pendingStorage?.count ?? 0, [
					'Voir la photo prise',
					'Voir les # photos prises',
				])}
				help="Voir les photos prises"
			>
				<IconGallery />
				<span class="photo-count">
					<LoadingText value={pendingStorage?.count ?? Loading} mask="0">
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

		<button class="shoot" disabled={!ready} title="Prendre une photo" onclick={shoot}>
			{const Icon = $derived(
				switchValue(shootingPhase, {
					inert: timer ? IconStartTimer : null,
					'before-timer': null,
					'wait-start-timer': IconPlay,
					'timer-running': switchValue(timer?.config.shoot ?? 'manually', {
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
				data-phase={shootingPhase}
				data-shoot={timer?.config.shoot ?? 'manually'}
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
						if (!timer) {
							node.style.strokeDasharray = '';
							node.style.stroke = 'white';
							return;
						}

						if (!['wait-start-timer', 'timer-running'].includes(shootingPhase)) {
							node.style.strokeDasharray = '';
							node.style.stroke = 'white';
							return;
						}

						const length = node.getTotalLength();

						const gap = 4;
						const nongap = Math.round(
							(length - gap * timer.lapsTotalCount) / timer.lapsTotalCount
						);

						node.style.strokeDasharray = `${nongap} ${gap}`;
						node.style.stroke = 'var(--gay)';
					}}
				></circle>

				{#if !Icon || typeof Icon === 'string'}
					<circle class="inside" cx="50%" cy="50%" r="37%" fill="var(--color, white)"
					></circle>
				{/if}

				{#if timer?.started}
					{#key timer.globalProgress}
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
								node.style.strokeDasharray = `${timer.globalProgress * length} 1000000`;
							}}
						></circle>
					{/key}

					{#key timer.lapProgress}
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
								node.style.strokeDasharray = `${timer.lapProgress * length} 1000000`;
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

			&.inside {
				transform-origin: 50% 50%;
				transition: scale 100ms ease;
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
</style>
