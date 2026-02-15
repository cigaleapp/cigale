/**
 * @import { Page } from '@playwright/test';
 * @import { MetadataValue } from '$lib/database.js';
 */

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {string} id
 * @param {Record<string, MetadataValue>} metadata
 * @param {object} options
 * @param {boolean} [options.refreshDB=true] whether to refresh the database after updating
 */
export async function setImageMetadata({ page }, id, metadata, { refreshDB = true } = {}) {
	await page.evaluate(async ([id, metadata, refreshDB]) => {
		const image = await window.DB.get('Image', id);

		if (!image) throw new Error(`Image ${id} not found in the database`);

		await window.DB.put('Image', {
			...image,

			metadata: {
				...image.metadata,

				...Object.fromEntries(
					Object.entries(metadata).map(([key, { value, ...rest }]) => [
						key,
						{
							...rest,
							value: JSON.stringify(value)
						}
					])
				)
			}
		});
		if (refreshDB) {
			console.info('Image updated, refreshing DB', {
				id,
				metadata
			});

			window.refreshDB();
		}
	}, /** @type {const} */ ([id, metadata, refreshDB]));
}

/**
 * @param {Page} page
 * @param {string | RegExp} metadataLabel
 */
export function sidepanelMetadataSectionFor(page, metadataLabel) {
	return page
		.getByTestId('sidepanel')
		.locator('.metadata')
		.filter({
			hasText: metadataLabel
		})
		.first();
}

/**
 *
 * @param {Page} page
 * @param {string | RegExp} metadataLabel
 */
export function sessionMetadataSectionFor(page, metadataLabel) {
	return page
		.getByTestId('session-metadata')
		.locator('.metadata')
		.filter({
			hasText: metadataLabel
		})
		.first();
}
