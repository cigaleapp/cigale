import { expect, test } from './fixtures.js';
import {
	deleteSession,
	goToTab,
	importPhotos,
	newSession,
	switchSession,
	waitForLoadingEnd
} from './utils';

test.describe('isolation', () => {
	test.beforeEach(() => {
		test.setTimeout(20_000);
	});
	test('no images from one session shows up in another', async ({ page }) => {
		await newSession(page, { name: 'Session A' });
		await goToTab(page, 'import');
		await importPhotos({ page }, 'lil-fella.jpeg');
		await waitForLoadingEnd(page);

		await newSession(page, { name: 'Session B' });
		await goToTab(page, 'import');

		await expect(page.getByText('lil-fella.jpeg')).not.toBeVisible();

		await importPhotos({ page }, 'debugsquare.png');

		await expect(page.getByText('debugsquare.png')).toBeVisible();
		await expect(page.getByText('lil-fella.jpeg')).not.toBeVisible();

		await switchSession(page, 'Session A');
		await goToTab(page, 'import');

		await expect(page.getByText('lil-fella.jpeg')).toBeVisible();
		await expect(page.getByText('debugsquare.png')).not.toBeVisible();
	});

	test('deleting a session only deletes its images', async ({ page }) => {
		await newSession(page, { name: 'Session A' });
		await goToTab(page, 'import');
		await importPhotos({ page }, 'lil-fella.jpeg');
		await waitForLoadingEnd(page);
		await expect(page.getByText('lil-fella.jpeg')).toBeVisible();

		await newSession(page, { name: 'Session B' });
		await goToTab(page, 'import');
		await importPhotos({ page }, 'debugsquare.png');
		await waitForLoadingEnd(page);
		await expect(page.getByText('debugsquare.png')).toBeVisible();

		await deleteSession(page, 'Session A');
		await expect(page.getByText('Session A')).not.toBeVisible();

		await switchSession(page, 'Session B');
		await goToTab(page, 'import');
		await expect(page.getByText('debugsquare.png')).toBeVisible();
		await expect(page.getByText('lil-fella.jpeg')).not.toBeVisible();
	});
});
