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

/**
 * Exports the results of the analysis.
 * @param {Page} page
 * @param {string} destination
 * @param {{ cropPadding?: string, kind?: 'metadata' | 'cropped' | 'full' }} options
 */
export async function exportResults(
	page,
	destination,
	{ cropPadding = '0px', kind = 'cropped' } = {}
) {
	await goToTab(page, 'results');

	if (cropPadding.endsWith('px')) {
		await page
			.getByRole('radio', { name: '0 px' })
			.getByRole('textbox')
			.fill(cropPadding.replace(/px$/, ''));
	} else {
		await page.getByRole('radio', { name: cropPadding }).check();
	}

	await page
		.getByText(
			{
				metadata: 'Métadonnées seulement',
				cropped: 'Métadonnées et images recadrées',
				full: 'Métadonnées, images recadrées et images originales'
			}[kind]
		)
		.click();

	await page.getByRole('button', { name: 'Archive ZIP' }).click();
	const download = await page.waitForEvent('download');
	expect(download.suggestedFilename()).toBe('results.zip');
	const saveAs = `./tests/results/${destination}.zip`;
	await download.saveAs(saveAs);

	return saveAs;
}
