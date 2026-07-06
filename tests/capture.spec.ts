import type { Page } from '@playwright/test';

import { ms } from 'convert';

import { expect } from './assertions.js';
import { test } from './fixtures.js';
import { newSession } from './utils/sessions.js';

test.describe('Camera', () => {
	test.beforeEach(({ browserName }) => {
		test.skip(browserName !== 'chromium', 'Camera device mocking only works on Chrome');
	});

	test.beforeEach(async ({ page, app }) => {
		await newSession(page, {
			goto: 'import',
			models: {
				classify: 'Aucune inférence',
			},
		});

		await page.getByRole('button', { name: 'Prendre des photos' }).click();
		await app.path.wait('/(app)/capture');
		await app.loading.wait();
	});

	async function shoot(page: Page) {
		await page.getByRole('button', { name: 'Prendre une photo' }).click();
	}

	async function gallery(page: Page) {
		await page
			.getByRole('button', { name: /^Voir (la|les \d+) photos? prises?$/, exact: true })
			.click();
	}

	async function expectPhotoCount(page: Page, count: number) {
		const name = count === 1 ? 'Voir la photo prise' : `Voir les ${count} photos prises`;
		await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
	}

	async function quit(page: Page) {
		await page
			.getByTestId('actions-top')
			.getByRole('button', { name: 'Quitter', exact: true })
			.click();
	}

	test('can snap pics and save them', async ({ page, app }) => {
		await expectPhotoCount(page, 0);

		await shoot(page);
		expectPhotoCount(page, 1);

		await app.wait('3s');
		await shoot(page);
		expectPhotoCount(page, 2);

		await page.getByRole('button', { name: 'Fini' }).click();
		await expect(page.getByTestId('floating-messages')).toHaveText('Import: 1/2 (50%)', {
			timeout: ms('10s'),
		});

		await app.path.wait('/(app)/(sidepanel)/import');

		await expect(app.gallery.card(null)).toHaveCount(2);
		await expect(app.gallery.card('#0').locator('img')).toHaveScreenshot({
			maxDiffPixelRatio: 0.5,
		});

		const [image] = await app.db.image.list();
		expect(image.dimensions.height).toBe(480);
		expect(image.dimensions.width).toBe(640);
	});

	test('can review the snapped picks and delete some them save', async ({ page, app }) => {
		await shoot(page);
		await app.wait('100ms');
		await shoot(page);

		await expectPhotoCount(page, 2);
		await gallery(page);
		await app.path.wait('/(app)/capture/gallery');

		await page.getByRole('article').first().click();
		// FIXME: why do we have two buttons named that??
		await page.getByRole('button', { name: 'Supprimer' }).first().click();

		await page.getByRole('button', { name: 'Retour à la caméra' }).click();
		await app.path.wait('/(app)/capture');
	});

	test('can quit out of the camera and abandon the pics', async ({ page, app }) => {
		// No confirm dialog
		await quit(page);
		await app.path.wait('/(app)/(sidepanel)/import');

		await page.getByRole('button', { name: 'Prendre des photos' }).click();
		await app.path.wait('/(app)/capture');
		await app.loading.wait();

		for (let i = 0; i < 5; i++) {
			await shoot(page);
			await app.wait('100ms');
		}

		const confirmation = app.modals.byTitle('Photos en attente');

		await quit(page);
		await expect(confirmation).toBeVisible();
		await confirmation.getByRole('button', { name: 'Ne pas quitter' }).click();
		await expectPhotoCount(page, 5);
		await expect(confirmation).not.toBeVisible();

		await quit(page);
		await expect(confirmation).toBeVisible();
		await confirmation.getByRole('button', { name: 'Quitter', exact: true }).click();
		await app.path.wait('/(app)/(sidepanel)/import');

		expect(await app.db.count('Image')).toBe(0);
		expect(await app.db.count('Observation')).toBe(0);
		await expect(app.gallery.card(null)).toHaveCount(0);
	});
});
