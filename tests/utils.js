import { expect } from '@playwright/test';
import path from 'node:path';

/**
 * @import { Page } from '@playwright/test';
 * @import { Settings, MetadataValue } from '$lib/database.js';
 */

/**
 *
 * @param {{page: Page}} ctx
 * @param {...string} names paths relative to ./tests/fixtures. If no extension is provided, .jpeg is used
 */
export async function importPhotos({ page }, ...names) {
	if (!names) throw new Error('No file names provided');
	names = names.map((name) => (path.extname(name) ? name : `${name}.jpeg`));

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
		await window.refreshDB();
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

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {string} id
 */
export async function getImage({ page }, id) {
	const image = await page.evaluate(async ([id]) => {
		const image = await window.DB.get('Image', id);
		if (!image) throw new Error(`Image ${id} not found in the database`);
		return image;
	}, /** @type {const} */ ([id]));
	return image;
}

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {string} id
 * @param {Record<string, MetadataValue>} metadata
 */
export async function setImageMetadata({ page }, id, metadata) {
	await page.evaluate(async ([id, metadata]) => {
		const image = await window.DB.get('Image', id);
		if (!image) throw new Error(`Image ${id} not found in the database`);
		await window.DB.put('Image', { ...image, metadata: { ...image.metadata, ...metadata } });
		await window.refreshDB();
	}, /** @type {const} */ ([id, metadata]));
}
