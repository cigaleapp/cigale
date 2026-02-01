import path from 'node:path';

import { ExamplePaths } from '../filepaths.js';

/**
 * @import { Page } from '@playwright/test';
 */

/**
 * Must already be on the /protocols management page
 * @param {Page} page
 * @param {ExamplePaths.Protocols} filepath relative to tests/fixtures/
 */
export async function importProtocol(page, filepath) {
	const fileChooser = page.waitForEvent('filechooser');

	await page
		.getByRole('button', {
			name: 'Importer'
		})
		.click();

	await fileChooser.then((chooser) => chooser.setFiles(path.join(ExamplePaths.root, filepath)));
}
