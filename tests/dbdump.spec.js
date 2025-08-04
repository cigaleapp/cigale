import { expect, test } from './fixtures.js';
import fr from '../messages/fr.json' with { type: 'json' };
import {
	chooseDefaultProtocol,
	dumpDatabase,
	goToTab,
	importPhotos,
	importProtocol,
	importResults
} from './utils.js';
import JSZip from 'jszip';
import { readFile, writeFile } from 'node:fs/promises';

test.skip(
	Boolean(process.env.CI),
	'Skipping database dumps and exports on CI, these are meant as easy way to (re)create dump fixtures locally only.'
);

test.describe('Database dumps', () => {
	test('basic', async ({ page }) => {
		await importResults(page, 'correct.zip');
		await dumpDatabase(page, 'basic.devalue');
	});

	test('kitchensink-protocol', async ({ page }) => {
		await importProtocol(page, '../../examples/kitchensink.cigaleprotocol.yaml');
		await page.goto('#/protocols');
		await page
			.locator('article')
			.filter({ hasText: 'io.github.cigaleapp.arthropods.example.light' })
			.getByRole('button', { name: 'Supprimer' })
			.click();
		await page.getByRole('button', { name: 'Oui, supprimer' }).click();
		await expect(page.getByText('Protocole supprimé')).toBeVisible();
		await page.locator('nav').getByRole('link', { name: 'Protocole' }).click();
		await chooseDefaultProtocol(page);
		await goToTab(page, 'import');
		await importPhotos({ page }, 'cyan.jpeg', 'leaf.jpeg');
		await page.waitForTimeout(2_000);
		await dumpDatabase(page, 'kitchensink-protocol.devalue');
	});
});

test.describe('Exports', () => {
	/**
	 * @param {object} param0
	 * @param {import('@playwright/test').Page} param0.page
	 */
	async function prepare({ page }) {
		await chooseDefaultProtocol(page);
		await goToTab(page, 'import');
		await importPhotos({ page }, 'cyan', 'leaf', 'lil-fella', 'with-exif-gps');
		await expect(page.getByText(/Analyse….|En attente/)).toHaveCount(0, {
			timeout: 30_000
		});
		await goToTab(page, 'crop');
		await page.getByText('lil-fella.jpeg').click();
		await page.getByRole('button', { name: 'Continuer' }).click();
		await page.waitForTimeout(1000);
		await goToTab(page, 'classify');
		await page.waitForTimeout(1000);
		await expect(page.getByText('Chargement du modèle de classification')).toHaveCount(0, {
			timeout: 10_000
		});
		await page.waitForTimeout(5_000);
		await expect(page.getByText(/Analyse…|En attente/)).toHaveCount(0, { timeout: 10_000 });
	}

	test('correct', async ({ page }) => {
		await prepare({ page });
		await page.getByRole('button', { name: 'Résultats' }).click();
		await page.getByText(fr.metadata_cropped_and_full_images).click();
		await page.getByText('results.zip').click();
		const download = await page.waitForEvent('download');
		await download.saveAs('./tests/fixtures/exports/correct.zip');
	});

	test('no-originals', async ({ page }) => {
		await prepare({ page });
		await page.getByRole('button', { name: 'Résultats' }).click();
		await page.getByText(fr.metadata_and_cropped_images).click();
		await page.getByText('results.zip').click();
		const download = await page.waitForEvent('download');
		await download.saveAs('./tests/fixtures/exports/no-originals.zip');
	});

	test('no-analysis', async ({ page }) => {
		await prepare({ page });
		await page.getByRole('button', { name: 'Résultats' }).click();
		await page.getByText(fr.metadata_cropped_and_full_images).click();
		await page.getByText('results.zip').click();
		const download = await page.waitForEvent('download');
		const zipPath = './tests/fixtures/exports/no-analysis.zip';
		await download.saveAs(zipPath);

		// Remove analysis.json from the zip
		const zipData = await readFile(zipPath);
		const zip = await JSZip.loadAsync(zipData);
		zip.remove('analysis.json');
		const newZipData = await zip.generateAsync({ type: 'nodebuffer' });
		await writeFile(zipPath, newZipData);
	});

	test('invalid-json-analysis', async ({ page }) => {
		await prepare({ page });
		await page.getByRole('button', { name: 'Résultats' }).click();
		await page.getByText(fr.metadata_cropped_and_full_images).click();
		await page.getByText('results.zip').click();
		const download = await page.waitForEvent('download');
		const zipPath = './tests/fixtures/exports/invalid-json-analysis.zip';
		await download.saveAs(zipPath);

		// Erase first '{' from analysis.json
		const zipData = await readFile(zipPath);
		const zip = await JSZip.loadAsync(zipData);
		const analysisFile = zip.file('analysis.json');
		if (!analysisFile) throw new Error('analysis.json not found in zip');
		const analysisContent = await analysisFile.async('string');
		const modifiedContent = analysisContent.replace('{', '');
		zip.file('analysis.json', modifiedContent);
		const newZipData = await zip.generateAsync({ type: 'nodebuffer' });
		await writeFile(zipPath, newZipData);
	});

	test('wrong-protocol', async ({ page }) => {
		await prepare({ page });
		await page.getByRole('button', { name: 'Résultats' }).click();
		await page.getByText(fr.metadata_cropped_and_full_images).click();
		await page.getByText('results.zip').click();
		const download = await page.waitForEvent('download');
		await download.saveAs('./tests/fixtures/exports/wrong-protocol.zip');

		// Change protocol ID in analysis.json
		const zipPath = './tests/fixtures/exports/wrong-protocol.zip';
		const zipData = await readFile(zipPath);
		const zip = await JSZip.loadAsync(zipData);
		const analysisFile = zip.file('analysis.json');
		if (!analysisFile) throw new Error('analysis.json not found in zip');
		const analysisContent = await analysisFile.async('string');
		const modifiedContent = analysisContent.replace(
			'"protocolId": "io.github.cigaleapp.arthropods.example.light"',
			'"protocolId": "io.github.cigaleapp.arthropods.example.wrong"'
		);
		zip.file('analysis.json', modifiedContent);
		const newZipData = await zip.generateAsync({ type: 'nodebuffer' });
		await writeFile(zipPath, newZipData);
	});
});
