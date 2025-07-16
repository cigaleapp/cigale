import { exampleProtocol, expect, test } from './fixtures.js';
import {
	chooseDefaultProtocol,
	getImage,
	getSettings,
	listTable,
	loadDatabaseDump,
	setImageMetadata,
	setSettings
} from './utils.js';

test.describe('Cropper view', () => {
	test.beforeEach(async ({ page }, testInfo) => {
		testInfo.setTimeout(40_000);
		await loadDatabaseDump(page);
		await chooseDefaultProtocol(page);
		const allImages = await listTable(page, 'Image');
		await markImagesAsConfirmedInDatabase(
			page,
			allImages.map((i) => i.id),
			false
		);
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
				await page.getByText('leaf.jpeg', { exact: true }).click();
				await page.waitForURL((u) => u.hash === '#/crop/000001');
				await page.keyboard.press('ArrowRight');
				await page.waitForURL((u) => u.hash === '#/crop/000002');
				await expect(page.getByText('lil-fella.jpeg', { exact: true })).toBeVisible();
				await page.keyboard.press('ArrowLeft');
				await page.waitForURL((u) => u.hash === '#/crop/000001');
				await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
				await page.keyboard.press('ArrowLeft');
				await page.waitForURL((u) => u.hash === '#/crop/000000');
				await expect(page.getByText('cyan.jpeg', { exact: true })).toBeVisible();
			});

			test(`go back to import view with escape key (autoskip ${enabled ? 'on' : 'off'})`, async ({
				page
			}) => {
				await page.getByText('leaf.jpeg', { exact: true }).click();
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
			await page.getByText('leaf.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await page.waitForTimeout(1000);
			await page.getByRole('button', { name: 'Continuer' }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await expect(page.getByText('leaf.jpeg', { exact: true })).not.toBeVisible();
		});

		test('should not skip on confirmation keybind', async ({ page }) => {
			await page.getByText('leaf.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await page.waitForTimeout(1000);
			await page.keyboard.press('Space');
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await expect(page.getByText('leaf.jpeg', { exact: true })).not.toBeVisible();
		});

		test('should toggle autoskip on on keybind press', async ({ page }) => {
			await page.getByText('leaf.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');

			const { cropAutoNext: _, ...othersBefore } = await getSettings({ page });
			await page.keyboard.press('a');
			await page.waitForTimeout(500);
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
			await page.getByText('leaf.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await page.waitForTimeout(1000);
			await page.getByRole('button', { name: 'Continuer' }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000002');
			await expect(page.getByText('lil-fella.jpeg', { exact: true })).toBeVisible();
		});

		test('should skip on confirmation keybind', async ({ page }) => {
			await page.getByText('leaf.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');
			await page.waitForTimeout(1000);
			await page.keyboard.press('Space');
			await page.waitForURL((u) => u.hash === '#/crop/000002');
			await expect(page.getByText('lil-fella.jpeg', { exact: true })).toBeVisible();
		});

		test('should toggle autoskip off on keybind press', async ({ page }) => {
			await page.getByText('leaf.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');

			const { cropAutoNext: _, ...othersBefore } = await getSettings({ page });
			await page.keyboard.press('a');
			await page.waitForTimeout(500);
			const { cropAutoNext, ...othersAfter } = await getSettings({ page });

			expect(cropAutoNext).toBe(false);
			expect(othersBefore).toMatchObject(othersAfter);
		});

		test('should autoskip to classify when all images are confirmed', async ({ page }) => {
			await markImagesAsConfirmedInDatabase(
				page,
				await listTable(page, 'Image').then((images) =>
					images.filter(({ fileId }) => fileId !== '000003').map(({ id }) => id)
				)
			);

			await page.getByText('with-exif-gps.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000003');
			await page.getByRole('button', { name: 'Continuer' }).click();
			await page.waitForTimeout(1000);
			expect(page.url()).toMatch(/#\/classify/);
		});
	});

	test.describe('deleting an image', () => {
		/**
		 * @param {import('@playwright/test').Page} page
		 * @param {(page: import('@playwright/test').Page) => Promise<void>} deleteAction
		 */
		async function navigateThenAssert(page, deleteAction) {
			const imagesBefore = await listTable(page, 'Image');

			await page.getByText('leaf.jpeg', { exact: true }).click();
			await page.waitForURL((u) => u.hash === '#/crop/000001');

			await deleteAction(page);

			await page.waitForURL((u) => u.hash === '#/crop/000000');

			await expect(page.getByText('cyan.jpeg', { exact: true })).toBeVisible();
			await expect(page.getByText('leaf.jpeg', { exact: true })).not.toBeVisible();

			expect(await listTable(page, 'Image')).toEqual(
				imagesBefore.filter(({ fileId }) => fileId !== '000001')
			);
		}

		test('should delete the image on ctrl-delete and go to the next image', async ({ page }) => {
			await navigateThenAssert(page, async (page) => page.keyboard.press('Control+Delete'));
		});

		test('should delete the image via delete button and go to the next image', async ({ page }) => {
			await navigateThenAssert(page, async (page) => {
				await page.getByRole('button', { name: 'Supprimer' }).click();
			});
		});
	});

	test.describe('creating a new bounding box', () => {
		test.beforeEach(async ({ page }) => {
			await page.getByRole('img', { name: 'lil-fella.jpeg' }).click();
		});

		/**
		 * Expects that all the images of leaf.jpeg are marked as confirmed or unconfirmed in the database.
		 * @param {import('@playwright/test').Page} page
		 * @param {boolean} confirmed
		 */
		async function expectAllImagesConfirmedInDatabase(page, confirmed) {
			const boxesCount = await boxesInBoxesList(page).count();
			for (let i = 0; i < boxesCount; i++) {
				await expect(isImageConfirmedInDatabase(page, `000002_00000${i}`)).resolves.toBe(confirmed);
			}
		}

		/**
		 * Checks that the ImageFile is confirmed:
		 * - has the "Confirmé" overlay shown (if `implicit` is true)
		 * - has the confirmed badge shown
		 * - has all images marked as confirmed in the database
		 * - has the "Invalider" button shown
		 * @param {import('@playwright/test').Page} page
		 * @param {boolean} implicit also check that the overlay is shown
		 */
		async function expectConfirmed(page, implicit = false) {
			if (implicit) await expect(confirmedCropOverlay(page)).toBeVisible();
			await expect(confirmedCropBadge(page)).toBeVisible();
			await expect(page.getByRole('button', { name: 'Invalider' })).toBeVisible();
			await expectAllImagesConfirmedInDatabase(page, true);
		}

		test.describe('with click-and-drag tool', () => {
			test.beforeEach(async ({ page, browserName }) => {
				test.skip(
					browserName === 'webkit',
					'No support for click-and-drag, trace viewer shows that the mouse down is seemingly immediately followed by a mouse up, so no dragging occurs'
				);

				await page.getByRole('button', { name: 'Glisser-recadrer' }).click();
			});

			/**
			 * Make a new cropb box by clicking and dragging from the first point to the second. Assumes the click-and-drag tool is selected.
			 * @param {import('@playwright/test').Page} page
			 * @param {number} x1
			 * @param {number} y1
			 * @param {number} x2
			 * @param {number} y2
			 */
			async function makeBox(page, x1, y1, x2, y2) {
				await page.waitForTimeout(500);
				const changeArea = await page.locator('.change-area').boundingBox();
				if (!changeArea) throw new Error('Change area not found');
				const { x: x0, y: y0 } = changeArea;
				await page.mouse.move(x0 + x1, y0 + y1);
				await page.mouse.down();
				await page.mouse.move(x0 + (x2 - x1), y0 + (y2 - y1));
				await page.mouse.up();
			}

			test('should create boxes on mouseup', async ({ page }) => {
				await makeBox(page, 10, 10, 50, 50);
				await expectBoxInList(page, 2, 245, 245);
				await makeBox(page, 100, 100, 340, 120);
				// Wait for overlay from the first box to disappear
				await page.waitForTimeout(500);
				await expect(confirmedCropOverlay(page)).not.toBeVisible();
				await expectBoxInList(page, 3, 1143, 653);
				await expect(boxesInBoxesList(page)).toHaveCount(3);
			});

			test('should mark the image as confirmed if image was untouched', async ({ page }) => {
				await expectAllImagesConfirmedInDatabase(page, false);
				await makeBox(page, 10, 10, 50, 50);
				await expectBoxInList(page, 2, 245, 245);
				await expectConfirmed(page, true);
			});
		});

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
				await expectBoxInList(page, 2, 327, 327);
				await makeBox(page, 100, 100, 170, 80);
				// Wait for overlay from the first box to disappear
				await page.waitForTimeout(500);
				await expect(confirmedCropOverlay(page)).not.toBeVisible();
				await expectBoxInList(page, 3, 572, 163);
				await expect(boxesInBoxesList(page)).toHaveCount(3);
			});

			test('should mark the image as confirmed if image was untouched', async ({ page }) => {
				await expectAllImagesConfirmedInDatabase(page, false);
				await makeBox(page, 10, 10, 50, 50);
				await expectBoxInList(page, 2, 327, 327);
				await expectConfirmed(page, true);
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
				await expectBoxInList(page, 2, 327, 735);
				await makeBox(page, 100, 100, 170, 80, 170, 150, 100, 150);
				await page.waitForTimeout(1000);
				await expect(confirmedCropOverlay(page)).not.toBeVisible();
				await expectBoxInList(page, 3, 572, 571);
				await expect(boxesInBoxesList(page)).toHaveCount(3);
			});

			test('should mark the image as confirmed if image was untouched', async ({ page }) => {
				await expectAllImagesConfirmedInDatabase(page, false);
				await makeBox(page, 10, 10, 50, 50, 50, 100, 10, 100);
				await expectBoxInList(page, 2, 327, 735);
				await expectConfirmed(page, true);
			});
		});
	});

	test.describe('zooming and panning', () => {
		test.beforeEach(async ({ page, browserName }) => {
			test.skip(browserName === 'webkit', 'Coordinates are wildly different in webkit');
			await page.getByRole('img', { name: 'lil-fella.jpeg' }).click();
			await page.waitForTimeout(1000);
		});

		/**
		 *
		 * @param {Page} page
		 * @param {number} zoom mouse -deltaY
		 * @param {number} [x]
		 * @param {number} [y]
		 * @param {number} [stepsize=100]
		 */
		async function zoomAt(page, zoom, x, y, stepsize = 100) {
			if (x && y) {
				const changeArea = await page.locator('.change-area').boundingBox();
				if (!changeArea) throw new Error('Change area not found');
				const { x: x0, y: y0 } = changeArea;
				await page.mouse.move(x0 + x, y0 + y);
			}

			for (let step = 0; step < Math.abs(zoom); step += stepsize) {
				await page.mouse.wheel(0, -Math.sign(zoom) * stepsize);
			}

			await page.mouse.wheel(0, -Math.sign(zoom) * (Math.abs(zoom) % stepsize));

			await page.waitForTimeout(200);
		}

		/**
		 *
		 * @param {Page} page
		 * @param {number} scale
		 * @param {number} [translateX]
		 * @param {number} [translateY]
		 */
		async function checkImageTransforms(page, scale, translateX, translateY) {
			const image = page.getByTestId('crop-subject-image');
			expect(image).toBeVisible();

			await expect.soft(image).toHaveCSS('scale', /[0-9]+(\.[0-9]+)?/);

			expect.soft(await image.evaluate((i) => Number(i.style.scale))).toBeCloseTo(scale, 3);

			if (translateX !== undefined && translateY !== undefined) {
				await expect.soft(image).toHaveCSS('translate', /.+px .+px/);

				expect
					.soft(await image.evaluate((i) => i.style.translate.split(' ').map(Number.parseFloat)))
					.toEqual([expect.closeTo(translateX, 2), expect.closeTo(translateY, 2)]);
			}
		}

		test.fixme('should zoom in and out with the mouse wheel', async ({ page }) => {
			const image = page.getByTestId('crop-subject-image');
			expect(image).toBeVisible();

			await expect(image).toHaveCSS('scale', '1');

			await zoomAt(page, 120, 100, 100);
			await checkImageTransforms(page, 1.728, 255.668, 140.98);

			await zoomAt(page, -70);
			await checkImageTransforms(page, 1.10592, 97.3785, 53.6963);

			await zoomAt(page, 500, 400, 400);
			await checkImageTransforms(page, 2.75188, 142.537, -173.856);
		});

		test('should zoom in and out with the keyboard', async ({ page }) => {
			const image = page.getByTestId('crop-subject-image');
			expect(image).toBeVisible();

			await expect(image).toHaveCSS('scale', '1');

			await page.keyboard.press('+');
			await checkImageTransforms(page, 1.4);

			await page.keyboard.press('-');
			await checkImageTransforms(page, 1);

			await page.keyboard.press('-');
			await checkImageTransforms(page, 1);

			await page.keyboard.press('+');
			await checkImageTransforms(page, 1.4);

			await page.keyboard.press('+');
			await checkImageTransforms(page, 1.96);

			await page.keyboard.press('+');
			await checkImageTransforms(page, 2.744);

			await page.keyboard.press('Digit0');
			await checkImageTransforms(page, 1);
		});

		test('should pan with the mouse', async ({ page }) => {
			const image = page.getByTestId('crop-subject-image');
			expect(image).toBeVisible();

			await expect(image).toHaveCSS('scale', '1');

			await zoomAt(page, 120, 100, 100);
			await checkImageTransforms(page, 1.728, 255.668, 140.98);

			await page.mouse.down({ button: 'middle' });
			await zoomAt(page, 0, 50, 50);
			await page.mouse.up({ button: 'middle' });
			await page.waitForTimeout(200);

			await checkImageTransforms(page, 1.728, 182.668, 46.98);

			// Make sure no box was created
			await expect(page.getByText(/Boîte #\d+/)).toHaveCount(1);
		});

		test('recalls zoom and pan between image changes', async ({ page }) => {
			await zoomAt(page, 120, 100, 100);
			await checkImageTransforms(page, 1.728, 255.668, 140.98);

			await page.keyboard.press('ArrowRight');
			await page.waitForURL((u) => u.hash === '#/crop/000003');

			await zoomAt(page, 40, 150, 150);
			await checkImageTransforms(page, 1.44, 124.723, 73.3824);

			await page.keyboard.press('ArrowLeft');
			await page.waitForURL((u) => u.hash === '#/crop/000002');

			await checkImageTransforms(page, 1.728, 255.668, 140.98);
		});
	});
});

/**
 * Asserts that a box with the given number and dimensions is visible in the list of boxes.
 * @param {import('@playwright/test').Page} page
 * @param {number} number 1-based
 * @param {number} width
 * @param {number} height
 * @param {number} [tolerance=0.1] relative tolerance for pixel count differences for the width and height, relative to the expected width and height (between 0 and 1). Mainly used to account for discrepancies between browser engines.
 */
async function expectBoxInList(page, number, width, height, tolerance = 0.1) {
	await expect(page.locator('aside').getByText(`Boîte #${number}`)).toBeVisible();

	const box = page
		.locator('aside')
		.locator('.boxes')
		.locator('li')
		.filter({ has: page.getByText(`Boîte #${number}`) });

	await expect(box.getByText(/\d+×\d+/)).toBeVisible();

	// @ts-expect-error checked just above
	const [, actualWidth, actualHeight] = /(\d+)×(\d+)/
		.exec(
			await box
				.locator('.dimensions')
				.textContent()
				.then((s) => s ?? '')
		)
		.map(Number);

	expect(Math.abs((width - actualWidth) / actualWidth)).toBeLessThan(tolerance);
	expect(Math.abs((height - actualHeight) / actualHeight)).toBeLessThan(tolerance);
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
 */
function confirmedCropBadge(page) {
	return page.locator('aside').getByRole('heading').locator('.status');
}

/**
 * Gets the confirmed crop status of the image with the given id in the database.
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 */
async function isImageConfirmedInDatabase(page, id) {
	const image = await getImage({ page }, id);
	return image?.metadata?.[exampleProtocol.crop.confirmationMetadata]?.value === 'true';
}

/**
 *
 * @import { Page } from '@playwright/test';
 * @param {Page} page
 * @param {string[]} ids
 * @param {boolean} [confirmed=true]
 */
async function markImagesAsConfirmedInDatabase(page, ids, confirmed = true) {
	for (const [i, id] of ids.entries()) {
		await setImageMetadata(
			{ page },
			id,
			{
				[exampleProtocol.crop.confirmationMetadata]: {
					value: confirmed,
					manuallyModified: true,
					confidence: 1,
					alternatives: {}
				}
			},
			{
				refreshDB: i === ids.length - 1 // Only refresh the DB after the last image to avoid unnecessary refreshes
			}
		);
	}
}
