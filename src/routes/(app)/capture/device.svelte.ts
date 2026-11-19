import type { CameraState, FlashMode } from './camera.js';
import type { MicrophoneState, RecordingCurrent } from './microphone.svelte.js';
import type * as DB from '$lib/database.js';
import type { Attachment } from 'svelte/attachments';

import { CameraPreview } from '@capacitor-community/camera-preview';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capawesome/capacitor-keep-awake';
import { CapacitorAudioRecorder } from '@capgo/capacitor-audio-recorder';
import { ms } from 'convert';
import { watch } from 'runed';
import { onDestroy } from 'svelte';

import { tables } from '$lib/idb.svelte.js';
import { goto } from '$lib/paths.js';
import { uiState } from '$lib/uistate.svelte.js';
import { cycleValues, sleep, switchConditions, switchValue } from '$lib/utils.js';

import {
	cameraStarted,
	capture,
	refreshSupportedFlashModes,
	startCamera,
	waitForCapture,
} from './camera.js';
import { FloatingMessage } from './floatingmessage.svelte.js';
import { runCaptureInferences } from './inferences.svelte.js';
import { AmplitudeTracker, record, startMicrophone } from './microphone.svelte.js';
import { PendingStorage } from './pendingstorage.svelte.js';
import { DeviceTimer } from './timers.svelte.js';

export type ShootingPhase =
	'inert' | 'before-timer' | 'wait-start-timer' | 'timer-running' | 'after-timer' | 'done';

/** Abstracts over camera or microphone */
export class CaptureDevice {
	cameraWebPreviewId: string | undefined;

	storage = $state(new PendingStorage('_'));
	floatingmsg: FloatingMessage;

	deviceTimer = new DeviceTimer(this);
	timer = $derived(this.deviceTimer.timer);
	timerConfigs = $derived(this.deviceTimer.availableConfigs);
	timerName = $derived(this.timer?.config.name);
	timerShoot = $derived(this.timer?.config.shoot ?? 'manually');

	shootingPhase = $state<ShootingPhase>('inert');
	selectedType = $state<'sound' | 'photo'>('photo');

	/** Load camera even if captureType isnt photo. Used when asking for pics at timer start for file session metadata */
	forceLoadCamera = $state(false);

	/** Load microphone even if captureType isnt photo. Used when asking for sounds at timer start for file session metadata */
	forceLoadMicrophone = $state(false);

	/** Takes forceLoad{Camera,Microphone} into account */
	// This is separate from captureType because timers aren't affected by force-loads:
	// force-loads are mostly caused by capture-type inference of session metadata,
	// that happens at start/end of timers: a audio timer can still ask for a picture (setting forceLoadCamera to true)
	// if the protocol has session metadata of type value with accept: image/* and capture: before-timer)
	// Changing timers when force-loading happends would throw off the currently running timer
	type = $derived(
		switchConditions({
			sound: this.forceLoadMicrophone,
			photo: this.forceLoadCamera,
		}) ?? this.selectedType
	);

	audioRecording = $state<undefined | RecordingCurrent>();

	camera = $state<CameraState>({
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

	microphone = $state<MicrophoneState>({
		ready: false,
		recording: false,
		failure: '',
		listeners: {
			onsaved: [],
		},
	});

	amplitudeTracker = new AmplitudeTracker(this.microphone);

	ready = $derived(
		switchValue(this.type, {
			photo: this.camera.ready,
			sound: this.microphone.ready,
		})
	);

	// will also adapt to video once we add it
	recording = $derived(this.microphone.recording);

	shooting = $derived(
		this.recording ||
			(this.shootingPhase !== 'inert' &&
				this.shootingPhase !== 'done' &&
				this.timer?.config.shoot === 'manually' &&
				!this.timer?.paused)
	);

	failure = $derived(this.camera.failure || this.microphone.failure);

	// The entire page needs to be transparent so that the native preview
	// (that isn't within the DOM) can be seen through the UI
	needsTransparentDocument = $derived(
		this.type !== 'sound' && this.ready && Capacitor.isNativePlatform()
	);

	canFlipCamera = $derived(Capacitor.isNativePlatform() && this.type !== 'sound');

	// Gotta stay silent when recording sound!
	canEmitSfx = $derived(this.type !== 'sound');

	nextFlashMode = $derived(cycleValues(this.camera.flash.supported, this.camera.flash.current));

	flashMode = $derived(this.camera.flash.current);

	canSetFlashMode = $derived(this.camera.flash.supported.length > 0);

	constructor(params: {
		sessionId: string;
		startingShootingPhase: ShootingPhase;
		startingTimers: DB.Session['captureModeSelectedTimer'];
		startingType: 'sound' | 'photo';
	}) {
		this.floatingmsg = new FloatingMessage();

		this.shootingPhase = params.startingShootingPhase;
		this.changeTimerConfig(params.startingTimers[this.selectedType]);
		this.selectedType = params.startingType;

		PendingStorage.open(params.sessionId).then((storage) => {
			this.storage = storage;
		});

		// Log when ready
		$effect(() => {
			if (this.ready) console.debug('Capture device is ready');
		});

		// Start microphone if we're on sound type
		$effect(() => {
			if (this.type !== 'sound') return;
			void startMicrophone(this.microphone, this.amplitudeTracker);
			return () => void this.audioRecording?.cancel();
		});

		// Resume camera from sleep on native app
		$effect(() => {
			App.addListener('resume', async () => {
				if (this.type !== 'photo') return;
				console.debug('Resuming camera');
				if (await cameraStarted(true)) await CameraPreview.stop();
				await this.startCamera();
			});
		});

		// Handle document transparency on the document body
		// (should be done in +page.svelte instead maybe)
		$effect(() => {
			document.body.dataset.transparent = this.needsTransparentDocument.toString();

			return () => {
				document.body.dataset.transparent = 'false';
			};
		});

		// Handle page destroy: teardown everything
		onDestroy(() => {
			this.amplitudeTracker.stop();
			CameraPreview.stop();
			void this.audioRecording?.cancel();
			CapacitorAudioRecorder.cancelRecording();
			KeepAwake.allowSleep();
			this.timer?.stop();
		});
	}

	/** Click on the shoot button */
	async shoot() {
		if (!this.storage) return;

		if (!this.timer) {
			await this.snapPhotoOrToggleRecording();
			return;
		}

		switch (this.shootingPhase) {
			case 'inert': {
				this.setShootingPhase('before-timer');
				void this.runCaptureInferences('before-timer');
				break;
			}
			case 'before-timer': {
				await this.snapPhotoOrToggleRecording();
				break;
			}
			case 'wait-start-timer': {
				this.timer.start();
				break;
			}
			case 'timer-running': {
				await this.snapPhotoOrToggleRecording();
				break;
			}
			case 'after-timer': {
				await this.snapPhotoOrToggleRecording();
				break;
			}
			case 'done': {
				await this.snapPhotoOrToggleRecording();
				break;
			}
		}
	}

	async selectType(type: 'sound' | 'photo') {
		if (!uiState.currentSession) return;

		this.selectedType = type;

		void tables.Session.update(
			uiState.currentSession.id,
			'captureModeSelectedDeviceType',
			type
		);
	}

	async changeTimerConfig(index: number | null) {
		if (!uiState.currentSession) return;

		this.deviceTimer.switchConfig(index);

		void tables.Session.update(uiState.currentSession.id, 'captureModeSelectedTimer', {
			...uiState.currentSession.captureModeSelectedTimer,
			[this.selectedType]: index,
		});
	}

	setShootingPhase(phase: ShootingPhase) {
		this.shootingPhase = phase;
		if (!uiState.currentSessionId) return;
		void tables.Session.update(uiState.currentSessionId, 'captureModeShootingPhase', phase);
	}

	resetShootingPhase() {
		// TODO: handle other phases too
		// we reset when re-opening the page from a state leaves us in a weird UI:
		// for example, (for now), if we restart the page with a phase set to timer-running,
		// the Timer instance won't be actually started so itll be weird.
		// same for after/before phases, the frozen messages wont be shown...

		this.setShootingPhase(
			switchValue(this.shootingPhase, {
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

	async recordOrCapture(durationMs: number | undefined) {
		switch (this.type) {
			case 'photo': {
				await capture(this.camera, this.storage);
				break;
			}
			case 'sound': {
				this.audioRecording = await record(this.microphone, this.storage);

				sleep(durationMs ?? ms('10s')).then(async () => {
					this.audioRecording?.finish();
					this.audioRecording = undefined;
				});

				break;
			}
		}
	}

	async snapPhotoOrToggleRecording() {
		if (!this.storage) return;
		switch (this.type) {
			case 'sound': {
				if (this.audioRecording) {
					await this.audioRecording.finish();
					this.audioRecording = undefined;
				} else {
					this.audioRecording = await record(this.microphone, this.storage);
				}
				break;
			}
			case 'photo': {
				await capture(this.camera, this.storage);
				break;
			}
		}
	}

	async runCaptureInferences(selector: 'before-timer' | 'after-timer') {
		await runCaptureInferences(this, selector);
	}

	async cameraStarted({ fallback }: { fallback: boolean }) {
		return cameraStarted(fallback);
	}

	async startCamera() {
		if (!this.cameraWebPreviewId) return;
		const webElement = document.getElementById(this.cameraWebPreviewId);
		if (!webElement) return;
		await startCamera(webElement, this.camera);
	}

	cameraViewport: Attachment = (node) => {
		if (!(node instanceof HTMLElement)) return;

		this.cameraWebPreviewId = node.id;

		void startCamera(node, this.camera);

		return () => {
			void (async () => {
				if (await this.cameraStarted({ fallback: true })) {
					await CameraPreview.stop();
				}
			})();
		};
	};

	async refreshSupportedFlashModes() {
		await refreshSupportedFlashModes(this.camera);
	}

	async waitForCameraCapture() {
		return waitForCapture(this.camera);
	}

	async flipCameraSide() {
		await CameraPreview.flip();
		this.camera.side = cycleValues(['rear', 'front'], this.camera.side);
		await this.refreshSupportedFlashModes();
		return this.camera.side;
	}

	async supportsFlashMode(flashMode: FlashMode) {
		await this.refreshSupportedFlashModes();
		return this.camera.flash.supported.includes(flashMode);
	}

	async setFlashMode(mode: FlashMode) {
		const supported = await this.supportsFlashMode(mode);
		if (!supported) {
			// Setting a flash mode when none are available (e.g. front cam)
			// can result in a outright crash
			throw new Error("Ce mode de flash n'est pas supporté");
		}

		await CameraPreview.setFlashMode({
			flashMode: mode,
		});

		this.camera.flash.current = mode;

		return mode;
	}
}
