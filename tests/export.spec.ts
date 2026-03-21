import type { Analysis } from '$lib/schemas/exports.js';

import { ms } from 'convert';

import { issue } from './annotations.js';
import { assert, expect, test } from './fixtures.js';
import { mockFilesystemAccessAPI, writtenFilesOfHandle } from './utils/filesystemaccess.js';
import {
	chooseFirstSession,
	entries,
	expectZipFiles,
	exportResults,
	firstObservationCard,
	goToSessionPage,
	importPhotos,
	loadDatabaseDump,
	newSession,
	pickFiles,
	setInferenceModels,
	toast,
	waitForDownload,
} from './utils/index.js';

test('correctly applies crop padding', issue(463), async ({ page, app }) => {
	// Disable inference to go faster
	await app.settings.set({ showTechnicalMetadata: false });
	await newSession(page, {
		models: {
			crop: 'Aucune inférence',
			classify: 'Aucune inférence',
		},
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
	const zip = await exportResults(page, { cropPadding: '40px' });
	await expectZipFiles(zip, ['analysis.json', 'metadata.csv', 'Cropped/(Unknown)_obs1_1.png'], {
		'Cropped/(Unknown)_obs1_1.png': {
			buffer: async (buf) => assert(buf).toMatchSnapshot(),
		},
	});
});

test('correctly shows .zip preview', async ({ page, app }) => {
	await app.settings.set({ showTechnicalMetadata: false });
	await loadDatabaseDump(page, 'db/basic.devalue');
	await chooseFirstSession(page);

	await app.tabs.go('results');

	const preview = page.getByRole('main').getByTestId('zip-preview');
	const downloadButton = page.getByRole('main').getByRole('button', { name: 'Archive ZIP' });
	const settings = page.locator('section').filter({ hasText: 'Marge de recadrage' });

	async function changeExportSettings({
		include,
		cropPadding,
	}: {
		include?: string;
		cropPadding?: { px: number } | { '%': number };
	}) {
		if (include) {
			await settings.getByRole('radio', { name: include }).click();
		}

		if (cropPadding) {
			const [[unit, value]] = entries(cropPadding as { px: number; '%': number });

			const input = settings.getByRole('textbox', {
				name: { px: 'en pixels', '%': "en pourcentage des dimensions de l'image" }[unit],
			});
			await input.fill(value.toString());
			await input.blur();
		}

		await page.waitForTimeout(200);

		await assert(preview).not.toHaveText('Chargement', {
			timeout: 5_000,
		});
	}

	await changeExportSettings({ include: 'Métadonnées seulement' });
	await expect(downloadButton).toHaveText('Archive ZIP ~16ko');
	await expect(preview).toMatchAriaSnapshot(`
	  - list:
	    - listitem:
	      - img
	      - text: results.zip ~227ko une fois dézippé
	    - list:
	      - listitem:
	        - img
	        - text: metadata.csv
	      - listitem:
	        - img
	        - text: analysis.json
	`);

	await changeExportSettings({ include: 'Métadonnées et images recadrées' });
	await expect(downloadButton).toHaveText('Archive ZIP ~4,4Mo');
	await expect(preview).toMatchAriaSnapshot(`
	  - list:
	    - listitem:
	      - img
	      - text: results.zip ~4,6Mo une fois dézippé
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

	await changeExportSettings({ include: 'Tout' });
	await expect(downloadButton).toHaveText('Archive ZIP ~10Mo');
	await expect(preview).toMatchAriaSnapshot(`
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
	await expect(downloadButton).toHaveText('Archive ZIP ~13Mo');
});

test('export to a folder', async ({ page, app, browserName }) => {
	await loadDatabaseDump(page, 'db/basic.devalue');
	await chooseFirstSession(page);
	await setInferenceModels(page, {
		crop: 'Aucune inférence',
		classify: 'Aucune inférence',
	});

	await app.tabs.go('results');

	if (browserName !== 'chromium') {
		await assert(page.getByRole('button', { name: 'Dossier' })).toHaveTooltip(
			/navigateur ne supporte pas.*Chrome ou Edge/
		);

		return;
	}

	const handleId = 'export-folder-test';
	await mockFilesystemAccessAPI(page, 'Cigale Export Test', handleId);

	await page.getByRole('button', { name: 'Dossier' }).click();

	await assert(toast(page, 'Fichiers sauvegardés dans Cigale Export Test')).toBeVisible();

	const files = await writtenFilesOfHandle(page, handleId);

	assert(files).toStrictEqual({
		'Cigale Export Test/metadata.csv': assert.stringContaining('"Identifiant";"Observation"'),
		'Cigale Export Test/analysis.json': assert.stringContaining('"observations":'),
		'Cigale Export Test/Cropped/Allacma fusca_obs1_1.jpeg': assert.any(Uint8Array),
		'Cigale Export Test/Cropped/Orchesella cincta_obs2_2.jpeg': assert.any(Uint8Array),
		'Cigale Export Test/Cropped/Entomobrya muscorum_obs3_3.jpeg': assert.any(Uint8Array),
		'Cigale Export Test/Cropped/(Unknown)_obs4_4.jpeg': assert.any(Uint8Array),
	});
});

test('includes metadata files in export', async ({ page, app }) => {
	await loadDatabaseDump(page, 'db/kitchensink-protocol.devalue');
	await chooseFirstSession(page);
	await goToSessionPage(page);

	const sessionwideFile = app.metadata.section('Sessionwide file');

	await pickFiles(sessionwideFile.getByRole('button', { name: 'Ajouter' }), 'debugsquare.png');
	await assert(sessionwideFile).toHaveText(/debugsquare\.png/);

	await app.tabs.go('results');
	await expect(page.getByTestId('zip-preview')).toMatchAriaSnapshot(`
	  - list:
	    - listitem:
	      - img
	      - text: results.zip ~139ko une fois dézippé
	    - list:
	      - listitem:
	        - img
	        - text: metadata.csv
	      - listitem:
	        - img
	        - text: analysis.json
	      - listitem:
	        - img
	        - text: file-sessionwide_file-debugsquare.png
	      - listitem:
	        - img
	        - text: image-1.cropped.jpeg
	`);

	const zip = await exportResults(page);
	await expectZipFiles(
		zip,
		[
			'analysis.json',
			'metadata.csv',
			'image-1.cropped.jpeg',
			'image-2.cropped.jpeg',
			'file-sessionwide_file-debugsquare.png',
		],
		{
			'file-sessionwide_file-debugsquare.png': {
				buffer: async (buf) => expect(buf).toMatchSnapshot(),
			},
		}
	);
});

test('shows warning dialog when exporting with metadata problems', async ({ page, app }) => {
	await loadDatabaseDump(page, 'db/kitchensink-protocol.devalue');
	await chooseFirstSession(page);
	await app.tabs.go('results');

	await app.metadata.textbox('ohio respect').fill('16');
	await app.metadata.textbox('ohio respect').blur();
	await app.wait('200ms');

	await page.getByRole('button', { name: 'Archive ZIP' }).click();
	const modal = app.modals.byTitle('Métadonnées incorrectes');
	await assert(modal).toBeVisible();
	await expect(modal).toMatchAriaSnapshot(`
	  - dialog:
	    - banner:
	      - heading "Métadonnées incorrectes" [level=1]
	      - button "Fermer":
	        - img
	    - main:
	      - text: Certaines métadonnées sont incorrectes ohio respect
	      - list:
	        - listitem: /must be at most \\d+ \\(was \\d+\\)/
	    - contentinfo:
	      - button "Corriger"
	      - button "Exporter quand même"
	`);

	let download = await waitForDownload(page, async () =>
		modal.getByRole('button', { name: 'Exporter quand même' }).click()
	);

	expect(download.suggestedFilename()).toBe('results.zip');

	const downloadShouldNotOccur = () =>
		expect(true, { message: 'Download should not have occured' }).toBe(false);

	page.on('download', downloadShouldNotOccur);

	await page.getByRole('button', { name: 'Archive ZIP' }).click();
	await modal.getByRole('button', { name: 'Corriger' }).click();

	// Correct the problem
	await app.metadata.textbox('ohio respect').fill('3');
	await app.metadata.textbox('ohio respect').blur();
	await app.wait('200ms');

	page.off('download', downloadShouldNotOccur);

	download = await waitForDownload(page, async () => {
		await page.getByRole('button', { name: 'Archive ZIP' }).click();
		await app.wait('50ms');
		await expect(modal).not.toBeVisible();
	});

	expect(download.suggestedFilename()).toBe('results.zip');
});

for (const width of [undefined, 1400, 1600]) {
	test.describe(`with a ${width ?? 'default'}px-wide window`, () => {
		test.beforeEach(async ({ page }) => {
			if (!width) return;
			await page.setViewportSize({
				width: width,
				height: Math.floor((9 / 16) * width),
			});
		});

		test('can change session metadata in results page', async ({ page, app }) => {
			await loadDatabaseDump(page, 'db/kitchensink-protocol.devalue');
			await chooseFirstSession(page);

			// Make sure that going to the metadata form on results page does not remove metadata set in the session edit page
			await goToSessionPage(page);

			await app.wait(500); // wait for defaults to resolve

			await app.metadata.textbox('Date du transect').fill('2020-02-20');
			await app.metadata
				.section('has no default')
				.getByRole('button', { name: 'Incrémenter' })
				.click();

			await app.wait(500); // wait for debounce on increment button

			await app.tabs.go('results');

			await app.metadata.textbox('Code du transect').fill('QUOICOUBEH');
			await app.metadata.textbox('ohio respect').fill('67');
			await app.metadata
				.section('has no default')
				.getByRole('button', { name: 'Incrémenter' })
				.click();

			await app.wait(500); // wait for debounce on increment button

			const expand = page.getByRole('button', {
				name: "Montrer le panneau d'export",
				exact: true,
			});

			if (await expand.isVisible({ timeout: ms('2s') })) {
				await expand.click();
			}

			const zip = await exportResults(page, { kind: 'metadata' });
			await expectZipFiles(zip, ['analysis.json', 'metadata.csv'], {
				'analysis.json': {
					json({ session }: (typeof Analysis)['infer']) {
						expect(session.protocolMetadata).toMatchObject({
							transect_date: {
								value: '2020-02-20T00:00:00.000Z',
							},
							transect_code: {
								value: 'QUOICOUBEH',
							},
							ohio_respect: {
								value: 67,
							},
							has_no_default: {
								value: 2,
							},
						});
					},
				},
			});
		});
	});
}
