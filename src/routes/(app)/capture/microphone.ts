import type { PendingStorage } from './pendingstorage.svelte.js';

import { AudioSessionMode, CapacitorAudioRecorder } from '@capgo/capacitor-audio-recorder';

export type MicrophoneState = {
	ready: boolean;
	failure: string;
	recording: boolean;
	listeners: {
		onsaved: Array<(name: string | undefined) => void | Promise<void>>;
	};
};

export async function startMicrophone(state: MicrophoneState) {
	state.failure = '';
	state.ready = false;

	const perms = await CapacitorAudioRecorder.requestPermissions();

	if (perms.recordAudio !== 'granted') {
		state.failure = 'Permission non accordée';
		return;
	}

	state.ready = true;
}

export async function record(
	microphone: MicrophoneState,
	storage: PendingStorage
): Promise<undefined | { finish: () => Promise<void> }> {
	if (!microphone.ready) return;

	await CapacitorAudioRecorder.startRecording({
		audioSessionMode: AudioSessionMode.Default,
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
		},
	};
}

export async function amplitude(microphone: MicrophoneState) {
	if (!microphone.ready) return;

	const { value } = await CapacitorAudioRecorder.getCurrentAmplitude();

	return value;
}

export class AmplitudeTracker {
	/** in ms */
	#pollrate = 100;
	#historyLength = 5;
	#interval: undefined | NodeJS.Timeout | number;
	#history = [] as number[];

	constructor(
		private state: MicrophoneState,
		options: {
			/** in seconds */
			length?: number;
			/** in ms */
			rate?: number;
		}
	) {
		if (options.rate) this.#pollrate = options.rate;
		if (options.length) this.#historyLength = options.length;
	}

	get historySamplesCount() {
		return Math.ceil((this.#historyLength * 1e3) / this.#pollrate);
	}

	#record(sample: number) {
		this.#history.splice(0, this.#history.length - this.historySamplesCount);
		this.#history.push(sample);
	}

	start() {
		this.#interval = setInterval(() => {
			(async () => {
				if (!this.state.ready) return;
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
