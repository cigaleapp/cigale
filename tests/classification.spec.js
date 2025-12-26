import { issue } from './annotations.js';
import { expect, test } from './fixtures.js';
import { firstObservationCard, importPhotos, newSession } from './utils.js';

test('allows cancelling classification of an observation', issue(430), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'lil-fella.jpeg');
	await expect(firstObservationCard(page)).not.toHaveText(/Analyse…|En attente/, {
		timeout: 10_000
	});
	await app.tabs.go('crop');
	await app.loading.wait();
	await app.tabs.go('classify');
	await expect(firstObservationCard(page)).toHaveText(/Analyse…|En attente/, {
		timeout: 10_000
	});
	await page.waitForTimeout(1_000);
	await firstObservationCard(page).getByRole('button', { name: 'Supprimer' }).click();
	await expect(firstObservationCard(page)).not.toBeVisible({
		timeout: 5_000
	});
	expect(await app.db.observation.byLabel('lil-fella')).toBeUndefined();
});
