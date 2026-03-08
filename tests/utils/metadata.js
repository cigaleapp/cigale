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
							value: JSON.stringify(value),
						},
					])
				),
			},
		});
		if (refreshDB) {
			console.info('Image updated, refreshing DB', {
				id,
				metadata,
			});

			window.refreshDB();
		}
	}, /** @type {const} */ ([id, metadata, refreshDB]));
}

/**
 * @param {Page} page
 * @param {string | RegExp} metadataLabel
 */
function sidepanelMetadataSectionFor(page, metadataLabel) {
	return page
		.getByTestId('sidepanel')
		.locator('.metadata')
		.filter({
			has: page.locator('label').filter({ hasText: metadataLabel }),
		});
}

/**
 *
 * @param {Page} page
 * @param {string | RegExp} metadataLabel
 */
function sessionMetadataSectionFor(page, metadataLabel) {
	return page
		.getByTestId('session-metadata')
		.locator('.metadata')
		.filter({
			has: page.locator('label').filter({ hasText: metadataLabel }),
		});
}

/**
 *
 * @param {Page} page
 */
export function metadataSections(page) {
	/** @param {string | RegExp} label */
	const section = (label) =>
		sidepanelMetadataSectionFor(page, label).or(sessionMetadataSectionFor(page, label));

	return {
		section,
		/** @param {string | RegExp} label */
		textbox: (label) => section(label).getByRole('textbox'),
		/** @param {string | RegExp} label */
		combobox: (label) => section(label).getByRole('combobox'),
		/** @param {string | RegExp} label */
		switch: (label) => section(label).getByRole('switch'),
		/**
		 * @param {string | RegExp} label
		 * @param {string} option
		 * @param {object} [params]
		 * @param {boolean} [params.exact=true] whether to use exact matching for the option name
		 */
		radio(label, option, { exact = true } = { exact: true }) {
			return section(label)
				.getByRole('radiogroup')
				.getByRole('radio', { name: option, exact });
		},
	};
}
