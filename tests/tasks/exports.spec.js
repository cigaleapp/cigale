import { readFile, writeFile } from 'node:fs/promises';
import JSZip from 'jszip';

import { expect, test } from '../fixtures.js';
import { importPhotos, newSession, sessionMetadataSectionFor } from '../utils/index.js';

test.skip(
	Boolean(process.env.CI),
	'Skipping database dumps and exports on CI, these are meant as easy way to (re)create dump fixtures locally only.'
);

/**
 * @param {object} param0
 * @param {import('@playwright/test').Page} param0.page
 * @param {import('../fixtures.js').AppFixture} param0.app
 */
async function prepare({ page, app }) {
	await newSession(page, { name: 'Testing session' });

	await page.getByTestId('goto-current-session').click();
	await app.path.wait('/(app)/sessions/[id]');
	await sessionMetadataSectionFor(page, 'Durée de prospection')
		.getByRole('textbox')
		.first()
		.fill('54');
	await sessionMetadataSectionFor(page, 'Durée de prospection')
		.getByRole('textbox')
		.first()
		.blur();
	await sessionMetadataSectionFor(page, 'Vent')
		.getByRole('radiogroup')
		.getByRole('radio', { name: 'Modéré' })
		.check();

	await app.tabs.go('import');
	await importPhotos({ page }, 'cyan.jpeg', 'leaf.jpeg', 'lil-fella.jpeg', 'with-exif-gps.jpeg');
	await expect(page.getByText(/Analyse….|En attente/)).toHaveCount(0, {
		timeout: 30_000
	});

	await app.tabs.go('crop');
	await page.getByText('lil-fella.jpeg').click();
	await page.getByRole('button', { name: 'Continuer' }).click();
	await page.waitForTimeout(1000);
	await page.getByRole('button', { name: 'Autres photos Esc' }).click();

	await app.tabs.go('classify');
	await page.waitForTimeout(1000);
	await expect(page.getByText('Chargement du modèle de classification')).toHaveCount(0, {
		timeout: 10_000
	});
	await page.waitForTimeout(5_000);
	await expect(page.getByText(/Analyse…|En attente/)).toHaveCount(0, { timeout: 10_000 });

	const withExifGps = await app.db.image.byFilename('with-exif-gps.jpeg');
	if (!withExifGps) throw new Error('Image with-exif-gps.jpeg not found in database');
	await app.db.metadata.set(withExifGps.id, 'species', null);
}

test('correct', async ({ page, app }) => {
	await prepare({ page, app });
	await app.tabs.go('results');
	await page.getByText('Métadonnées, images recadrées et images originales').click();
	await page.getByRole('button', { name: 'Archive ZIP' }).click();
	const download = await page.waitForEvent('download');
	await download.saveAs('./tests/fixtures/exports/correct.zip');
});

test('no-originals', async ({ page, app }) => {
	await prepare({ page, app });
	await app.tabs.go('results');
	await page.getByText('Métadonnées et images recadrées').click();
	await page.getByRole('button', { name: 'Archive ZIP' }).click();
	const download = await page.waitForEvent('download');
	await download.saveAs('./tests/fixtures/exports/no-originals.zip');
});

test('no-analysis', async ({ page, app }) => {
	await prepare({ page, app });
	await app.tabs.go('results');
	await page.getByText('Métadonnées, images recadrées et images originales').click();
	await page.getByRole('button', { name: 'Archive ZIP' }).click();
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

test('invalid-json-analysis', async ({ page, app }) => {
	await prepare({ page, app });
	await app.tabs.go('results');
	await page.getByText('Métadonnées, images recadrées et images originales').click();
	await page.getByRole('button', { name: 'Archive ZIP' }).click();
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

test('wrong-protocol', async ({ page, app }) => {
	await prepare({ page, app });
	await app.tabs.go('results');
	await page.getByText('Métadonnées, images recadrées et images originales').click();
	await page.getByRole('button', { name: 'Archive ZIP' }).click();
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
		'"protocol": "io.github.cigaleapp.arthropods.example.light"',
		'"protocol": "io.github.cigaleapp.arthropods.example.wrong"'
	);
	zip.file('analysis.json', modifiedContent);
	const newZipData = await zip.generateAsync({ type: 'nodebuffer' });
	await writeFile(zipPath, newZipData);
});
