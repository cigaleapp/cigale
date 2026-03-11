import path from 'node:path';

import { expect } from '@playwright/test';
import { nanoid } from 'nanoid';
import * as yauzl from 'yauzl-promise';

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
			page,
		},
		{
			showTechnicalMetadata: false,
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
 * @param {{ cropPadding?: `${number}${"%"|"px"}`, kind?: 'metadata' | 'cropped' | 'full' }} options
 */
export async function exportResults(page, { cropPadding = '0px', kind = 'cropped' } = {}) {
	const saveAs = `tests/results/${nanoid()}.zip`;

	const area = page.getByTestId('export-results');

	if (cropPadding === '0px') {
		await area.getByRole('radio', { name: 'Aucune' }).check();
	} else if (cropPadding.endsWith('px')) {
		await area.getByRole('textbox', { name: 'en pixels' }).fill(cropPadding.replace(/px$/, ''));
	} else if (['5%', '10%'].includes(cropPadding)) {
		await area.getByRole('radio', { name: cropPadding }).check();
	} else {
		await area
			.getByRole('textbox', { name: "en pourcentage des dimensions de l'image" })
			.fill(cropPadding.replace(/%$/, ''));
	}

	await area
		.getByText(
			{
				metadata: 'Métadonnées seulement',
				cropped: 'Métadonnées et images recadrées',
				full: 'Tout',
			}[kind]
		)
		.click();

	const event = page.waitForEvent('download');
	await area.getByRole('button', { name: 'Archive ZIP' }).click();
	const download = await event;
	expect(download.suggestedFilename()).toBe('results.zip');
	await download.saveAs(saveAs);

	return yauzl.open(saveAs);
}
