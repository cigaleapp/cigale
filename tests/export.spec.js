import path from 'node:path';
import * as yauzl from 'yauzl-promise';

import { issue } from './annotations';
import { expect, test } from './fixtures';
import { expectZipFiles, firstObservationCard, importPhotos, newSession } from './utils';

test('correctly applies crop padding', issue(463), async ({ page, app }) => {
	// Disable inference to go faster
	await app.settings.set({ showTechnicalMetadata: false });
	await newSession(page, {
		models: {
			crop: 'Aucune inférence',
			classify: 'Aucune inférence'
		}
	});

	await app.tabs.go('import');
	await importPhotos({ page }, 'debugsquare.png');

	await app.tabs.go('crop');
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

	const zip = await yauzl.open(resultsFilepath);
	await expectZipFiles(zip, ['analysis.json', 'metadata.csv', 'Cropped/(Unknown)_obs1_1.png'], {
		'Cropped/(Unknown)_obs1_1.png': {
			buffer: async (buf) => expect(buf).toMatchSnapshot()
		}
	});
});
