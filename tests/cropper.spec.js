import { expect, test } from './fixtures.js';
import { getImage, getSettings, importPhotos, setImageMetadata, setSettings } from './utils.js';

test.describe('Cropper view', () => {
	test.beforeEach(async ({ page }) => {
		await importPhotos({ page }, 'lil-fella', 'cyan', 'leaf');
		await page.getByTestId('goto-crop').click();
		await page.waitForURL((u) => u.hash === '#/crop/');
		// Wait for images to load
		await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
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

		test('should skip on confirm button click', async ({ page }) => {
			await page.getByText('cyan.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await page.waitForTimeout(1000);
			await page.getByRole('button', { name: 'Continuer' }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000002');
			await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
		});

		test('should skip on confirmation keybind', async ({ page }) => {
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
				await setImageMetadata({ page }, id, {
					'io.github.cigaleapp.arthropods.transects__crop_is_confirmed': {
						value: true,
						manuallyModified: true,
						confidence: 1,
						alternatives: {}
					}
				});
			}

			await markAsConfirmed('000000_000000');
			await markAsConfirmed('000001_000000');

			await page.getByText('leaf.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000002');
			await page.getByRole('button', { name: 'Continuer' }).click();
			await page.waitForTimeout(1000);
			expect(page.url()).toMatch(/#\/classify/);
		});
	});

	test.describe('creating a new bounding box', () => {
		test.beforeEach(async ({ page }) => {
			await page.getByRole('img', { name: 'leaf.jpeg' }).click();
		});

		/**
		 * Expects that all the images of leaf.jpeg are marked as confirmed or unconfirmed in the database.
		 * @param {import('@playwright/test').Page} page
		 * @param {boolean} confirmed
		 */
		async function expectAllImagesConfirmed(page, confirmed) {
			const boxesCount = await boxesInBoxesList(page).count();
			for (let i = 0; i < boxesCount; i++) {
				await expect(isImageConfirmedInDatabase(page, `000002_00000${i}`)).resolves.toBe(confirmed);
			}
		}

		test.describe('with 2-point tool', () => {
			test.beforeEach(async ({ page }) => {
				await page.getByRole('button', { name: '2 points' }).click();
			});

			/**
			 * Make a new cropb box by clicking on two given points. Assumes the 2-point tool is selected.
			 * @param {import('@playwright/test').Page} page
			 * @param {number} x1
			 * @param {number} y1
			 * @param {number} x2
			 * @param {number} y2
			 */
			async function makeBox(page, x1, y1, x2, y2) {
				await page.waitForTimeout(500);
				await page.locator('.change-area').click({
					position: { x: x1, y: y1 }
				});
				await page.locator('.change-area').click({
					position: { x: x2, y: y2 }
				});
			}

			test('should create boxes every 2 clicks', async ({ page }) => {
				await makeBox(page, 10, 10, 50, 50);
				await expectBoxInList(page, 2, 14, 14);
				await makeBox(page, 100, 100, 170, 80);
				// Wait for overlay from the first box to disappear
				await page.waitForTimeout(500);
				await expect(confirmedCropOverlay(page)).not.toBeVisible();
				await expectBoxInList(page, 3, 24, 7);
				await expect(boxesInBoxesList(page)).toHaveCount(3);
			});

			test('should mark the image as confirmed if image was untouched', async ({ page }) => {
				await expectAllImagesConfirmed(page, false);
				await makeBox(page, 10, 10, 50, 50);
				await expectBoxInList(page, 2, 14, 14);
				await expect(confirmedCropOverlay(page)).toBeVisible();
				await expect(confirmedCropBadge(page, 'leaf.jpeg')).toBeVisible();
				await expectAllImagesConfirmed(page, true);
			});
		});

		test.describe('with 4-point tool', () => {
			test.beforeEach(async ({ page }) => {
				await page.getByRole('button', { name: '4 points' }).click();
			});

			/**
			 * Make a new cropb box by clicking on four given points. Assumes the 4-point tool is selected.
			 * @param {import('@playwright/test').Page} page
			 * @param {number} x1
			 * @param {number} y1
			 * @param {number} x2
			 * @param {number} y2
			 * @param {number} x3
			 * @param {number} y3
			 * @param {number} x4
			 * @param {number} y4
			 */
			async function makeBox(page, x1, y1, x2, y2, x3, y3, x4, y4) {
				const changeArea = page.locator('.change-area');
				await page.waitForTimeout(500);
				await changeArea.click({ position: { x: x1, y: y1 } });
				await changeArea.click({ position: { x: x2, y: y2 } });
				await changeArea.click({ position: { x: x3, y: y3 } });
				await changeArea.click({ position: { x: x4, y: y4 } });
			}

			test('should create boxes every 4 clicks', async ({ page }) => {
				await makeBox(page, 10, 10, 50, 50, 50, 100, 10, 100);
				await expectBoxInList(page, 2, 14, 31);
				await makeBox(page, 100, 100, 170, 80, 170, 150, 100, 150);
				await page.waitForTimeout(1000);
				await expect(confirmedCropOverlay(page)).not.toBeVisible();
				await expectBoxInList(page, 3, 24, 24);
				await expect(boxesInBoxesList(page)).toHaveCount(3);
			});

			test('should mark the image as confirmed if image was untouched', async ({ page }) => {
				await expectAllImagesConfirmed(page, false);
				await makeBox(page, 10, 10, 50, 50, 50, 100, 10, 100);
				await expectBoxInList(page, 2, 14, 31);
				await expect(confirmedCropOverlay(page)).toBeVisible();
				await expect(confirmedCropBadge(page, 'leaf.jpeg')).toBeVisible();
				await expectAllImagesConfirmed(page, true);
			});
		});
	});
});

/**
 * Asserts that a box with the given number and dimensions is visible in the list of boxes.
 * @param {import('@playwright/test').Page} page
 * @param {number} number 1-based
 * @param {number} width
 * @param {number} height
 */
async function expectBoxInList(page, number, width, height) {
	await expect(page.locator('aside').getByText(`Boîte #${number}`)).toBeVisible();
	await expect(page.locator('aside').getByText(`${width}×${height}`)).toBeVisible();
}

/**
 * Gets the individual boxes in the list of boxes.
 * @param {import('@playwright/test').Page} page
 */
function boxesInBoxesList(page) {
	return page
		.locator('aside')
		.getByRole('listitem')
		.filter({ hasText: /Boîte #\d+/ });
}

/**
 * Gets the "Confirmé" overlay that appears in the cropper view if the current image has been marked as confirmed through implicit means.
 * @param {import('@playwright/test').Page} page
 */
function confirmedCropOverlay(page) {
	return page.locator('.confirmed-overlay');
}

/**
 * Gets the badge element that appears in the cropper view's header if the current image has been marked as confirmed.
 * @param {import('@playwright/test').Page} page
 * @param {string} filename
 */
function confirmedCropBadge(page, filename) {
	return page.getByRole('heading', { name: filename }).locator('.status');
}

/**
 * Gets the confirmed crop status of the image with the given id in the database.
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 */
async function isImageConfirmedInDatabase(page, id) {
	const image = await getImage({ page }, id);
	return (
		image?.metadata?.['io.github.cigaleapp.arthropods.transects__crop_is_confirmed']?.value ===
		'true'
	);
}
