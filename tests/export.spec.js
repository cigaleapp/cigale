import path from 'node:path';
import * as yauzl from 'yauzl-promise';

import { issue } from './annotations.js';
import { expect, test } from './fixtures.js';
import {
	chooseFirstSession,
	expectZipFiles,
	firstObservationCard,
	importPhotos,
	loadDatabaseDump,
	newSession
} from './utils.js';

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

	const resultsFilepath = await exportResults(page, 'crop-padding', {
		cropPadding: '40px'
	});

	const zip = await yauzl.open(resultsFilepath);
	await expectZipFiles(zip, ['analysis.json', 'metadata.csv', 'Cropped/(Unknown)_obs1_1.png'], {
		'Cropped/(Unknown)_obs1_1.png': {
			buffer: async (buf) => expect(buf).toMatchSnapshot()
		}
	});
});

test('correctly shows .zip preview', async ({ page, app }) => {
	await app.settings.set({ showTechnicalMetadata: false });
	await loadDatabaseDump(page, 'db/basic.devalue');
	await chooseFirstSession(page);

	await app.tabs.go('results');

	const preview = page.getByRole('main').getByTestId('zip-preview');
	const downloadButton = page.getByRole('main').getByRole('button', { name: 'results.zip' });

	/**
	 *
	 * @param {string} include
	 */
	async function changeExportInclude(include) {
		await page.getByRole('radio', { name: include }).click();

		await page.waitForTimeout(200);

		await expect(preview).not.toHaveText('Chargement', {
			timeout: 5_000
		});
	}

	await changeExportInclude('Métadonnées seulement');
	await expect(downloadButton).toHaveText('results.zip ~16ko');
	await expect(preview).toMatchAriaSnapshot(`
	  - heading "Contenu de l'export .zip" [level=2]
	  - list:
	    - listitem:
	      - img
	      - text: results.zip ~221ko une fois dézippé
	    - list:
	      - listitem:
	        - img
	        - text: metadata.csv
	      - listitem:
	        - img
	        - text: analysis.json
	`);

	await changeExportInclude('Métadonnées et images recadrées');
	await expect(downloadButton).toHaveText('results.zip ~4,2Mo');
	await expect(preview).toMatchAriaSnapshot(`
	  - heading "Contenu de l'export .zip" [level=2]
	  - list:
	    - listitem:
	      - img
	      - text: results.zip ~4,4Mo une fois dézippé
	    - list:
	      - listitem:
	        - img
	        - text: metadata.csv
	      - listitem:
	        - img
	        - text: analysis.json
	      - listitem:
	        - img
	        - text: Cropped
	      - list:
	        - listitem:
	          - img
	          - text: Allacma fusca_obs1_1.jpeg
	        - listitem:
	          - img
	          - text: Orchesella cincta_obs2_2.jpeg
	        - listitem:
	          - img
	          - text: Entomobrya muscorum_obs3_3.jpeg
	        - listitem:
	          - img
	          - text: (Unknown)_obs4_4.jpeg
	`);

	await changeExportInclude('Métadonnées, images recadrées et images originales');
	await expect(downloadButton).toHaveText('results.zip ~9,8Mo');
	await expect(preview).toMatchAriaSnapshot(`
	  - heading "Contenu de l'export .zip" [level=2]
	  - list:
	    - listitem:
	      - img
	      - text: results.zip ~10Mo une fois dézippé
	    - list:
	      - listitem:
	        - img
	        - text: metadata.csv
	      - listitem:
	        - img
	        - text: analysis.json
	      - listitem:
	        - img
	        - text: Cropped
	      - list:
	        - listitem:
	          - img
	          - text: Allacma fusca_obs1_1.jpeg
	        - listitem:
	          - img
	          - text: Orchesella cincta_obs2_2.jpeg
	        - listitem:
	          - img
	          - text: Entomobrya muscorum_obs3_3.jpeg
	        - listitem:
	          - img
	          - text: (Unknown)_obs4_4.jpeg
	      - listitem:
	        - img
	        - text: Original
	      - list:
	        - listitem:
	          - img
	          - text: Allacma fusca_obs1_1.jpeg
	        - listitem:
	          - img
	          - text: Orchesella cincta_obs2_2.jpeg
	        - listitem:
	          - img
	          - text: Entomobrya muscorum_obs3_3.jpeg
	        - listitem:
	          - img
	          - text: (Unknown)_obs4_4.jpeg
	`);
});
