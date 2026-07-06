import { CameraPreview } from '@capacitor-community/camera-preview';
import { Capacitor } from '@capacitor/core';

import { errorMessage } from '$lib/i18n.js';

const ALL_FLASH_MODES = ['off', 'auto', 'on', 'torch'] as const;
export type FlashMode = (typeof ALL_FLASH_MODES)[number];

export type CameraState = {
	ready: boolean;
	failure: string;
	side: 'rear' | 'front';
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
