import path from 'node:path';
import * as yauzl from 'yauzl-promise';

import { issue } from './annotations';
import { expect, test } from './fixtures';
import {
	chooseProtocol,
	firstObservationCard,
	goToTab,
	importPhotos,
	readStreamToBuffer,
	setSettings
} from './utils';

test('correctly applies crop padding', issue(463), async ({ page }) => {
	// Disable inference to go faster
	await setSettings({ page }, { showTechnicalMetadata: false });
	await chooseProtocol(page, undefined, {
		crop: 'Aucune inférence',
		classify: 'Aucune inférence'
	});

	await goToTab(page, 'import');
	await importPhotos({ page }, 'debugsquare.png');

	await goToTab(page, 'crop');
	// Reduce flakiness
	await page.waitForTimeout(1_000);
	await firstObservationCard(page).click();
	await page.getByRole('button', { name: "Choisir l'outil 2 points" }).click();
	// TODO fix coordinates for WebKit, current snapshots is off-center
	await page.mouse.click(278, 255);
	await page.mouse.click(487, 464);

	await page.getByRole('button', { name: 'Autres photos Esc' }).click();

	await page.locator('nav').getByRole('button', { name: 'Résultats' }).click();

	await page.getByRole('radio', { name: '0 px' }).getByRole('textbox').fill('40');

	const resultsFilepath = path.resolve('./tests/results/crop-padding.zip');
	await page.getByRole('button', { name: 'results.zip' }).click();
	await page.waitForEvent('download').then((e) => e.saveAs(resultsFilepath));
	const zip = await yauzl.open(path.join(resultsFilepath));

	let hasObservation = false;
	for await (const entry of zip) {
		if (entry.filename === 'Cropped/(Unknown)_obs1_1.png') {
			expect(await readStreamToBuffer(await entry.openReadStream())).toMatchSnapshot();
			hasObservation = true;
		}
	}

	expect(hasObservation).toBe(true);
});
