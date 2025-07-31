import { issue } from './annotations';
import { expect, test } from './fixtures';
import { chooseDefaultProtocol, getMetadataValue, goToTab, importPhotos } from './utils';

test.describe('classifies without error', () => {
	test('when observation has no crop box', issue(435), async ({ page }) => {
		await chooseDefaultProtocol(page);
		await goToTab(page, 'import');
		await importPhotos({ page }, 'issue-435.jpeg');
		await expect(page.getByTestId('first-observation-card')).not.toHaveText('Analyse…');
		await goToTab(page, 'classify');
		await expect(page.getByTestId('first-observation-card')).not.toHaveText('Analyse…', {
			timeout: 10_000
		});
		await page.waitForTimeout(5_000);
		expect(await getMetadataValue(page, '000000_000000', 'species')).toBeDefined();
	});
});
