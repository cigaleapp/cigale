import { issue } from './annotations';
import { expect, test } from './fixtures';
import {
	chooseDefaultProtocol,
	firstObservationCard,
	getMetadataValue,
	getObservation,
	goToTab,
	importPhotos
} from './utils';

test.describe('classifies without error', () => {
	test('when observation has no crop box', issue(435), async ({ page }) => {
		await chooseDefaultProtocol(page);
		await goToTab(page, 'import');
		await importPhotos({ page }, 'issue-435.jpeg');
		await expect(firstObservationCard(page)).not.toHaveText(/Analyse…|En attente/, {
			timeout: 20_000
		});
		await goToTab(page, 'classify');
		await expect(firstObservationCard(page)).not.toHaveText(/Analyse…|En attente/, {
			timeout: 20_000
		});
		await page.waitForTimeout(5_000);
		expect(
			await getMetadataValue(page, { image: { filename: 'issue-435.jpeg' } }, 'species')
		).toBeDefined();
	});
});

test('allows cancelling classification of an observation', issue(430), async ({ page }) => {
	await chooseDefaultProtocol(page);
	await goToTab(page, 'import');
	await importPhotos({ page }, 'lil-fella.jpeg');
	await expect(firstObservationCard(page)).not.toHaveText(/Analyse…|En attente/, {
		timeout: 10_000
	});
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
