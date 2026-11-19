import type { PendingStorage } from './pendingstorage.svelte.js';

import { Capacitor } from '@capacitor/core';
import { AudioSessionMode, CapacitorAudioRecorder } from '@capgo/capacitor-audio-recorder';

import { getSetting } from '$lib/settings.svelte.js';
import { range, sleep } from '$lib/utils.js';

export type MicrophoneState = {
	ready: boolean;
	failure: string;
	recording: boolean;
	listeners: {
		onsaved: Array<() => void | Promise<void>>;
	};
};

export async function startMicrophone(state: MicrophoneState, amplitudeTracker: AmplitudeTracker) {
	state.failure = '';
	state.ready = false;

	const perms = await CapacitorAudioRecorder.requestPermissions();

	if (perms.recordAudio !== 'granted') {
		state.failure = 'Permission non accordée';
		console.error(perms);
		return;
	}

	state.ready = true;

	await CapacitorAudioRecorder.startRecording({
		audioSessionMode: AudioSessionMode.Measurement,
	});

	amplitudeTracker.start();
}

export type RecordingCurrent = {
	finish: () => Promise<void>;
	cancel: () => Promise<void>;
};

export async function record(
	microphone: MicrophoneState,
	storage: PendingStorage
): Promise<undefined | RecordingCurrent> {
	if (!microphone.ready) return;
	if (microphone.recording) return;

	await CapacitorAudioRecorder.cancelRecording().catch(() => {});

	await CapacitorAudioRecorder.startRecording({
		audioSessionMode: AudioSessionMode.Default,
		format: (await getSetting('audioCaptureUseAAC')) ? 'aac' : 'm4a',
	});

	microphone.recording = true;

	const notifyCallbacks = async (value: string | undefined) =>
		await Promise.all(microphone.listeners.onsaved.map(async (cb) => cb(value)));

	return {
		async finish() {
			try {
				const result = await CapacitorAudioRecorder.stopRecording();

				const output = result.blob ?? result.uri;
				if (!output) {
					throw new Error("Impossible de terminer l'enregistrement");
				}

				const name = await storage.saveAudio(output);

				await notifyCallbacks(name);
			} catch {
				await notifyCallbacks(undefined);
			} finally {
				microphone.recording = false;
			}

			await CapacitorAudioRecorder.startRecording({
				audioSessionMode: AudioSessionMode.Measurement,
			});
		},
		async cancel() {
			try {
				await CapacitorAudioRecorder.cancelRecording();
			} finally {
				microphone.recording = false;
			}

			await CapacitorAudioRecorder.startRecording({
				audioSessionMode: AudioSessionMode.Measurement,
			});
		},
	};
}

export async function amplitude(microphone: MicrophoneState) {
	if (!microphone.ready) return;

	const { value } = await CapacitorAudioRecorder.getCurrentAmplitude();

	return value;
}

type Frame = {
	recorded: boolean;
	amplitude: number;
};

export class AmplitudeTracker {
	/** in ms */
	#pollrate = 100;
	#historyLength = 50;
	#interval: undefined | NodeJS.Timeout | number;
	history = $state<Frame[]>([]);
	microphone = $state<MicrophoneState>();

	latestFrame = $derived(
		this.history.at(-1) ?? {
			amplitude: 0,
			recorded: false,
		}
	);

	constructor(
		microphone: MicrophoneState,
		options: {
			/** in seconds */
			length?: number;
			/** in ms */
			rate?: number;
		} = {}
	) {
		this.microphone = microphone;
		if (options.rate) this.#pollrate = options.rate;
		if (options.length) this.#historyLength = options.length;
		this.history = range(this.historySamplesCount).map((_) => ({
			recorded: false,
			amplitude: 0,
		}));
	}

	get historySamplesCount() {
		return Math.ceil((this.#historyLength * 1e3) / this.#pollrate);
	}

	#record(amplitude: number) {
		if (!this.microphone) return;
		this.history.splice(0, this.history.length - this.historySamplesCount);
		this.history.push({ amplitude, recorded: this.microphone.recording });
	}

	start() {
		this.#interval = setInterval(() => {
			void (async () => {
				if (!this.microphone?.ready) return;
				const { value } = await CapacitorAudioRecorder.getCurrentAmplitude();
				this.#record(value);
			})();
		}, this.#pollrate);
	}

	stop() {
		if (!this.#interval) return;
		clearTimeout(this.#interval);
	}
}
