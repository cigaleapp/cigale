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
		audioSessionMode: AudioSessionMode.Measurement,
	});
	microphone.recording = true;

	const notifyCallbacks = (state: 'ok' | 'fail') => async (value: string | undefined) =>
		await Promise.all(
			microphone.listeners.onsaved.map(async (cb) => cb(state === 'ok' ? value : undefined))
		);

	return {
		async finish() {
			try {
				const result = await CapacitorAudioRecorder.stopRecording().finally(() => {
					microphone.recording = false;
				});

				const output = result.blob ?? result.uri;
				if (!output) {
					throw new Error("Impossible de terminer l'enregistrement");
				}

				await storage
					.saveAudio(output)
					.then(notifyCallbacks('ok'))
					.catch(notifyCallbacks('fail'));
			} catch {
				await notifyCallbacks('fail')(undefined);
			}
		},
	};
}

export async function amplitude(microphone: MicrophoneState) {
	if (!microphone.ready) return;

	const { value } = await CapacitorAudioRecorder.getCurrentAmplitude();

	return value;
}

export async function waitForRecordFinish(microphone: MicrophoneState) {
	return new Promise((resolve, reject) => {
		microphone.listeners.onsaved.push((name) =>
			name ? resolve({ name }) : reject("Impossible de sauvegarder l'enregistrement")
		);
	});
}
