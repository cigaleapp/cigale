import { test, expect } from './fixtures';
import { chooseDefaultProtocol, goToTab, importPhotos } from './utils';
import fr from '../messages/fr.json' with { type: 'json' };

test.describe('sorting', () => {
	test.beforeEach(async ({ page }) => {
		await chooseDefaultProtocol(page);
		await goToTab(page, 'import');

		// Import real images from fixtures (these files must exist)
		await importPhotos({ page }, 'leaf.jpeg', 'cyan.jpeg', 'lil-fella.jpeg');

		// Wait for the images to appear
		await expect(page.getByText('leaf.jpeg')).toBeVisible();
		await expect(page.getByText('cyan.jpeg')).toBeVisible();
		await expect(page.getByText('lil-fella.jpeg')).toBeVisible();
	});

	/**
	 * @param {'id'|'filename'|'date'} sortKey
	 * @param {string[]} order
	 */
	async function assertCardsOrder(sortKey, order) {
		test(`by ${sortKey}`, async ({ page }) => {
			await page.getByRole('combobox', { name: fr.sort_by }).selectOption({ value: sortKey });

			await expect
				.poll(async () => page.locator('main article.card footer').allInnerTexts())
				.toStrictEqual(order);

			await page.getByTestId('toggle-sort-direction').click();

			await expect
				.poll(async () => page.locator('main article.card footer').allInnerTexts())
				.toStrictEqual(order.toReversed());
		});
	}

	assertCardsOrder('filename', ['cyan.jpeg', 'leaf.jpeg', 'lil-fella.jpeg']);
	assertCardsOrder('date', ['leaf.jpeg', 'cyan.jpeg', 'lil-fella.jpeg']);
	assertCardsOrder('id', ['leaf.jpeg', 'cyan.jpeg', 'lil-fella.jpeg']);
});
