import { expect } from '@playwright/test';
import path from 'node:path';

/**
 * @import { Page } from '@playwright/test';
 * @import { Settings } from '$lib/database.js';
 */

/**
 *
 * @param {{page: Page}} ctx
 * @param {...string} names paths relative to ./tests/fixtures. If no extension is provided, .jpeg is used
 */
export async function importPhotos({ page }, ...names) {
	if (!names) throw new Error('No file names provided');
	names = names.map((name) => (path.extname(name) ? name : `${name}.jpeg`));

	await page.goto('/');
	await page.getByTestId('protocol-to-choose').click();
	await page.waitForURL((u) => u.hash === '#/import');
	await expect(page.getByText(/Cliquer ou déposer des images ici/)).toBeVisible();
	const fileInput = await page.$("input[type='file']");
	await fileInput?.setInputFiles(names.map((f) => path.join('./tests/fixtures', f)));
	await expect(page.getByText(names.at(-1), { exact: true })).toBeVisible({
		timeout: 20_000
	});
}

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {Partial<Settings>} newSettings
 */
export async function setSettings({ page }, newSettings) {
	await page.evaluate(async ([newSettings]) => {
		const settings = await window.DB.get('Settings', 'user').then(
			(settings) => settings ?? window.DB.get('Settings', 'defaults')
		);
		if (!settings) throw new Error('Settings not found in the database');
		await window.DB.put('Settings', { ...settings, id: 'user', ...newSettings });
	}, /** @type {const} */ ([newSettings]));
}

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @returns {Promise<Settings>}
 */
export async function getSettings({ page }) {
	return page.evaluate(async () => {
		const settings = await window.DB.get('Settings', 'user').then(
			(settings) => settings ?? window.DB.get('Settings', 'defaults')
		);
		if (!settings) throw new Error('Settings not found in the database');
		return settings;
	});
}
