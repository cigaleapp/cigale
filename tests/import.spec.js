import path from 'node:path';
import * as dates from 'date-fns';
import extract from 'extract-zip';

import lightweightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { issue } from './annotations';
import { expect, test } from './fixtures';
import {
	chooseProtocol,
	expectTooltipContent,
	firstObservationCard,
	getMetadataValuesOfImage,
	getTab,
	goToTab,
	importPhotos,
	importResults,
	listTable,
	loadingText,
	readdirTreeSync,
	sidepanelMetadataSectionFor,
	toast,
	waitForLoadingEnd
} from './utils';

test.describe('correct results.zip', () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'correct.zip');
	});

	test('has all the images', async ({ page }) => {
		await expect(page.getByText('lil-fella.jpeg', { exact: true })).toBeVisible();
		await expect(page.getByText('cyan.jpeg', { exact: true })).toBeVisible();
		await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
		await expect(page.getByText('with-exif-gps.jpeg', { exact: true })).toBeVisible();
		await expect(page.getByText(/\.jpeg$/)).toHaveCount(4);
	});

	test('has the correct bounding boxes @webkit-no-parallelization', async ({ page }) => {
		await goToTab(page, 'crop');

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

		const images = await listTable(page, 'Image').then((images) =>
			images.sort((a, b) => dates.compareAsc(a.addedAt, b.addedAt))
		);

		await expectBoundingBoxesCount(images[0].fileId ?? '', 1);
		await expectBoundingBoxesCount(images[1].fileId ?? '', 1);
		await expectBoundingBoxesCount(images[2].fileId ?? '', 1);
		await expectBoundingBoxesCount(images[3].fileId ?? '', 1);
	});

	test('does not re-analyze when going to classify tab @webkit-no-parallelization', async ({
		page
	}) => {
		await goToTab(page, 'classify');
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

	test('exporting does not fail', async ({ page }) => {
		await page.getByRole('button', { name: 'Résultats' }).click();
		await page.getByText(/et images originales/i).click();
		await page.getByText('results.zip').click();
		const download = await page.waitForEvent('download');
		expect(download.suggestedFilename()).toBe('results.zip');

		// FIXME: 'invalid zip data'
		// const contents = await download
		// 	.createReadStream()
		// 	.then((stream) => stream.toArray())
		// 	.then(({ data }) => new Uint8Array(data))
		// 	.then((data) => unzipSync(data));
		// expect(Object.keys(contents)).toMatchObject(['results.json', 'metadata.csv']);

		const resultsDir = path.resolve('./tests/results/correct');
		await download.saveAs('./tests/results/correct.zip');
		await extract('./tests/results/correct.zip', { dir: resultsDir });
		console.info(JSON.stringify(readdirTreeSync(resultsDir), null, 2));
		expect(readdirTreeSync(resultsDir)).toMatchObject([
			{
				Cropped: [
					'(Unknown)_4.jpeg',
					'Allacma fusca_1.jpeg',
					'Entomobrya muscorum_3.jpeg',
					'Orchesella cincta_2.jpeg'
				]
			},
			{
				Original: [
					'(Unknown)_4.jpeg',
					'Allacma fusca_1.jpeg',
					'Entomobrya muscorum_3.jpeg',
					'Orchesella cincta_2.jpeg'
				]
			},
			'analysis.json',
			'metadata.csv'
		]);
	});
});

test.describe('missing original photos', () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'no-originals.zip', { waitForLoading: false });
	});

	test('fails with the appriopriate error message', async ({ page }) => {
		await expect(toast(page, 'Aucune image trouvée', { type: 'error' })).toBeVisible();
	});
});

test.describe('missing analysis file', () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'no-analysis.zip', { waitForLoading: false });
	});

	test('fails with the appriopriate error message', async ({ page }) => {
		await expect(toast(page, "Aucun fichier d'analyse", { type: 'error' })).toBeVisible();
	});
});

test.describe('wrong protocol used', () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'wrong-protocol.zip', { waitForLoading: false });
	});

	test('fails with the appriopriate error message', async ({ page }) => {
		await expect(toast(page, 'le protocole actuel est', { type: 'error' })).toBeVisible();
	});
});

test.describe('invalid json analysis', async () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'invalid-json-analysis.zip', { waitForLoading: false });
	});

	test('fails with the appriopriate error message', async ({ page }) => {
		await expect(toast(page, 'JSON', { type: 'error' })).toBeVisible();
	});
});

test('fails when importing a .CR2 image', issue(413), async ({ page }) => {
	await chooseProtocol(page);
	await goToTab(page, 'import');
	await importPhotos({ page }, 'sample.cr2');
	await expect(page.getByText(/Analyse…|En attente/)).toHaveCount(0, {
		timeout: 5_000
	});
	await expectTooltipContent(
		page,
		firstObservationCard(page),
		/Les fichiers .+? ne sont pas (encore )?supportés/
	);
});

test('can import a large image', issue(412, 415), async ({ page }) => {
	await chooseProtocol(page);
	await goToTab(page, 'import');
	await importPhotos({ page }, 'large-image.jpeg');
	await expect(page.getByText('large-image.jpeg')).toBeVisible({
		timeout: 10_000
	});
	await goToTab(page, 'classify');
	await expect(page.getByText('large-image')).toBeVisible({
		timeout: 10_000
	});
});

test('cannot import an extremely large image', issue(412, 414), async ({ page }) => {
	await chooseProtocol(page);
	await goToTab(page, 'import');
	await importPhotos({ page }, '20K-gray.jpeg');
	await waitForLoadingEnd(page);
	await expectTooltipContent(
		page,
		firstObservationCard(page),
		/L'image est trop grande pour être traitée/
	);
});

test.fixme('can cancel import', issue(430), async ({ page }) => {
	await chooseProtocol(page);
	await goToTab(page, 'import');
	await importPhotos({ page, wait: false }, ['lil-fella', 'cyan', 'leaf', 'with-exif-gps']);
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

test('can import in multiple batches', async ({ page }) => {
	await chooseProtocol(page);
	await goToTab(page, 'import');
	await importPhotos(
		{ page, wait: false },
		['lil-fella', 'leaf'],
		['with-exif-gps', '20K-gray', 'debugsquare.png']
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
	async ({ page }) => {
		await chooseProtocol(page);
		await goToTab(page, 'import');
		await importPhotos({ page }, 'lil-fella', 'cyan');
		await goToTab(page, 'classify');
		await waitForLoadingEnd(page);
		await goToTab(page, 'import');
		await firstObservationCard(page).click();
		await page
			.getByTestId('sidepanel')
			.getByRole('button', { name: 'Supprimer 1 images Suppr' })
			.click();
		await goToTab(page, 'classify');
		await expect(firstObservationCard(page)).toMatchAriaSnapshot(`
		  - article:
		    - img "cyan"
		    - img
		    - heading "cyan" [level=2]
		`);
		await expect(page.getByRole('main').locator('article.observation')).toHaveCount(1);
	}
);

test('cannot go to classify tab while detection is ongoing', issue(437), async ({ page }) => {
	await chooseProtocol(page);
	await goToTab(page, 'import');
	await importPhotos({ page }, 'lil-fella', 'cyan');

	// Now, we have at least one image loaded (so technically the classify tab should be accessible),
	// but the other image is still being analyzed.

	await goToTab(page, 'crop');

	await expect(getTab(page, 'classify')).toBeDisabled({ timeout: 100 });

	// Once everything is done, make sure that we can go to the classify tab
	await waitForLoadingEnd(page);

	await expect(getTab(page, 'classify')).toBeEnabled({ timeout: 1_000 });
	await goToTab(page, 'classify');
});

test('can extract EXIF date from an image', async ({ page }) => {
	await chooseProtocol(page);
	await goToTab(page, 'import');
	await importPhotos({ page }, 'lil-fella');
	await waitForLoadingEnd(page);
	await firstObservationCard(page).click();
	await expect(sidepanelMetadataSectionFor(page, 'Date').getByRole('textbox')).toHaveValue(
		'2025-04-25'
	);

	const metadataValues = await getMetadataValuesOfImage({
		page,
		protocolId: lightweightProtocol.id,
		image: { filename: 'lil-fella.jpeg' }
	});

	expect(metadataValues).toMatchObject({
		...metadataValues,
		shoot_date: '2025-04-25T12:38:36'
	});
});

test('can extract EXIF GPS data from an image', async ({ page }) => {
	await chooseProtocol(page);
	await goToTab(page, 'import');
	await importPhotos({ page }, 'with-exif-gps');
	await waitForLoadingEnd(page);
	await firstObservationCard(page).click();
	await expect(sidepanelMetadataSectionFor(page, 'Date').getByRole('textbox')).toHaveValue(
		'2008-10-22'
	);
	await expect(
		sidepanelMetadataSectionFor(page, 'Localisation').getByRole('textbox')
	).toHaveValue('43.46715666666389, 11.885394999997223');

	const metadataValues = await getMetadataValuesOfImage({
		page,
		protocolId: lightweightProtocol.id,
		image: { filename: 'with-exif-gps.jpeg' }
	});

	expect(metadataValues).toMatchObject({
		...metadataValues,
		shoot_date: '2008-10-22T16:29:49',
		shoot_location: {
			latitude: 43.46715666666389,
			longitude: 11.885394999997223
		}
	});
});
