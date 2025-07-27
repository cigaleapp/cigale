import { issue } from './annotations';
import { expect, test } from './fixtures';

test.describe('closing a modal', () => {
	test('when clicking outside', issue(469), async ({ page }) => {
		await page.getByRole('navigation').getByRole('button', { name: 'Résultats' }).click();
		// Wait for modal animation
		await page.waitForTimeout(1000);
		const dialog = page.getByRole('dialog').filter({ hasText: 'Exporter les résultats' });
		await page.mouse.click(300, 570);
		await page.waitForTimeout(1000);
		await expect.soft(dialog).toBeVisible();
		await page.mouse.click(50, 50);
		await expect.soft(dialog).toBeHidden();
	});
});
