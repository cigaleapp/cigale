import path from 'node:path';
import * as yauzl from 'yauzl-promise';

import { issue } from './annotations.js';
import { expect, test } from './fixtures.js';
import { mockFilesystemAccessAPI, writtenFilesOfHandle } from './utils/filesystemaccess.js';
import {
	chooseFirstSession,
	entries,
	expectZipFiles,
	firstObservationCard,
	importPhotos,
	loadDatabaseDump,
	newSession,
	setInferenceModels,
	toast
} from './utils/index.js';

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

	await app.tabs.go('results');

	await page.getByRole('radio', { name: '0 px' }).getByRole('textbox').fill('40');

	const resultsFilepath = path.resolve('./tests/results/crop-padding.zip');
	await page.getByRole('button', { name: 'Archive ZIP' }).click();
	await page.waitForEvent('download').then((e) => e.saveAs(resultsFilepath));

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
	const downloadButton = page.getByRole('main').getByRole('button', { name: 'Archive ZIP' });

	/**
	 *
	 * @param {object} opts
	 * @param {string} [opts.include]
	 * @param {{px: number}|{'%': number}} [opts.cropPadding]
	 */
	async function changeExportSettings({ include, cropPadding }) {
		if (include) {
			await page.getByRole('radio', { name: include }).click();
		}

		if (cropPadding) {
			// @ts-ignore
			const [[unit, value]] = entries(cropPadding);

			const input = page.getByRole('radio', { name: unit }).getByRole('textbox');
			await input.fill(value.toString());
			await input.blur();
		}

		await page.waitForTimeout(200);

		await expect(preview).not.toHaveText('Chargement', {
			timeout: 5_000
		});
	}

	await changeExportSettings({ include: 'Métadonnées seulement' });
	await expect.soft(downloadButton).toHaveText('Archive ZIP ~16ko');
	await expect.soft(preview).toMatchAriaSnapshot(`
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

	await changeExportSettings({ include: 'Métadonnées et images recadrées' });
	await expect.soft(downloadButton).toHaveText('Archive ZIP ~4,2Mo');
	await expect.soft(preview).toMatchAriaSnapshot(`
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

	await changeExportSettings({ include: 'Métadonnées, images recadrées et images originales' });
	await expect.soft(downloadButton).toHaveText('Archive ZIP ~9,8Mo');
	await expect.soft(preview).toMatchAriaSnapshot(`
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

	await changeExportSettings({ cropPadding: { px: 200 } });
	await expect.soft(downloadButton).toHaveText('Archive ZIP ~12Mo');
});

test('export to a folder', async ({ page, app, browserName }) => {
	await loadDatabaseDump(page, 'db/basic.devalue');
	await chooseFirstSession(page);
	await setInferenceModels(page, {
		crop: 'Aucune inférence',
		classify: 'Aucune inférence'
	});

	await app.tabs.go('results');

	if (browserName !== 'chromium') {
		await expect(page.getByRole('button', { name: 'Dossier' })).toHaveTooltip(
			/navigateur ne supporte pas.*Chrome ou Edge/
		);

		return;
	}

	const handleId = 'export-folder-test';
	await mockFilesystemAccessAPI(page, 'Cigale Export Test', handleId);

	await page.getByRole('button', { name: 'Dossier' }).click();

	await expect(toast(page, 'Fichiers sauvegardés dans Cigale Export Test')).toBeVisible();

	const files = await writtenFilesOfHandle(page, handleId);

	expect(files).toStrictEqual({
		'Cigale Export Test/metadata.csv': expect.stringContaining('"Identifiant";"Observation"'),
		'Cigale Export Test/analysis.json': expect.stringContaining('"observations":'),
		'Cigale Export Test/Cropped/Allacma fusca_obs1_1.jpeg': expect.any(Uint8Array),
		'Cigale Export Test/Cropped/Orchesella cincta_obs2_2.jpeg': expect.any(Uint8Array),
		'Cigale Export Test/Cropped/Entomobrya muscorum_obs3_3.jpeg': expect.any(Uint8Array),
		'Cigale Export Test/Cropped/(Unknown)_obs4_4.jpeg': expect.any(Uint8Array)
	});
});
