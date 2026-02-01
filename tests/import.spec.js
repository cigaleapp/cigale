import * as dates from 'date-fns';
import * as yauzl from 'yauzl-promise';

import { issue } from './annotations.js';
import { expect, test } from './fixtures.js';
import {
	chooseFirstSession,
	expectZipFiles,
	exportResults,
	firstObservationCard,
	importPhotos,
	importResults,
	loadDatabaseDump,
	loadingText,
	newSession,
	observationCard,
	setInferenceModels
} from './utils/index.js';

test.describe('correct results.zip', () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'exports/correct.zip');
	});

	test('has all the images', async ({ page }) => {
		await expect(page.getByText('lil-fella.jpeg', { exact: true })).toBeVisible();
		await expect(page.getByText('cyan.jpeg', { exact: true })).toBeVisible();
		await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
		await expect(page.getByText('with-exif-gps.jpeg', { exact: true })).toBeVisible();
		await expect(page.getByText(/\.jpeg$/)).toHaveCount(4);
	});

	test('has the correct bounding boxes @webkit-no-parallelization', async ({ page, app }) => {
		await app.tabs.go('crop');

		/**
		 *
		 * @param {string} id
		 * @param {number} count
		 */
		async function expectBoundingBoxesCount(id, count) {
			await expect(
				page.locator(`[data-id='${id}']`).getByTestId('card-observation-bounding-box')
			).toHaveCount(count);
		}

		const images = await app.db.image
			.list()
			.then((images) => images.sort((a, b) => dates.compareAsc(a.addedAt, b.addedAt)));

		await expectBoundingBoxesCount(images[0].fileId ?? '', 1);
		await expectBoundingBoxesCount(images[1].fileId ?? '', 1);
		await expectBoundingBoxesCount(images[2].fileId ?? '', 1);
		await expectBoundingBoxesCount(images[3].fileId ?? '', 1);
	});

	test('does not re-analyze when going to classify tab @webkit-no-parallelization', async ({
		page,
		app
	}) => {
		await app.tabs.go('classify');
		await page.getByText('cyan', { exact: true }).click({
			timeout: 5_000
		});
		await expect(page.getByTestId('sidepanel')).toMatchAriaSnapshot(`
		  - complementary:
		    - img "Image 1 de l'observation cyan"
		    - heading "cyan" [level=2]:
		      - img
		      - textbox "Nom de l'observation"
		    - text: Espèce
		    - combobox: Allacma fusca
		    - code: /\\d+%/
		    - button:
		      - img
		    - text: Alternatives
		    - list:
		      - listitem:
		        - text: Sminthurus viridis
		        - code: /\\d+%/
		        - button:
		          - img
		      - listitem:
		        - text: Bourletiella hortensis
		        - code: /\\d+%/
		        - button:
		          - img
		    - text: Genre
		    - combobox: Allacma
		    - button:
		      - img
		    - text: Famille
		    - combobox: Sminthuridae
		    - button:
		      - img
		    - text: Ordre
		    - combobox: Symphypleona
		    - button:
		      - img
		    - text: Date
		    - textbox "Date"
		    - button [disabled]:
		      - img
		    - paragraph: Moment où la photo a été prise
		    - text: Localisation
		    - textbox "Localisation"
		    - button [disabled]:
		      - img
		    - paragraph: Endroit où la photo a été prise
		    - text: Classe
		    - combobox: Collembola
		    - button:
		      - img
		    - text: Phylum
		    - combobox: Arthropoda
		    - button:
		      - img
		    - text: Règne
		    - combobox: Animalia
		    - button:
		      - img
		    - button "Regrouper Ctrl + G":
		      - img
		    - button "Séparer Ctrl + Shift + G":
		      - img
		    - button "Supprimer 1 images Suppr":
		      - img
		`);
	});

	test('exporting does not fail', async ({ page, app }) => {
		await app.tabs.go('results');
		await page.getByText(/et images originales/i).click();
		await page.getByRole('button', { name: 'results.zip' }).click();
		const download = await page.waitForEvent('download');
		expect(download.suggestedFilename()).toBe('results.zip');

		await download.saveAs('./tests/results/correct.zip');
		await expectZipFiles(await yauzl.open('./tests/results/correct.zip'), [
			'analysis.json',
			'metadata.csv',
			/^Cropped\/Allacma fusca_obs\d_1\.jpeg$/,
			/^Original\/Allacma fusca_obs\d_1\.jpeg$/,
			/^Cropped\/Orchesella cincta_obs\d_2\.jpeg$/,
			/^Original\/Orchesella cincta_obs\d_2\.jpeg$/,
			/^Cropped\/Entomobrya muscorum_obs\d_3\.jpeg$/,
			/^Original\/Entomobrya muscorum_obs\d_3\.jpeg$/,
			/^Cropped\/\(Unknown\)_obs\d_4\.jpeg$/,
			/^Original\/\(Unknown\)_obs\d_4\.jpeg$/
		]);
	});
});

test.describe('missing original photos', () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'exports/no-originals.zip', { waitForLoading: false });
	});

	test('fails with the appropriate error message', async ({ app }) => {
		await expect(app.toasts.byMessage('error', 'Aucune image trouvée')).toBeVisible();
	});
});

test.describe('missing analysis file', () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'exports/no-analysis.zip', { waitForLoading: false });
	});

	test('fails with the appriopriate error message', async ({ app }) => {
		await expect(app.toasts.byMessage('error', "Aucun fichier d'analyse")).toBeVisible();
	});
});

test.describe('wrong protocol used', () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'exports/wrong-protocol.zip', { waitForLoading: false });
	});

	test('fails with the appriopriate error message', async ({ app }) => {
		await expect(app.toasts.byMessage('error', 'le protocole de la session est')).toBeVisible();
	});
});

test.describe('invalid json analysis', async () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'exports/invalid-json-analysis.zip', { waitForLoading: false });
	});

	test('fails with the appriopriate error message', async ({ app }) => {
		await expect(app.toasts.byMessage('error', 'JSON')).toBeVisible();
	});
});

test('can import a .CR2 image', issue(114, 384), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'sample.cr2');
	// Decoding RAW images is slow, which is to be expected
	await app.loading.wait(60_000);

	await app.tabs.go('crop');
	await app.loading.wait();

	await app.tabs.go('classify');
	await app.loading.wait();

	const results = await exportResults(page, 'CR2', {
		kind: 'full'
	});

	await expectZipFiles(
		await yauzl.open(results),
		[
			'analysis.json',
			'metadata.csv',
			'Cropped/Fasciosminthurus quinquefasciatus_obs1_1.jpeg',
			'Original/Fasciosminthurus quinquefasciatus_obs1_1.jpeg'
		],
		{
			'Cropped/Fasciosminthurus quinquefasciatus_obs1_1.jpeg': {
				buffer(buf) {
					expect(buf).toMatchSnapshot({ name: 'CR2 Cropped' });
				}
			},
			'Original/Fasciosminthurus quinquefasciatus_obs1_1.jpeg': {
				buffer(buf) {
					expect(buf).toMatchSnapshot({ name: 'CR2 Original' });
				}
			},
			'metadata.csv': {
				csv(cells) {
					expect(cells).toMatchObject([
						[
							'Identifiant',
							'Observation',
							'Espèce',
							'Espèce: Confiance',
							'Genre',
							'Genre: Confiance',
							'Famille',
							'Famille: Confiance',
							'Ordre',
							'Ordre: Confiance',
							'Classe',
							'Classe: Confiance',
							'Phylum',
							'Phylum: Confiance',
							'Règne',
							'Règne: Confiance'
						],
						[
							expect.any(String),
							'sample',
							'Fasciosminthurus quinquefasciatus',
							expect.stringMatching(/^0\.11/),
							'Fasciosminthurus',
							'1',
							'Bourletiellidae',
							'1',
							'Symphypleona',
							'1',
							'Collembola',
							'1',
							'Arthropoda',
							'1',
							'Animalia',
							'1'
						]
					]);
				}
			}
		}
	);
});

test('can import a large image', issue(412, 415), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'large-image.jpeg');
	await expect(page.getByText('large-image.jpeg')).toBeVisible({
		timeout: 10_000
	});
	await app.tabs.go('classify');
	await expect(page.getByText('large-image')).toBeVisible({
		timeout: 10_000
	});
});

test('cannot import an extremely large image', issue(412, 414), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, '20K-gray.jpeg');
	await app.loading.wait();
	await app.tooltips.expectContent(
		firstObservationCard(page),
		/L'image est trop grande pour être traitée/
	);
});

test.fixme('can cancel import', issue(430), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page, wait: false }, [
		'lil-fella.jpeg',
		'cyan.jpeg',
		'leaf.jpeg',
		'with-exif-gps.jpeg'
	]);
	await expect(firstObservationCard(page)).toHaveText(loadingText, {
		timeout: 10_000
	});
	await page
		.locator('article', { hasText: 'lil-fella.jpeg' })
		.getByRole('button', { name: 'Supprimer' })
		.click();
	await expect(page.getByText('lil-fella.jpeg').first()).not.toBeVisible({
		timeout: 500
	});
});

test('can import in multiple batches', async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos(
		{ page, wait: false },
		['lil-fella.jpeg', 'leaf.jpeg'],
		['with-exif-gps.jpeg', '20K-gray.jpeg', 'debugsquare.png']
	);
	await expect(page.locator('main').getByText(/Analyse…|En attente/)).toHaveCount(0, {
		timeout: 60_000
	});
	await expect(page.locator('main').getByText('lil-fella.jpeg')).toBeVisible();
	await expect(page.locator('main').getByText('leaf.jpeg')).toBeVisible();
	await expect(page.locator('main').getByText('with-exif-gps.jpeg')).toBeVisible();
	await expect(page.locator('main').getByText('debugsquare.png')).toBeVisible();
	await expect(page.locator('main').locator('article.observation')).toHaveCount(5);
});

test(
	'deleting an image in the import tab does not create ghost observation cards',
	issue(439),
	async ({ page, app }) => {
		await loadDatabaseDump(page, 'db/basic.devalue');
		await chooseFirstSession(page);
		await setInferenceModels(page, { classify: 'Aucune inférence' });
		await app.tabs.go('classify');
		await app.tabs.go('import');
		await observationCard(page, 'cyan.jpeg').click();
		await page
			.getByTestId('sidepanel')
			.getByRole('button', { name: 'Supprimer 1 images Suppr' })
			.click();
		await app.tabs.go('classify');
		await expect(observationCard(page, 'cyan')).not.toBeVisible();
	}
);

test('cannot go to classify tab while detection is ongoing', issue(437), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'lil-fella.jpeg', 'cyan.jpeg');

	// Now, we have at least one image loaded (so technically the classify tab should be accessible),
	// but the other image is still being analyzed.

	await app.tabs.go('crop');

	await expect(app.tabs.get('classify')).toBeDisabled({ timeout: 100 });

	// Once everything is done, make sure that we can go to the classify tab
	await app.loading.wait();

	await expect(app.tabs.get('classify')).toBeEnabled({ timeout: 1_000 });
	await app.tabs.go('classify');
});

test('can extract EXIF date from an image', async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'lil-fella.jpeg');
	await app.loading.wait();
	await firstObservationCard(page).click();
	await expect(app.sidepanel.metadataSection('Date').getByRole('textbox')).toHaveValue(
		'2025-04-25'
	);

	const metadataValues = await app.db.metadata.values({ image: 'lil-fella.jpeg' });

	expect(metadataValues).toMatchObject({
		...metadataValues,
		shoot_date: '2025-04-25T12:38:36'
	});
});

test('can extract EXIF GPS data from an image', async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'with-exif-gps.jpeg');
	await app.loading.wait();
	await firstObservationCard(page).click();
	await expect(app.sidepanel.metadataSection('Date').getByRole('textbox')).toHaveValue(
		'2008-10-22'
	);
	await expect(app.sidepanel.metadataSection('Localisation').getByRole('textbox')).toHaveValue(
		'43.46715666666389, 11.885394999997223'
	);

	const metadataValues = await app.db.metadata.values({ image: 'with-exif-gps.jpeg' });

	expect(metadataValues).toMatchObject({
		...metadataValues,
		shoot_date: '2008-10-22T16:29:49',
		shoot_location: {
			latitude: 43.46715666666389,
			longitude: 11.885394999997223
		}
	});
});
