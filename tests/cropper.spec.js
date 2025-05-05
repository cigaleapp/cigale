import * as annotations from './annotations.js';
import { test, expect } from './fixtures.js';
import { importPhotos, setSettings, getSettings, setImageMetadata, getImage } from './utils.js';

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

	test.describe('autoskip enabled OR disabled', async () => {
		for (const enabled of [true, false]) {
			test.beforeEach(async ({ page }) => {
				await setSettings({ page }, { cropAutoNext: enabled });
			});

			test(`navigate with arrow keys (autoskip ${enabled ? 'on' : 'off'})`, async ({ page }) => {
				await page.getByText('cyan.jpeg', { exact: true }).click();
				await page.waitForURL((u) => u.hash === '#/crop/000001');
				await page.keyboard.press('ArrowRight');
				await page.waitForURL((u) => u.hash === '#/crop/000002');
				await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
				await page.keyboard.press('ArrowLeft');
				await page.waitForURL((u) => u.hash === '#/crop/000001');
				await expect(page.getByText('cyan.jpeg', { exact: true })).toBeVisible();
				await page.keyboard.press('ArrowLeft');
				await page.waitForURL((u) => u.hash === '#/crop/000000');
				await expect(page.getByText('lil-fella.jpeg', { exact: true })).toBeVisible();
			});

			test(`go back to import view with escape key (autoskip ${enabled ? 'on' : 'off'})`, async ({
				page
			}) => {
				await page.getByText('cyan.jpeg', { exact: true }).click();
				await page.waitForURL((u) => u.hash === '#/crop/000001');
				await page.keyboard.press('Escape');
				await page.waitForURL((u) => u.hash === '#/crop');
				await expect(page.getByText('lil-fella.jpeg', { exact: true })).toBeVisible();
				await expect(page.getByText('cyan.jpeg', { exact: true })).toBeVisible();
				await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
			});
		}
	});

	test.describe('autoskip disabled', () => {
		test.beforeEach(async ({ page }) => {
			await setSettings({ page }, { cropAutoNext: false });
		});

		test('should not skip on confirm button click', async ({ page }) => {
			await page.getByText('cyan.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await page.waitForTimeout(1000);
			await page.getByRole('button', { name: 'Continuer' }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await expect(page.getByText('leaf.jpeg', { exact: true })).not.toBeVisible();
		});

		test('should not skip on confirmation keybind', async ({ page }) => {
			await page.getByText('cyan.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await page.waitForTimeout(1000);
			await page.keyboard.press('Space');
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await expect(page.getByText('leaf.jpeg', { exact: true })).not.toBeVisible();
		});

		test('should toggle autoskip on on keybind press', async ({ page }) => {
			await page.getByText('cyan.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');

			const { ...othersBefore } = await getSettings({ page });
			await page.keyboard.press('a');
			const { cropAutoNext, ...othersAfter } = await getSettings({ page });

			expect(cropAutoNext).toBe(true);
			expect(othersBefore).toMatchObject(othersAfter);
		});
	});

	test.describe('autoskip enabled', () => {
		test.beforeEach(async ({ page }) => {
			await setSettings({ page }, { cropAutoNext: true, showTechnicalMetadata: true });
		});

		test.fixme('should skip on confirm button click', annotations.pr(207), async ({ page }) => {
			await page.getByText('cyan.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await page.waitForTimeout(1000);
			await page.getByRole('button', { name: 'Continuer' }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000002');
			await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
		});

		test.fixme('should skip on confirmation keybind', annotations.pr(207), async ({ page }) => {
			await page.getByText('cyan.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await page.waitForTimeout(1000);
			await page.keyboard.press('Space');
			await page.waitForURL((u) => u.hash === '#/crop/000002');
			await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
		});

		test('should toggle autoskip off on keybind press', async ({ page }) => {
			await page.getByText('cyan.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');

			const { ...othersBefore } = await getSettings({ page });
			await page.keyboard.press('a');
			const { cropAutoNext, ...othersAfter } = await getSettings({ page });

			expect(cropAutoNext).toBe(false);
			expect(othersBefore).toMatchObject(othersAfter);
		});

		test('should autoskip to classify when all images are confirmed', async ({ page }) => {
			/**
			 * @param {string} id
			 */
			async function markAsConfirmed(id) {
				const { metadata } = await getImage({ page }, id);
				await setImageMetadata({ page }, id, {
					'io.github.cigaleapp.arthropods.transects__crop': {
						...metadata['io.github.cigaleapp.arthropods.transects__crop'],
						manuallyModified: true,
						confidence: 1,
						alternatives: {
							[JSON.stringify(metadata['io.github.cigaleapp.arthropods.transects__crop'].value)]:
								0.8273832
						}
					}
				});
			}

			await markAsConfirmed('000000_000000');
			await markAsConfirmed('000001_000000');
			await markAsConfirmed('000002_000000');

			await page.getByText('leaf.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000002');
			await page.getByRole('button', { name: 'Continuer' }).click();
			await page.waitForTimeout(1000);
			expect(page.url()).toMatch(/#\/classify/);
		});
	});
});
