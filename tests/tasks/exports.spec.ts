import { readFile, writeFile } from 'node:fs/promises';

import { ms } from 'convert';
import JSZip from 'jszip';

import { FixturePaths } from '$e2e/filepaths.js';

import { assert, test } from '../fixtures.js';
import { absoluteFixturePath, importPhotos, newSession } from '../utils/index.js';

test.skip(
	Boolean(process.env.CI),
	'Skipping database dumps and exports on CI, these are meant as easy way to (re)create dump fixtures locally only.'
);

test('fill exports/*.zip', async ({ page, app }) => {
	await newSession(page, { name: 'Testing session' });

	await page.getByTestId('goto-current-session').click();
	await app.path.wait('/(app)/sessions/[id]');
	await app.metadata.textbox('Durée de prospection').fill('54');
	await app.metadata.textbox('Durée de prospection').blur();
	await app.metadata.radio('Vent', 'Modéré').check({ force: true });

	await app.tabs.go('import');
	await importPhotos({ page }, 'cyan.jpeg', 'leaf.jpeg', 'lil-fella.jpeg', 'with-exif-gps.jpeg');
	await assert(page.getByText(/Analyse….|En attente/)).toHaveCount(0, {
		timeout: ms('30s'),
	});

	await app.tabs.go('crop');
	await page.getByText('lil-fella.jpeg').click();
	await page.getByRole('button', { name: 'Continuer' }).click();
	await app.wait('1s');
	await page.getByRole('button', { name: 'Retour' }).click();

	await app.tabs.go('classify');
	await app.wait('1s');
	await assert(page.getByText('Chargement du modèle de classification')).toHaveCount(0, {
		timeout: ms('10s'),
	});
	await app.wait('5s');
	await assert(page.getByText(/Analyse…|En attente/)).toHaveCount(0, { timeout: ms('10s') });

	const withExifGps = await app.db.image.byFilename('with-exif-gps.jpeg');
	if (!withExifGps) throw new Error('Image with-exif-gps.jpeg not found in database');
	await app.db.metadata.set(withExifGps.id, 'species', null);

	await app.tabs.go('results');
	await page
		.getByRole('radio', { name: 'Tout Permet de ré-importer ultérieurement' })
		.check({ force: true });

	await page.getByRole('button', { name: 'Archive ZIP' }).click();
	await page
		.waitForEvent('download')
		.then((download) => download.saveAs(absoluteFixturePath('exports/correct.zip')));

	await page.getByText('Métadonnées et images recadrées').click({ force: true });

	await page.getByRole('button', { name: 'Archive ZIP' }).click();
	await page
		.waitForEvent('download')
		.then((download) => download.saveAs(absoluteFixturePath('exports/no-originals.zip')));

	async function mutateZip(saveAs: FixturePaths.Exports, mutator: (zip: JSZip) => Promise<void>) {
		const zipData = await readFile(absoluteFixturePath('exports/correct.zip'));
		const zip = await JSZip.loadAsync(zipData);
		await mutator(zip);
		const newZipData = await zip.generateAsync({ type: 'nodebuffer' });
		await writeFile(absoluteFixturePath(saveAs), newZipData);
	}

	await mutateZip('exports/no-analysis.zip', async (zip) => {
		// Remove analysis.json from the zip
		zip.remove('analysis.json');
	});

	await mutateZip('exports/invalid-json-analysis.zip', async (zip) => {
		const analysis = zip.file('analysis.json');
		if (!analysis) throw new Error('analysis.json not found in zip');
		const content = await analysis.async('string');

		zip.file('analysis.json', content.replace('{', ''));
	});

	await mutateZip('exports/wrong-protocol.zip', async (zip) => {
		const analysis = zip.file('analysis.json');
		if (!analysis) throw new Error('analysis.json not found in zip');
		const content = await analysis.async('string');

		zip.file(
			'analysis.json',
			content.replace(
				'"protocol": "io.github.cigaleapp.arthropods.example.light"',
				'"protocol": "io.github.cigaleapp.arthropods.example.wrong"'
			)
		);
	});
});
