import { test, expect } from './setup.js';
import { importPhotos, setSettings } from './utils.js';

test.describe('Cropper view', () => {
	test.beforeEach(async ({ page }) => {
		await importPhotos({ page }, 'lil-fella', 'cyan', 'leaf');
		await page.goto('/#/crop');
	});

	test('should have all cards visible', async ({ page }) => {
		await expect(page.getByText('lil-fella.jpeg', { exact: true })).toBeVisible();
		await expect(page.getByText('cyan.jpeg', { exact: true })).toBeVisible();
		await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
	});

	test.describe('autoskip enabled', () => {
		test.beforeEach(async ({ page }) => {
			await setSettings({ page }, { cropAutoNext: true, showTechnicalMetadata: true });
		});

		test('should skip on confirm button click', async ({ page }) => {
			await page.getByText('cyan.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001_000000');
			await page.waitForTimeout(1000);
			await page.getByRole('button', { name: 'Continuer' }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000002_000000');
			await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
		});
	});
});
