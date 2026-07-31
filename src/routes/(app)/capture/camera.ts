import type { PendingStorage } from './pendingstorage.svelte.js';

import { CameraPreview } from '@capacitor-community/camera-preview';
import { Capacitor } from '@capacitor/core';

import { getCurrentLocation } from '$lib/geolocation.js';
import { errorMessage } from '$lib/i18n.js';
import { toasts } from '$lib/toasts.svelte';

const ALL_FLASH_MODES = ['off', 'auto', 'on', 'torch'] as const;
export type FlashMode = (typeof ALL_FLASH_MODES)[number];

export type CameraState = {
	ready: boolean;
	failure: string;
	side: 'rear' | 'front';
	/** Stays true for a small duration while a pic is being saved */
	snapping: boolean;
	listeners: {
		onsaved: Array<(name: string | undefined) => void | Promise<void>>;
	};
	flash: {
		current: FlashMode;
		supported: FlashMode[];
	};
};

/**
 * @param fallback for web, isCameraStarted is not available
 */
export async function cameraStarted(fallback: boolean) {
	if (!Capacitor.isNativePlatform()) return fallback;
	const started = await CameraPreview.isCameraStarted();
	return started.value;
}
export async function startCamera(webElement: HTMLElement | null, state: CameraState) {
	state.failure = '';

	// Ask for permissions
	await getCurrentLocation();

	if (!webElement && !Capacitor.isNativePlatform()) {
		console.error('Cant start camera as platform is web and webElement is null');
	}

	if (await cameraStarted(true)) {
		// We can't just set state to ready and return cuz the side mightve changed
		await CameraPreview.stop().catch(() => {});
	}

	console.debug(`Starting camera on ${state.side}`);
	await CameraPreview.start({
		parent: webElement?.id ?? 'preview',
		position: state.side,
		toBack: true,
		// storeToFile: true,
		disableAudio: true,
		lockAndroidOrientation: true,
		// Causes crashes when app is resumed from background
		// See https://github.com/capacitor-community/camera-preview/issues/421
		// TODO: try re-starting CameraPreview when resuming from background?
		// enableZoom: true,
	})
		.catch((e) => {
			console.error('Couldnt start camera', e);
			state.failure = errorMessage(e);
			state.ready = false;
			state.flash.supported = [];
			state.flash.current = 'off';
		})
		.then(async () => {
			state.ready = await cameraStarted(true);
			if (!state.ready) state.failure = "La caméra n'a pas pu démarrer";
		});

	if (state.ready) await refreshSupportedFlashModes(state);
}

export async function refreshSupportedFlashModes(camera: CameraState) {
	if (!Capacitor.isNativePlatform()) {
		camera.flash.current = 'off';
		camera.flash.supported = [];

		return;
	}

	camera.flash.supported = await CameraPreview.getSupportedFlashModes()
		.then(({ result }) =>
			result.filter((mode): mode is FlashMode => ALL_FLASH_MODES.includes(mode as FlashMode))
		)
		.catch(() => []);

	if (!camera.flash.supported.includes(camera.flash.current)) {
		camera.flash.current = 'off';
	}
}

export async function capture(camera: CameraState, storage: PendingStorage) {
	const { value: output } = await CameraPreview.capture({});

	camera.snapping = true;
	setTimeout(() => {
		camera.snapping = false;
	}, 100);

	if (!storage) {
		toasts.error("Le stockage n'est pas encore prêt, veuillez rééssayer");
		return;
	}

	void storage
		.save(output)
		.then(async (name) => {
			// oxlint-disable-next-line promise/no-callback-in-promise
			await Promise.all(camera.listeners.onsaved.map(async (cb) => cb(name)));
		})
		.catch(async () => {
			// oxlint-disable-next-line promise/no-callback-in-promise
			await Promise.all(camera.listeners.onsaved.map(async (cb) => cb(undefined)));
		});
}

export async function waitForCapture(camera: CameraState): Promise<{ name: string }> {
	return new Promise((resolve, reject) => {
		camera.listeners.onsaved.push((name) =>
			name ? resolve({ name }) : reject('Impossible de sauvegarder la photo')
		);
	});
}
