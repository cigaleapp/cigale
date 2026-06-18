import type { BundleInfo } from '@capgo/capacitor-updater';
import type { ClientInit } from '@sveltejs/kit';

import { App } from '@capacitor/app';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { ms } from 'convert';

import { toasts } from '$lib/toasts.svelte.js';
import * as updater from '$lib/update-bundles.js';

let downloaded: BundleInfo | undefined;

export const init: ClientInit = async () => {
	await CapacitorUpdater.notifyAppReady();
	console.info(`Client initalized`);

	App.addListener('appStateChange', async (state) => {
		if (state.isActive) {
			console.info('Checking for new update bundles…');
			const update = await updater.check();

			if (!update) return;

			console.info('New update bundle found!');

			if (!updater.compatible(update)) {
				console.warn(
					'Currently published update bundle is not compatible with the installed app',
					update
				);
				return;
			}

			console.info('Downloading update bundle...', update);

			downloaded = await updater.download(update);

			console.info('Downloaded update bundle', downloaded);

			localStorage.setItem('updateBundle', downloaded ? JSON.stringify(downloaded) : 'null');
			localStorage.setItem('updateMetadata', downloaded ? JSON.stringify(update) : 'null');
		}

		if (!state.isActive && downloaded) {
			await updater.install(downloaded);
			setTimeout(() => {
				toasts.info('App mise à jour');
			}, ms('3s'));
		}
	});
};
