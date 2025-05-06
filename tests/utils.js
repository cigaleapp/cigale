import { expect } from '@playwright/test';
import { match, type } from 'arktype';
import { readdirSync } from 'node:fs';
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
 * @returns {Promise<typeof import('$lib/database').Schemas.Image.inferIn>}
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
		await window.DB.put('Image', {
			...image,
			metadata: {
				...image.metadata,
				...Object.fromEntries(
					Object.entries(metadata).map(([key, { value, ...rest }]) => [
						key,
						{ ...rest, value: JSON.stringify(value) }
					])
				)
			}
		});
		await window.refreshDB();
	}, /** @type {const} */ ([id, metadata]));
}

/**
 *
 * @param {Page} page
 */
export async function chooseDefaultProtocol(page) {
	// Choose default protocol
	await expect(page.getByTestId('protocol-to-choose')).toBeVisible({ timeout: 20_000 });
	await page.getByTestId('protocol-to-choose').click();
	await page.waitForURL((u) => u.hash === '#/import');
}

/**
 * @template {*} Leaf
 * @typedef {Array<Leaf | { [dir: string]: ArrayTree<Leaf> }>} ArrayTree
 */

/**
 *
 * @param {string} root
 * @returns {ArrayTree<string>}
 */
export function readdirTreeSync(root) {
	const result = [];
	const files = readdirSync(root, { withFileTypes: true });
	for (const file of files) {
		if (file.isDirectory()) {
			result.push({
				[file.name]: readdirTreeSync(path.join(root, file.name))
			});
		} else {
			result.push(file.name);
		}
	}

	const Dir = type({ '[string]': 'unknown' });
	return result.sort((a, b) => {
		console.log({ sorting: [a, b] });
		return (
			match
				// Sort directories before files
				.case(['string', Dir], () => -1)
				.case([Dir, 'string'], () => 1)
				.case(['string', 'string'], ([a, b]) => a.localeCompare(b))
				.case([Dir, Dir], ([a, b]) => {
					const aName = Object.keys(a)[0];
					const bName = Object.keys(b)[0];
					return aName.localeCompare(bName);
				})
				.default(() => 0)([a, b])
		);
	});
}

/**
 *
 * @param {Page} page
 * @param {string|RegExp} message
 * @param {object} options
 * @param {boolean} [options.exact]
 * @param {undefined | import('$lib/toasts.svelte').Toast<null>['type']} [options.type]
 */
export function toast(page, message, { exact = false, type = undefined }) {
	const area = page.getByTestId('toasts-area');

	if (type) {
		return area.locator(`[data-type='${type}']`).getByText(message, { exact });
	}

	return area.getByText(message, { exact });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} filepath to the zip file, relative to tests/fixtures/exports
 * @param {object} options
 */
export async function importResults(page, filepath) {
	await setSettings({ page }, { showTechnicalMetadata: false });
	await chooseDefaultProtocol(page);
	// Import fixture zip
	await expect(page.getByText(/Cliquer ou déposer/)).toBeVisible();
	const fileInput = await page.$("input[type='file']");
	await fileInput?.setInputFiles(path.join('./tests/fixtures/exports/', filepath));
	await expect(page.getByText('Analyse…').first()).toBeVisible();
	await expect(page.getByText('Analyse…')).toHaveCount(0, { timeout: 10_000 });
}
