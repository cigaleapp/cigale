import { expect, test } from './setup.js';
import extract from 'extract-zip';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Analysis } from '../scripts/generate-json-schemas.js';
import { setSettings } from './utils.js';

test('basic functionality', async ({ page }) => {
	await page.goto('/');

	await setSettings({ page }, { showTechnicalMetadata: false });

	// Choose default protocol
	await expect(page.getByTestId('protocol-to-choose')).toBeVisible({ timeout: 20_000 });
	await page.getByTestId('protocol-to-choose').click();
	await page.waitForURL((u) => u.hash === '#/import');

	// Import fixture image
	await expect(page.getByText(/Cliquer ou déposer des images ici/)).toBeVisible();
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
	await page.getByText(/et images originales$/i).click();
	await page.getByText('results.zip').click();
	const download = await page.waitForEvent('download');
	expect(download.suggestedFilename()).toBe('results.zip');
	await download.saveAs('./tests/results/lil-fella.zip');

	// Inspect results
	const resultsDir = path.resolve('./tests/results/lil-fella');
	await extract('./tests/results/lil-fella.zip', { dir: resultsDir });

	const files = fs.readdirSync(resultsDir);
	expect(files.sort()).toMatchObject(['Cropped', 'Original', 'analysis.json', 'metadata.csv']);

	const analysis = JSON.parse(fs.readFileSync(path.join(resultsDir, 'analysis.json'), 'utf8'));
	expect(Analysis.allows(analysis)).toBe(true);

	const croppedDir = path.join(resultsDir, 'Cropped');
	const croppedImages = fs.readdirSync(croppedDir);
	expect(croppedImages).toMatchObject(['Allacma fusca_1.jpeg']);

	const image = fs.readFileSync(path.join(croppedDir, 'Allacma fusca_1.jpeg'));
	expect(image).toMatchSnapshot({
		maxDiffPixelRatio: 0.01
	});
});
