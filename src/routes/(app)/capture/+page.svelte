<script lang="ts">
	import type { CameraState } from './camera.js';

	import { CameraPreview } from '@capacitor-community/camera-preview';
	import { App } from '@capacitor/app';
	import { Capacitor } from '@capacitor/core';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';
	import { CapacitorAudioRecorder } from '@capgo/capacitor-audio-recorder';
	import { ms } from 'convert';
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	import '@layflags/rolling-number';

	import type { MicrophoneState, RecordingCurrent } from './microphone.svelte.js';

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
	import { geolocationAccuracyToConfidence, getCurrentLocation } from '$lib/geolocation.js';
	import { percent, plural } from '$lib/i18n.js';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import LoadingScreen from '$lib/LoadingScreen.svelte';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import { storeMetadataValue } from '$lib/metadata/storage.js';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { goto } from '$lib/paths.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { isMetadataInProtocol } from '$lib/schemas/protocols.js';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { getSettings, toggleSetting } from '$lib/settings.svelte.js';
	import { sfx } from '$lib/sound.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { afterDelay, cycleValues, orEmpty, switchValue } from '$lib/utils.js';
	import ModalSubmitIssue from '$routes/(app)/ModalSubmitIssue.svelte';

	import {
		cameraStarted,
		capture,
		refreshSupportedFlashModes,
		startCamera,
		waitForCapture,
	} from './camera.js';
	import { AmplitudeTracker, record, startMicrophone } from './microphone.svelte.js';
	import { PendingStorage } from './pendingstorage.svelte.js';
	import { displayTimerConfig, Timer } from './timers.svelte.js';

	let submitBugReport = $state<() => void>();

	// TODO: default to whatever the protocol defines
	let captureType = $state<'sound' | 'photo'>('sound');

	/** Load camera even if captureType isnt photo. Used when asking for pics at timer start for file session metadata */
	let forceLoadCamera = $state(false);

	type ShootingPhase =
		'inert' | 'before-timer' | 'wait-start-timer' | 'timer-running' | 'after-timer' | 'done';

	let shootingPhase = $state<ShootingPhase>('inert');

	let recording = $state<undefined | RecordingCurrent>();

	$effect(() => {
		if (!uiState.currentSession) return;
		if (shootingPhase === 'inert') {
			shootingPhase = uiState.currentSession.captureModeShootingPhase;
		}
	});

	const sfxEnabled = $derived(getSettings().timerSounds && captureType !== 'sound');

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

	let microphone = $state<MicrophoneState>({
		ready: false,
		recording: false,
		failure: '',
		listeners: {
			onsaved: [],
		},
	});

	const amplitudeTracker = new AmplitudeTracker(microphone);

	onDestroy(() => {
		amplitudeTracker.stop();
	});

	const ready = $derived(
		captureType === 'photo' || forceLoadCamera ? camera.ready : microphone.ready
	);

	const failure = $derived(camera.failure || microphone.failure);

	// The entire page needs to be transparent so that the native preview
	// (that isn't within the DOM) can be seen through the UI
	const transparentDocument = $derived(ready && Capacitor.isNativePlatform());

	let pendingStorage = $state(new PendingStorage(''));
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
		if (captureType !== 'sound') return;
		void startMicrophone(microphone, amplitudeTracker);
		return () => void recording?.cancel();
	});

	$effect(() => {
		return () => CapacitorAudioRecorder.cancelRecording();
	});

	$effect(() => {
		if (ready) console.debug('Capture device is ready');
	});

	$effect(() => {
		document.body.dataset.transparent = transparentDocument.toString();

		return () => {
			document.body.dataset.transparent = 'false';
		};
	});

	$effect(() => {
		App.addListener('resume', async () => {
			if (!forceLoadCamera && captureType !== 'photo') return;
			console.debug('Resuming camera');
			if (await cameraStarted(true)) await CameraPreview.stop();
			const webPreview = document.getElementById('preview');
			await startCamera(webPreview, camera);
		});
	});

	onDestroy(() => {
		CameraPreview.stop();
		void recording?.cancel();
	});

	let askBeforeQuitting = $state<() => Promise<boolean>>();
	async function quit() {
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
		const allOk = await pendingStorage.flush({
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
			forceLoadCamera = true;

			try {
				// Gather all file-type metadata with before-timer capture inference
				const picsToTake = beforeTimerInferences
					.filter((m) => m.type === 'file')
					.filter((m) => m.accept.includes('image/*'));

				pendingStorage.freezeCount();

				for (const metadata of picsToTake) {
					freezeFloatingMessage('Prendre en photo', metadata.label);
					const pic = await waitForCapture(camera);
					await pendingStorage.flushToMetadata(pic.name, metadata.id);
				}

				await pendingStorage.unfreezeCount();

				clearFloatingMessage();
			} finally {
				forceLoadCamera = false;
			}
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

	async function recordOrCapture(durationMs: number | undefined) {
		switch (captureType) {
			case 'photo': {
				await capture(camera, pendingStorage);
				break;
			}
			case 'sound': {
				recording = await record(microphone, pendingStorage);

				sleep(durationMs ?? ms('10s')).then(async () => {
					recording?.finish();
					recording = undefined;
				});

				break;
			}
		}
	}

	const timers = $derived(
		uiState.currentProtocol?.capture?.timers?.filter((timer) =>
			timer.for.includes(captureType)
		) ?? []
	);

	const timerIndex = $derived(uiState.currentSession?.captureModeSelectedTimer[captureType]);

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
					await recordOrCapture(settings.duration);
				} else if (sfxEnabled) {
					sfx('timer-lap');
				}

				void Haptics.impact({ style: ImpactStyle.Medium });
			},
			async onfinished(t) {
				if (settings.shoot === 'on-timer') {
					await recordOrCapture(settings.duration);
				}

				if (sfxEnabled) sfx('timer-finished');
				setShootingPhase('after-timer');
				await Haptics.impact({ style: ImpactStyle.Heavy });
				await runCaptureInferences('after-timer');
				setFloatingMessage('Timer', t.formatMessage(settings.messages.end));
				setShootingPhase('done');
			},
		});
	});

	async function snapPhotoOrToggleRecording() {
		if (!pendingStorage) return;
		switch (captureType) {
			case 'sound': {
				if (recording) {
					await recording.finish();
					recording = undefined;
				} else {
					recording = await record(microphone, pendingStorage);
				}
				break;
			}
			case 'photo': {
				await capture(camera, pendingStorage);
				break;
			}
		}
	}

	async function shoot() {
		if (!pendingStorage) return;
		if (!timer) {
			await snapPhotoOrToggleRecording();
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
				await snapPhotoOrToggleRecording();
				break;
			}
			case 'wait-start-timer': {
				timer.start();
				break;
			}
			case 'timer-running': {
				await snapPhotoOrToggleRecording();
				break;
			}
			case 'after-timer': {
				await snapPhotoOrToggleRecording();
				break;
			}
			case 'done': {
				await snapPhotoOrToggleRecording();
				break;
			}
		}
	}

	onDestroy(() => {
		timer?.stop();
	});

	const shooting = $derived(
		microphone.recording ||
			(shootingPhase !== 'inert' &&
				shootingPhase !== 'done' &&
				timer?.config.shoot === 'manually' &&
				!timer?.paused)
	);
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
	<div class="debuginfo">
		<DebugOnly data={{ shootingPhase, timerIndex, timer: timer?.config.name ?? null }} />
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
													'captureModeSelectedTimer',
													{
														...getSettings().captureModeSelectedTimer,
														[captureType]: i,
													}
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
													'captureModeSelectedTimer',
													{
														...getSettings().captureModeSelectedTimer,
														[captureType]: null,
													}
												);
												setShootingPhase('inert');
												setFloatingMessage('Timer', 'Aucun');
											},
										},
									],
								},
							}),
							...orEmpty(Capacitor.isNativePlatform() && captureType !== 'sound', {
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
							...orEmpty(captureType !== 'sound', {
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
			{:else}
				<div class="modes">
					<SegmentedGroup
						disabled={shooting}
						bind:current={captureType}
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
		<LoadingScreen {failure} loading={!ready} />
	</div>

	{#if captureType === 'photo' || forceLoadCamera}
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
	{:else}
		<!-- TODO: realtime audio level meter + waveform (or just coarse graph of amplitude history)? -->

		<div class="audio-monitor">
			<div class="vu-meter">
				<!-- < value={(amplitudeTracker.history.at(-1) ?? 0) * 10 * 1e6} max={1e6}
				></progress> -->
				<ProgressBar alwaysActive progress={amplitudeTracker.latestFrame.amplitude * 20} />
			</div>

			<div class="history">
				{#each amplitudeTracker.history as { amplitude, recorded }, i (i)}
					<div class="tick" class:recorded style:--amplitude={amplitude}></div>
				{/each}
			</div>
		</div>
	{/if}

	<section class="floating-messages" pw-testid="floating-messages">
		{#if floatingMessage}
			<p transition:fade={{ duration: 500 }}>
				{floatingMessage}
			</p>
		{/if}
	</section>

	<section class="floating-action" data-blink={timer?.paused}>
		{const canPause = $derived(timer?.started)}
		{#if canPause}
			<ButtonInk onclick={() => timer?.togglePause()}>
				{#if timer?.paused}
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
					<rect
						class="inside"
						class:recording={microphone.recording}
						x="14%"
						y="14%"
						width="72%"
						height="72%"
						fill="var(--color, white)"
					></rect>
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
