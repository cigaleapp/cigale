import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { issue } from './annotations';
import { expect, test } from './fixtures';
import {
	chooseDefaultProtocol,
	exportResults,
	firstObservationCard,
	goToTab,
	importPhotos,
	setSettings
} from './utils';

test('correctly applies crop padding', issue(463), async ({ page }) => {
	// Disable inference to go faster
	await setSettings({ page }, { showTechnicalMetadata: false });
	await chooseDefaultProtocol(page, {
		'la détection': 'Aucune inférence',
		Espèce: 'Aucune inférence'
	});

	await goToTab(page, 'import');
	await importPhotos({ page }, 'debugsquare.png');

	await goToTab(page, 'crop');
	// Reduce flakiness
	await page.waitForTimeout(1_000);
	await firstObservationCard(page).click();
	await page.getByRole('button', { name: "Choisir l'outil 2 points" }).click();
	// TODO fix coordinates for WebKit, current snapshots is off-center
	await page.mouse.click(334, 292);
	await page.mouse.click(543, 501);

	const resultsDir = await exportResults(page, 'crop-padding', {
		cropPadding: '40px'
	});

	expect(await readFile(path.join(resultsDir, 'Cropped/_1.png'))).toMatchSnapshot();
});
