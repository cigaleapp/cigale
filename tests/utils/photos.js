import path from 'node:path';
import { expect } from '@playwright/test';

import { FixturePaths } from '../filepaths.js';
import { pickFiles } from './core.js';
import { loadingText } from './loading.js';

/**
 * @import { Page } from '@playwright/test';
 */

/**
 *
 * @param {object} ctx
 * @param {Page} ctx.page
 * @param {boolean} [ctx.wait=true] whether to wait for the loading message to disappear
 * @param {number} [ctx.additionalWaitTime] wait additional milliseconds between each import (when names.length > 1)
 * @param {...(FixturePaths.Photos|FixturePaths.Photos[])} names paths relative to ./tests/fixtures. If no extension is provided, .jpeg is used. Pass in arrays to import multiple files at once.
 */
export async function importPhotos({ page, wait = true, additionalWaitTime = 0 }, ...names) {
	if (!names) throw new Error('No file names provided');

	/** @param {string} name */
	const nameToPath = (name) => path.join(FixturePaths.root, name);

	await expect(page.getByText('(.zip)')).toBeVisible();

	// In case import order matters
	let i = -1;

	for (const name of names) {
		i++;
		const batch = Array.isArray(name) ? name : [name];

		// Once we have at least a card, the file input from the dropzone disappears
		if (i === 0) {
			const fileInput = await page.$("input[type='file']");
			await fileInput?.setInputFiles(batch.map(nameToPath));
		} else {
			await pickFiles(
				page.getByRole('button', {
					name: "Importer d'autres images"
				}),
				...batch
			);
		}

		if (wait) await waitUntilLastAppears(name);
	}

	/**
	 *
	 * @param {string | Array<string | string[]>} names
	 */
	async function waitUntilLastAppears(names) {
		// Don't wait for sidecar files to appear since they dont create cards by themselves
		const candidates = (Array.isArray(names) ? names.flat() : [names])
			.filter((name) => !name.endsWith('.json') && !name.endsWith('.xmp'))
			.map((name) => path.basename(name));

		const lastItem = candidates.pop();

		if (!lastItem) {
			throw new Error('Nothing to wait on');
		}

		const element = page
			.getByText(lastItem, {
				exact: true
			})
			.or(
				page
					.getByTestId('observations-area')
					.locator('article')
					.filter({
						has: page.locator(`[data-tooltip-content='${lastItem}']`)
					})
			)
			.last();

		await expect(element).toBeVisible({
			timeout: 20_000
		});

		await expect(element).not.toHaveText(loadingText, {
			timeout: 20_000
		});

		if (additionalWaitTime) {
			await page.waitForTimeout(additionalWaitTime);
		}
	}
}
