import type { Page } from '@playwright/test';
import type { ExportedProtocol } from '$lib/schemas/protocols.js';

import { ms } from 'convert';
import { differenceInSeconds } from 'date-fns';

import { expect } from './assertions.js';
import { test } from './fixtures.js';
import { chooseInDropdown } from './utils/core.js';
import { importProtocol } from './utils/protocols.js';
import { newSession } from './utils/sessions.js';

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

async function expectFloatingMessage(page: Page, message: string | RegExp) {
	await expect(page.getByTestId('floating-messages')).toHaveText(message, {
		timeout: ms('3s'),
	});
}

async function expectTopText(page: Page, text: string | RegExp) {
	await expect(page.getByTestId('actions-top')).toHaveText(text);
}

async function quit(page: Page) {
	await page
		.getByTestId('actions-top')
		.getByRole('button', { name: 'Quitter', exact: true })
		.click();
}

test.describe('Camera', () => {
	test.use({ permissions: ['geolocation'], geolocation: { latitude: 67, longitude: 69 } });

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

test.describe('Timers', () => {
	test.use({ permissions: ['geolocation'], geolocation: { latitude: 67, longitude: 69 } });

	test.beforeEach(({ browserName }) => {
		test.skip(browserName !== 'chromium', 'Camera device mocking only works on Chrome');
	});

	test.beforeEach(async ({ page, app }) => {
		await app.tabs.go('protocols');
		await importProtocol(page, {
			id: 'test',
			name: 'test',
			authors: [],
			metadata: {
				shot_at: {
					type: 'date',
					label: 'date de prise de vue',
					description: '',
					mergeMethod: 'average',
					required: false,
					infer: {
						exif: 'DateTimeOriginal',
					},
				},
			},
			description: '',
			sessionMetadata: {
				start_photo: {
					type: 'file',
					label: 'photo de départ',
					description: '',
					mergeMethod: 'none',
					required: false,
					accept: ['image/*'],
					infer: {
						capture: 'before-timer',
					},
				},
				end_at: {
					type: 'location',
					label: 'lieu à la fin',
					description: '',
					mergeMethod: 'none',
					required: false,
					infer: {
						capture: 'after-timer',
					},
				},
			},
			capture: {
				timers: [
					{
						name: 'manual',
						shoot: 'manually',
						every: '5s',
						during: '15s',
						messages: {
							lap: 'lap done message here',
							start: 'tstart',
							end: 'tend',
							status: [
								'{{ formatDurationStopwatch (increase total.remainingMs 1000) }}',
								'{{ laps.doneCount }} steps out of {{ decrease laps.totalCount 1 }}',
							],
						},
					},
					{
						name: 'auto',
						shoot: 'on-timer',
						count: 4,
						during: '12s',
						messages: {
							lap: 'lap done message',
							status: [
								'{{ formatDurationStopwatch (increase total.remainingMs 1000) }}',
								'{{ laps.doneCount }} shots out of {{ decrease laps.totalCount 1 }}',
							],
						},
					},
				],
			},
		} as const satisfies (typeof ExportedProtocol)['inferIn']);

		await newSession(page, {
			goto: 'import',
			protocol: 'test',
			name: 'test',
			models: {
				classify: 'Aucune inférence',
			},
		});

		await page.getByRole('button', { name: 'Prendre des photos' }).click();
		await app.path.wait('/(app)/capture');
		await app.loading.wait();
	});

	test('can use an active timer', async ({ page, app }) => {
		await chooseInDropdown(
			page,
			page.getByRole('button', { name: "Plus d'options" }),
			'Options',
			/^Timer$/,
			'manual'
		);

		await expectFloatingMessage(page, 'Timer: manual');

		await shoot(page);

		await expectFloatingMessage(page, 'Prendre en photo: photo de départ');

		// Make sure timer does not start by itself
		await app.wait('2s');

		await expectFloatingMessage(page, 'Prendre en photo: photo de départ');
		await shoot(page);

		// XXX: Wait for metadata to be written
		await app.wait('2s');

		// Ensure file is written
		const metadata = await app.db.metadata.values({
			protocolId: 'test',
			session: 'test',
		});

		expect(metadata).toHaveProperty('start_photo');

		const file = await app.db.get('MetadataValueFile', metadata.start_photo as string);

		expect(file).not.toBeUndefined();
		expect(file).toHaveProperty('contentType', 'image/png');
		expect(file?.size).toBeGreaterThan(1_000); // bytes

		await expectFloatingMessage(page, 'Timer: En attente du démarrage');

		await shoot(page);

		await expectFloatingMessage(page, 'Timer: tstart');
		await expectTopText(page, /0 steps out of 2/);

		// Lap 1
		await app.wait('5s');
		await expectFloatingMessage(page, 'Timer: lap done message here');
		await expectTopText(page, /1 steps out of 2/);

		// Lap 2
		await app.wait('5s');
		await expectFloatingMessage(page, 'Timer: lap done message here');
		await expectTopText(page, /2 steps out of 2/);

		// Try pausing
		await page.getByRole('button', { name: 'Pause' }).click();

		await expectPhotoCount(page, 0);
		await app.wait('5s');

		await page.getByRole('button', { name: 'Reprendre' }).click();

		await app.wait('1s');
		await shoot(page);

		await app.wait('4s');
		await expectFloatingMessage(page, 'Timer: tend');

		await expectPhotoCount(page, 1);

		const { end_at } = await app.db.metadata.values({
			protocolId: 'test',
			session: 'test',
		});

		expect(end_at).toMatchObject({
			latitude: 67,
			longitude: 69,
		});
	});

	test('can use a passive timer', async ({ page, app }) => {
		await chooseInDropdown(
			page,
			page.getByRole('button', { name: "Plus d'options" }),
			'Options',
			/^Timer$/,
			'auto'
		);

		await expectFloatingMessage(page, 'Timer: auto');
		await shoot(page);

		await expectFloatingMessage(page, 'Prendre en photo: photo de départ');
		await shoot(page);

		await expectFloatingMessage(page, 'Timer: En attente du démarrage');
		await shoot(page);

		await app.wait('12s');

		await expectPhotoCount(page, 4);

		await page.getByRole('button', { name: 'Fini' }).click();
		await app.path.wait('/import/');

		const images = await app.db.list('Image');

		expect(images).toHaveLength(4);

		const dates: Date[] = [];

		for (const image of images) {
			const values = await app.db.metadata.values({
				protocolId: 'test',
				imageId: image.id,
			});

			expect(values).toHaveProperty('shot_at');

			dates.push(new Date(values.shot_at as string));
		}

		const shotDateIntervals = dates
			.slice(1)
			.map((date, i) => differenceInSeconds(dates[i], date));

		expect(Math.max(...shotDateIntervals)).toBeLessThan(4);
		expect(Math.min(...shotDateIntervals)).toBeGreaterThanOrEqual(3);
	});
});
