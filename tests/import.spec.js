import extract from 'extract-zip';
import path from 'node:path';
import { expect, test } from './fixtures';
import { chooseDefaultProtocol, readdirTreeSync, setSettings } from './utils';

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

	test('has the correct bounding boxes', async ({ page }) => {
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

		await expectBoundingBoxesCount('000000', 1);
		await expectBoundingBoxesCount('000001', 2);
		await expectBoundingBoxesCount('000002', 1);
		await expectBoundingBoxesCount('000003', 0);
	});

	test('does not re-analyze when going to classify tab', async ({ page }) => {
		await page.getByRole('link', { name: 'Classifier' }).click();
		await page.getByText('cyan', { exact: true }).click({
			timeout: 3_000
		});
		await expect(page.getByTestId('sidepanel')).toMatchAriaSnapshot(`
		  - complementary:
		    - img "Image 1 de l'observation cyan"
		    - heading "cyan" [level=2]:
		      - img
		      - textbox "Nom de l'observation"
		    - text: Espèce
		    - combobox: Allacma fusca
		    - code: 26%
		    - button:
		      - img
		    - text: Alternatives
		    - list:
		      - listitem:
		        - text: Sminthurus viridis
		        - code: 12%
		        - button:
		          - img
		      - listitem:
		        - text: Caprainea marginata
		        - code: 9%
		        - button:
		          - img
		    - text: Genre
		    - combobox: Allacma
		    - code: 26%
		    - button:
		      - img
		    - text: Alternatives
		    - list:
		      - listitem:
		        - code: 12%
		        - button:
		          - img
		      - listitem:
		        - text: Caprainea
		        - code: 9%
		        - button:
		          - img
		    - text: Famille
		    - combobox: Sminthuridae
		    - code: 17%
		    - button:
		      - img
		    - text: Ordre
		    - combobox: Symphypleona
		    - code: 17%
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
		    - code: 17%
		    - button:
		      - img
		    - text: Phylum
		    - combobox: Arthropoda
		    - code: 17%
		    - button:
		      - img
		    - text: Règne
		    - combobox: Animalia
		    - code: 17%
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
		expect(readdirTreeSync(resultsDir)).toMatchObject([
			{
				Cropped: [
					'_5.jpeg',
					'Allacma fusca_1.jpeg',
					'Allacma fusca_2.jpeg',
					'Deuterosminthurus bicinctus_4.jpeg',
					'Seira ferrarii_3.jpeg'
				]
			},
			{
				Original: [
					'_5.jpeg',
					'Allacma fusca_1.jpeg',
					'Allacma fusca_2.jpeg',
					'Deuterosminthurus bicinctus_4.jpeg',
					'Seira ferrarii_3.jpeg'
				]
			},
			'analysis.json',
			'metadata.csv'
		]);
	});
});
