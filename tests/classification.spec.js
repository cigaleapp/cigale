import { issue } from './annotations';
import { expect, test } from './fixtures';
import {
	chooseDefaultProtocol,
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
		await expect(page.getByTestId('first-observation-card')).not.toHaveText(/Analyse…|En attente/, {
			timeout: 20_000
		});
		await goToTab(page, 'classify');
		await expect(page.getByTestId('first-observation-card')).not.toHaveText(/Analyse…|En attente/, {
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
	await expect(page.getByTestId('first-observation-card')).not.toHaveText(/Analyse…|En attente/, {
		timeout: 10_000
	});
	await goToTab(page, 'classify');
	await expect(page.getByTestId('first-observation-card')).toHaveText(/Analyse…|En attente/, {
		timeout: 10_000
	});
	await page.waitForTimeout(1_000);
	await page
		.getByTestId('first-observation-card')
		.getByRole('button', { name: 'Supprimer' })
		.click();
	await expect(page.getByTestId('first-observation-card')).not.toBeVisible({
		timeout: 5_000
	});
	expect(async () => getObservation({ page, label: 'lil-fella' })).toThrow();
});
