import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

/**
 * @type {import("@electron-forge/shared-types").ForgeConfig}
 */
const config = {
	packagerConfig: {
		asar: true,
		icon: './static/icon'
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({
			iconUrl: 'https://raw.githubusercontent.com/cigaleapp/cigale/main/static/icon.ico',
			setupIcon: './static/setup-icon.ico'
		}),
		new MakerZIP({}, ['darwin']),
		new MakerRpm({
			options: { icon: './static/icon.png' }
		}),
		new MakerDeb({
			options: { icon: './static/icon.png' }
		})
	],
	publishers: [
		new PublisherGithub({
			prerelease: true,
			draft: true,
			repository: { owner: 'cigaleapp', name: 'cigale' }
		})
	],
	plugins: [
		new VitePlugin({
			// `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
			// If you are familiar with Vite configuration, it will look really familiar.
			build: [
				{
					// `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
					entry: 'src/electron/main.js',
					config: 'vite.electron.config.js',
					target: 'main'
				},
				{
					entry: 'src/electron/preload.js',
					config: 'vite.electron-preload.config.js',
					target: 'preload'
				}
			],
			renderer: [
				{
					name: 'main_window',
					config: 'vite.config.js'
				}
			]
		}),
		// Fuses are used to enable/disable various Electron functionality
		// at package time, before code signing the application
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true
		})
	]
};

export default config;
