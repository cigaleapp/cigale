import { expect, test } from './fixtures.js';
import extract from 'extract-zip';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Analysis } from '../src/lib/schemas/results.js';
import { setSettings, chooseDefaultProtocol, readdirTreeSync } from './utils.js';

test('basic functionality', async ({ page }) => {
	await setSettings({ page }, { showTechnicalMetadata: false });
	await chooseDefaultProtocol(page);

	// Import fixture image
	await expect(page.getByText(/Cliquer ou déposer/)).toBeVisible();
	const fileInput = await page.$('input[type="file"]');
	await fileInput?.setInputFiles('./tests/fixtures/lil-fella.jpeg');
	await expect(page.getByText('lil-fella.jpeg')).toBeVisible();

	// Check for inferred bounding box
	const boundingBoxStyle = Object.fromEntries(
		await page
			.getByTestId('card-observation-bounding-box')
			.getAttribute('style')
			.then((style) =>
				(style ?? '')
					.split(';')
					.map((decl) => {
						const [prop, val] = decl.trim().split(': ');
						if (!val) return undefined;
						return [prop.trim(), Number(val.trim().replace('%', ''))];
					})
					.filter((entry) => entry !== undefined)
			)
	);

	expect(boundingBoxStyle.left).toBeCloseTo(52.3334, 0);
	expect(boundingBoxStyle.top).toBeCloseTo(29.0534, 0);
	expect(boundingBoxStyle.width).toBeCloseTo(23.2713, 0);
	expect(boundingBoxStyle.height).toBeCloseTo(36.4674, 0);

	// Go to crop view
	await page.getByText('Recadrer').click();
	await page.getByText('lil-fella.jpeg').click();

	// Check for continuing
	await page.getByRole('button', { name: /^Continuer/ }).click();
	await expect(page.getByText('Confirmé', { exact: true })).toBeVisible();

	// Go to classification view
	await page.getByText('Classifier').click();
	// Wait for inference
	await page.waitForTimeout(1000);

	// Check for classification results in sidepanel
	await page.getByText('lil-fella').click();
	await expect(page.getByText('Espèce')).toBeVisible();

	// Export results
	await page.getByRole('button', { name: 'Résultats' }).click();
	await page.getByText(/et images originales/i).click();
	await page.getByText('results.zip').click();
	const download = await page.waitForEvent('download');
	expect(download.suggestedFilename()).toBe('results.zip');
	await download.saveAs('./tests/results/lil-fella.zip');

	// Inspect results
	const resultsDir = path.resolve('./tests/results/lil-fella');
	await extract('./tests/results/lil-fella.zip', { dir: resultsDir });

	expect(readdirTreeSync(resultsDir)).toMatchObject([
		{ Cropped: ['Allacma fusca_1.jpeg'] },
		{ Original: ['Allacma fusca_1.jpeg'] },
		'analysis.json',
		'metadata.csv'
	]);

	const csv = fs.readFileSync(path.join(resultsDir, 'metadata.csv'), 'utf8');
	expect(csv.split('\n')).toHaveLength(2);

	const firstLine = csv.split('\n')[0];
	expect(firstLine).toBe(
		`"Identifiant";"Observation";"";": Confiance";"Date";"Date: Confiance";"";": Confiance";"Espèce";"Espèce: Confiance";"Genre";"Genre: Confiance";"Famille";"Famille: Confiance";"Ordre";"Ordre: Confiance";"Classe";"Classe: Confiance";"Phylum";"Phylum: Confiance";"Règne";"Règne: Confiance"`
	);

	const analysis = JSON.parse(fs.readFileSync(path.join(resultsDir, 'analysis.json'), 'utf8'));
	expect(Analysis.allows(analysis)).toBe(true);

	const image = fs.readFileSync(path.join(resultsDir, 'Cropped', 'Allacma fusca_1.jpeg'));
	expect(image).toMatchSnapshot({
		maxDiffPixelRatio: 0.01
	});
});
