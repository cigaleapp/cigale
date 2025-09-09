import extract from 'extract-zip';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { issue } from './annotations';
import { expect, test } from './fixtures';
import { chooseDefaultProtocol, exportResults, goToTab, importPhotos, setSettings } from './utils';

test('correctly applies crop padding', issue(463), async ({ page }) => {
	// Disable inference to go faster
	await setSettings({ page }, { showTechnicalMetadata: false });
	await chooseDefaultProtocol(page, {
		'la détection': 'Aucune inférence',
		Espèce: 'Aucune inférence'
	});

	await goToTab(page, 'import');
	await importPhotos({ page }, 'debugsquare.png');

	await page.locator('nav').getByRole('link', { name: 'Recadrer' }).click();
	await page.getByTestId('first-observation-card').click();
	await page.getByRole('button', { name: "Sélectionner l'outil 2 points" }).click();
	// TODO fix coordinates for WebKit, current snapshots is off-center
	await page.mouse.click(334, 292);
	await page.mouse.click(543, 501);

	const resultsDir = await exportResults(page, 'crop-padding', {
		cropPadding: '40px'
	});

	expect(await readFile(path.join(resultsDir, 'Cropped/_1.png'))).toMatchSnapshot();
});
