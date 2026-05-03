import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'io.github.cigaleapp',
	appName: 'Cigale',
	webDir: 'public',
	plugins: {
		SplashScreen: {
			// Hidden in load() in file://./src/routes/(app)/+layout.js
			// See https://capacitorjs.com/docs/apis/splash-screen#hiding-the-splash-screen
			launchAutoHide: false
		}
	},
	android: {
		// The app is open source, let's allow anyone to inspect the webview :)
		webContentsDebuggingEnabled: true,
		buildOptions: {
			// https://stackoverflow.com/a/77159058/9943464
			signingType: "apksigner"
		},
	},
};

export default config;
