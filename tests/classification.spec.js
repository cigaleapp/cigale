import { issue } from './annotations';
import { expect, test } from './fixtures';
import {
	firstObservationCard,
	getObservation,
	goToTab,
	importPhotos,
	newSession,
	waitForLoadingEnd
} from './utils';

test('allows cancelling classification of an observation', issue(430), async ({ page }) => {
	await newSession(page);
	await goToTab(page, 'import');
	await importPhotos({ page }, 'lil-fella.jpeg');
	await expect(firstObservationCard(page)).not.toHaveText(/Analyse…|En attente/, {
		timeout: 10_000
	});
	await goToTab(page, 'crop');
	await waitForLoadingEnd(page);
	await goToTab(page, 'classify');
	await expect(firstObservationCard(page)).toHaveText(/Analyse…|En attente/, {
		timeout: 10_000
	});
	await page.waitForTimeout(1_000);
	await firstObservationCard(page).getByRole('button', { name: 'Supprimer' }).click();
	await expect(firstObservationCard(page)).not.toBeVisible({
		timeout: 5_000
	});
	expect(async () => getObservation({ page, label: 'lil-fella' })).rejects.toThrow();
});
