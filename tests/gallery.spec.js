import { expect, test } from './fixtures.js';
import { importPhotos, newSession } from './utils/index.js';

test.describe('sorting', () => {
	test.beforeEach(async ({ page, app }) => {
		await newSession(page);
		await app.tabs.go('import');
		await app.settings.set({ showTechnicalMetadata: true });

		// Import real images from fixtures (these files must exist)
		await importPhotos(
			// wait two seconds between each photo to ensure unique values for addedAt
			{ page, additionalWaitTime: 1_100 },
			'leaf.jpeg',
			'cyan.jpeg',
			'lil-fella.jpeg'
		);
	});

	/**
	 * @param {'filename'|'date'} sortKey
	 * @param {string[]} order
	 */
	async function assertCardsOrder(sortKey, order) {
		test(`by ${sortKey}`, async ({ page, app }) => {
			await app.settings.open();
			const optionLabel = {
				filename: 'Fichier',
				date: 'Date'
			}[sortKey];

			await page
				.getByTestId('app-settings')
				.getByRole('radiogroup')
				.filter({ hasText: optionLabel })
				.getByRole('radio', { name: optionLabel })
				.click();

			const getActualOrder = async () =>
				page
					.locator('main article.observation footer')
					.allInnerTexts()
					.then((texts) => texts.map((t) => t.trim()));

			await expect.poll(getActualOrder).toStrictEqual(order);

			await page.getByTestId('app-settings').getByTestId('toggle-sort-direction').click();

			await expect.poll(getActualOrder).toStrictEqual(order.toReversed());
		});
	}

	assertCardsOrder('filename', ['cyan.jpeg', 'leaf.jpeg', 'lil-fella.jpeg']);
	assertCardsOrder('date', ['leaf.jpeg', 'cyan.jpeg', 'lil-fella.jpeg']);
});
