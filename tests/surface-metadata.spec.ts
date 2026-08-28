import type { AppFixture } from './fixtures/app.js';
import type { Locator } from '@playwright/test';

import { expect } from './assertions.js';
import { testKitchensink as test } from './fixtures.js';
import { chooseFirstSession } from './utils/index.js';

// Full (namespaced) metadata key for the "surface" field defined in
// examples/kitchensink.cigaleprotocol.yaml. Also used as the pw-testid prefix
// for its map's markers (WorldMap is given testid={definition.id}).
const SURFACE_KEY = 'io.github.cigaleapp.kitchensink__surface';

function escapeRegExp(str: string) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function surfaceSection(app: AppFixture) {
	return app.metadata.section('surface');
}

function markers(section: Locator) {
	return section.getByTestId(new RegExp(`^${escapeRegExp(SURFACE_KEY)}-point-\\d+$`));
}

function marker(section: Locator, index: number) {
	return section.getByTestId(`${SURFACE_KEY}-point-${index}`);
}

function areaLabel(section: Locator) {
	return section.getByTestId(`${SURFACE_KEY}-label-area`);
}

/**
 * Reads back the raw (parsed) value of the surface metadata for cyan.jpeg
 */
async function surfaceValue(app: AppFixture) {
	const image = await app.db.image.byFilename('cyan.jpeg');
	if (!image) throw new Error('cyan.jpeg not found in DB');

	const values = await app.db.metadata.values({ imageId: image.id, protocolId: null });
	return values[SURFACE_KEY];
}

test.describe('surface metadata', () => {
	test.beforeEach(async ({ page, app }) => {
		await app.settings.set({ debugMode: false });
		await chooseFirstSession(page);
		await page.getByText('cyan.jpeg').click();

		await expect(surfaceSection(app)).toBeVisible();
	});

	test('shows one marker per point, and only draws the area once there are 3+ points', async ({
		app,
	}) => {
		const image = await app.db.image.byFilename('cyan.jpeg');
		if (!image) throw new Error('cyan.jpeg not found in DB');

		const section = surfaceSection(app);

		// No value set yet: no markers
		await expect(markers(section)).toHaveCount(0);

		const triangle = [
			{ latitude: 43.6, longitude: 1.44 },
			{ latitude: 43.6, longitude: 1.45 },
			{ latitude: 43.61, longitude: 1.45 },
		];

		// Two points: markers appear, but the area isn't drawn yet (needs >= 3 points)
		await app.db.metadata.set(image.id, SURFACE_KEY, triangle.slice(0, 2));
		await app.db.refresh();

		await expect(markers(section)).toHaveCount(2);
		await expect(areaLabel(section)).not.toBeVisible();

		// Third point: the polygon is now drawn, with an area label (in m² or ha)
		await app.db.metadata.set(image.id, SURFACE_KEY, triangle);
		await app.db.refresh();

		await expect(markers(section)).toHaveCount(3);
		await expect(areaLabel(section)).toHaveText('44.77 ha');
	});

	test.describe('"use current location" button', () => {
		test.use({
			permissions: ['geolocation'],
			geolocation: { latitude: 43.6045, longitude: 1.4442 },
		});

		test('does not add a duplicate point when the location has not changed', async ({
			page,
			app,
		}) => {
			const section = surfaceSection(app);
			const useCurrentLocation = section.getByRole('button', {
				name: 'Utiliser la position actuelle',
			});

			expect(await surfaceValue(app)).toBeUndefined();

			await useCurrentLocation.click();
			await app.wait('500ms');

			expect(await surfaceValue(app)).toMatchObject([
				{ latitude: 43.6045, longitude: 1.4442 },
			]);
			await expect(markers(section)).toHaveCount(1);

			// Clicking again at the exact same (mocked) position must not add a
			// duplicate coordinate: two identical points don't help draw a surface
			await useCurrentLocation.click();
			await app.wait('500ms');

			expect(await surfaceValue(app)).toHaveLength(1);
			await expect(markers(section)).toHaveCount(1);

			// A genuinely different position should still be appended as a new point
			await page.context().setGeolocation({ latitude: 43.61, longitude: 1.45 });
			await useCurrentLocation.click();
			await app.wait('500ms');

			expect(await surfaceValue(app)).toMatchObject([
				{ latitude: 43.61, longitude: 1.45 },
				{ latitude: 43.6045, longitude: 1.4442 },
			]);
			await expect(markers(section)).toHaveCount(2);
		});
	});

	test('deleting a marker removes just that point, unless it is the last one left', async ({
		app,
	}) => {
		const image = await app.db.image.byFilename('cyan.jpeg');
		if (!image) throw new Error('cyan.jpeg not found in DB');

		const section = surfaceSection(app);

		await app.db.metadata.set(image.id, SURFACE_KEY, [
			{ latitude: 43.6, longitude: 1.44 },
			{ latitude: 43.61, longitude: 1.45 },
		]);
		await app.db.refresh();
		await expect(markers(section)).toHaveCount(2);

		// With more than one point, deleting a marker only removes that point
		// (indices are re-derived from the points array, so index 0 always
		// targets whatever the first remaining point is)
		await marker(section, 0).click();
		await app.wait('500ms');

		await expect(markers(section)).toHaveCount(1);
		expect(await surfaceValue(app)).toHaveLength(1);

		// Deleting the last remaining point clears the whole value entirely,
		// rather than leaving an empty array around
		await marker(section, 0).click();
		await app.wait('500ms');

		await expect(markers(section)).toHaveCount(0);
		expect(await surfaceValue(app)).toBeUndefined();
	});
});
