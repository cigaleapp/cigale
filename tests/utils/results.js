import path from 'node:path';
import { expect } from '@playwright/test';

import { FixturePaths } from '../filepaths.js';
import { goToTab, newSession, setSettings, waitForLoadingEnd } from './index.js';

/**
 * @import { Page } from '@playwright/test';
 */

/**
 * @param {Page} page
 * @param {FixturePaths.Exports} filepath to the zip file, relative to tests/fixtures/exports
 * @param {object} [options]
 * @param {boolean} [options.waitForLoading] wait for loading to finish
 */
export async function importResults(page, filepath, { waitForLoading = true } = {}) {
	await setSettings(
		{
			page
		},
		{
			showTechnicalMetadata: false
		}
	);

	await newSession(page);
	await goToTab(page, 'import');

	// Import fixture zip
	await expect(page.getByText(/\(.zip\)/)).toBeVisible();

	const fileInput = await page.$("input[type='file']");
	await fileInput?.setInputFiles(path.join(FixturePaths.root, filepath));

	if (waitForLoading) await waitForLoadingEnd(page);
}
