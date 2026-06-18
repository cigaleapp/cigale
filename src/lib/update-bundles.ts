import type { BundleInfo } from '@capgo/capacitor-updater';

import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

import { UpdateBundleMetadata } from './schemas/update-bundle.js';

/**
 * Check for new update bundles
 * @returns the currently published update bundle, if we aren't currently on it already
 */
export async function check() {
	if (!Capacitor.isNativePlatform()) return undefined;

	const published = await fetch('https://apk.cigale.gwen.works/update.json')
		.then((response) => response.json())
		.then((json) => UpdateBundleMetadata.assert(json));

	if (published.sha !== import.meta.env.buildCommit) {
		return published;
	}

	return undefined;
}

/**
 * Download a given update bundle.
 * @returns undefined if the checksums didn't match or an error occurred
 */
export async function download(bundle: (typeof UpdateBundleMetadata)['infer']) {
	try {
		const downloaded = await CapacitorUpdater.download({
			version: bundle.version,
			url: 'https://apk.cigale.gwen.works/update.zip',
		});

		if (bundle.checksum === downloaded.checksum) {
			return downloaded;
		} else {
			console.error(
				`Update bundle checksum for ${downloaded.version} did not match published checksum: published is ${bundle.checksum}, computed is ${downloaded.checksum}. Will not apply the update.`
			);

			try {
				await CapacitorUpdater.delete({
					id: downloaded.id,
				});
			} catch (error) {
				console.error("Couldn't delete wrong-checksum update bundle", error);
			}
		}
	} catch (error) {
		console.error(`An error occured while downloading update bundle`, bundle, ': ', error);
	}
}

/**
 * Install a given update bundle
 */
export async function install(downloaded: BundleInfo) {
	await SplashScreen.show();
	try {
		await CapacitorUpdater.set(downloaded);
	} catch (error) {
		console.error('Could not apply update bundle', downloaded, ': ', error);
		await SplashScreen.hide();
	}
}

/**
 * Verifies that a given update bundle can be updated from the current version
 */
export function compatible(bundle: (typeof UpdateBundleMetadata)['infer']) {
	console.info(
		`Checking update bundle native code version compatibility: ${bundle.android_native_code_version} (online) vs ${import.meta.env.androidNativeCodeVersion} (installed)`
	);

	return bundle.android_native_code_version.trim() === import.meta.env.androidNativeCodeVersion.trim();
}
