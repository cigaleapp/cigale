import * as annotations from './annotations.js';
import { test, expect } from './setup.js';
import { importPhotos, setSettings, getSettings } from './utils.js';

test.describe('Cropper view', () => {
	test.beforeEach(async ({ page }) => {
		await importPhotos({ page }, 'lil-fella', 'cyan', 'leaf');
		await page.getByTestId('goto-crop').click();
		await page.waitForURL((u) => u.hash === '#/crop/');
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

		test.fixme('should skip on confirm button click', annotations.pr(207), async ({ page }) => {
			await page.getByText('cyan.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001_000000');
			await page.waitForTimeout(1000);
			await page.getByRole('button', { name: 'Continuer' }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000002_000000');
			await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
		});

		test('should toggle autoskip off on keybind press', async ({ page }) => {
			await page.getByText('cyan.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001_000000');

			const { ...othersBefore } = await getSettings({ page });
			await page.keyboard.press('a');
			const { cropAutoNext, ...othersAfter } = await getSettings({ page });

			expect(cropAutoNext).toBe(false);
			expect(othersBefore).toMatchObject(othersAfter);
		});
	});
});
