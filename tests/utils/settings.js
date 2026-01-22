import { Schemas } from '../../src/lib/database.js';

/**
 * @import { Page } from '@playwright/test';
 * @import { Settings } from '$lib/database.js';
 */

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {Partial<Settings>} newSettings
 */
export async function setSettings({ page }, newSettings) {
	await page.evaluate(async ([newSettings]) => {
		let maxAttempts = 100;
		let settings = await window.DB.get('Settings', 'user').then(
			(settings) => settings ?? window.DB.get('Settings', 'defaults')
		);

		while (!settings && maxAttempts-- > 0) {
			await new Promise((r) => setTimeout(r, 100));
			settings = await window.DB.get('Settings', 'user').then(
				(settings) => settings ?? window.DB.get('Settings', 'defaults')
			);
		}

		if (!settings) throw new Error('Settings not found in the database');

		await window.DB.put('Settings', {
			...settings,
			id: 'user',
			...newSettings
		});

		window.refreshDB();
	}, /** @type {const} */ ([newSettings]));
}

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @returns {Promise<Settings>}
 */
export async function getSettings({ page }) {
	const raw = await page.evaluate(async () => {
		window.refreshDB();
		const settings = await window.DB.get('Settings', 'user').then(
			(settings) => settings ?? window.DB.get('Settings', 'defaults')
		);

		if (!settings) throw new Error('Settings not found in the database');

		return settings;
	});

	return Schemas.Settings.assert(raw);
}

/**
 *
 * @param {Page} page
 * @param {Parameters<import('@playwright/test').Locator['click']>[0]} [clickOptions]
 */
export function openSettings(page, clickOptions) {
	return page.getByTestId('settings-button').click(clickOptions);
}
