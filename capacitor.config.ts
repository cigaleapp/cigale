/// <reference types="@types/node" />
/// <reference types="@capacitor/splash-screen" />
/// <reference types="@capgo/capacitor-updater" />

import { networkInterfaces } from 'node:os';
import type { CapacitorConfig } from '@capacitor/cli';

import arkenv from 'arkenv';
import { type } from 'arktype';

/**
 * Put this as your computer's IP in your box's DHCP config
 * to avoid having to change this file
 */
const DEVELOPMENT_COMPUTER_NETWORK_IP = '192.168.1.41';

const env = arkenv({
	CAPACITOR_LIVE_RELOAD: type.boolean.default(() => {
		if (process.env.CI) return false;

		// Used to enable CAPACITOR_LIVE_RELOAD
		// when building/running the app through Android Studio
		// (annoying to set an env var there)
		const isLocal = Object.values(networkInterfaces())
			.flat()
			.filter((iface) => iface !== undefined)
			.some(({ address }) => address === DEVELOPMENT_COMPUTER_NETWORK_IP);

		if (isLocal) {
			console.info(`Building on local dev computer, enabling CAPACITOR_LIVE_RELOAD`);
			return true;
		}

		return false;
	}),
});

const config: CapacitorConfig = {
	appId: 'io.github.cigaleapp',
	appName: 'Cigale',
	webDir: 'public',
	plugins: {
		SplashScreen: {
			// Hidden in load() in file://./src/routes/(app)/+layout.js
			// See https://capacitorjs.com/docs/apis/splash-screen#hiding-the-splash-screen
			launchAutoHide: false,
		},
		CapacitorUpdater: {
			autoUpdate: 'atBackground',
		},
	},
	android: {
		// The app is open source, let's allow anyone to inspect the webview :)
		webContentsDebuggingEnabled: true,
		buildOptions: {
			// https://stackoverflow.com/a/77159058/9943464
			signingType: 'apksigner',
		},
	},
	server: env.CAPACITOR_LIVE_RELOAD
		? {
				url: `http://${DEVELOPMENT_COMPUTER_NETWORK_IP}:5173`,
				cleartext: true,
			}
		: undefined,
};

export default config;
