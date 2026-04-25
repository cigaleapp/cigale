import { issue } from './annotations.js';
import { expect, test } from './fixtures.js';
import { clickInDropdown, newSession } from './utils/index.js';

test.describe('closing a modal', () => {
	test('when clicking outside', issue(469), async ({ page, app }) => {
		await newSession(page);
		await clickInDropdown(
			page,
			page.getByRole('button', { name: 'Réglages', exact: true }),
			'Préparation hors-ligne…'
		);

		// Wait for modal animation
		await page.waitForTimeout(1000);
		const dialog = app.modals.byTitle('Préparation hors-ligne');
		const bounds = await dialog.boundingBox();
		if (!bounds) throw new Error('Could not get dialog bounding box');

		await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
		await page.waitForTimeout(1000);
		await expect(dialog).toBeVisible();

		await page.mouse.click(50, 50);
		await expect(dialog).toBeHidden();
	});
});
