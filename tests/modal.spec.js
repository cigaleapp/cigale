import { issue } from './annotations.js';
import { expect, test } from './fixtures.js';
import { newSession } from './utils/index.js';

test.describe('closing a modal', () => {
	test('when clicking outside', issue(469), async ({ page, app }) => {
		await newSession(page);
		await app.settings.open();
		await page.getByRole('button', { name: 'Préparation hors-ligne' }).click();

		// Wait for modal animation
		await page.waitForTimeout(1000);
		const dialog = app.modals.byTitle('Préparation hors-ligne');
		const bounds = await dialog.boundingBox();
		if (!bounds) throw new Error('Could not get dialog bounding box');

		await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
		await page.waitForTimeout(1000);
		await expect.soft(dialog).toBeVisible();

		await page.mouse.click(50, 50);
		await expect.soft(dialog).toBeHidden();
	});
});
