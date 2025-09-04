import { expect, test } from './fixtures.js';
import extract from 'extract-zip';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Analysis } from '../src/lib/schemas/results.js';
import {
	setSettings,
	chooseDefaultProtocol,
	readdirTreeSync,
	goToTab,
	mockProtocolSourceURL,
	modal,
	importProtocol
} from './utils.js';
import { readFile } from 'node:fs/promises';
import fr from '../messages/fr.json' with { type: 'json' };
import defaultProtocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import lightweightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };

for (const offline of [false, true]) {
	test(
		offline ? 'basic functionality, while offline' : 'basic functionality',
		async ({ page, context }) => {
			if (offline) {
				test.skip(context.serviceWorkers().length === 0, "No sw, can't test offline");

				// Open settings and prepare for offline use
				await page.getByTestId('settings-button').click();
				await page
					.getByTestId('app-settings')
					.getByRole('button', { name: fr.prepare_for_offline })
					.click();
				await modal(page, fr.prepare_for_offline).getByRole('button', { name: 'Démarrer' }).click();

				await expect(modal(page, fr.prepare_for_offline)).toHaveText(/OK!/, {
					timeout: 10_000
				});

				await modal(page, fr.prepare_for_offline).getByRole('button', { name: 'Fermer' }).click();

				context.setOffline(true);
			}

			await setSettings({ page }, { showTechnicalMetadata: false });
			await chooseDefaultProtocol(page);
			await goToTab(page, 'import');

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
			await goToTab(page, 'crop');
			await page.getByText('lil-fella.jpeg').click();

			// Check for continuing
			await page.getByRole('button', { name: /^Continuer/ }).click();
			await expect(page.getByText('Confirmé', { exact: true })).toBeVisible();

			// Go to classification view
			await goToTab(page, 'classify');
			// Wait for inference
			await page.waitForTimeout(1000);
			await expect(page.getByText('Chargement du modèle de classification')).toHaveCount(0, {
				timeout: 10_000
			});
			await expect(page.getByText('Analyse…')).toHaveCount(0, { timeout: 10_000 });

			// Check for classification results in sidepanel
			await page.getByTestId('first-observation-card').click();
			await expect(page.getByText('Espèce')).toBeVisible();

			// Export results
			await page.getByTestId('app-nav').getByRole('button', { name: 'Résultats' }).click();
			await page.getByText(/et images originales/i).click();
			await page.getByText('results.zip').click();
			const download = await page.waitForEvent('download');
			expect(download.suggestedFilename()).toBe('results.zip');
			await download.saveAs('./tests/results/lil-fella.zip');

			// Inspect results
			const resultsDir = path.resolve('./tests/results/lil-fella');
			await extract('./tests/results/lil-fella.zip', { dir: resultsDir });

			expect(readdirTreeSync(resultsDir)).toMatchObject([
				{ Cropped: ['Entomobrya muscorum_1.jpeg'] },
				{ Original: ['Entomobrya muscorum_1.jpeg'] },
				'analysis.json',
				'metadata.csv'
			]);

			const csv = fs.readFileSync(path.join(resultsDir, 'metadata.csv'), 'utf8');
			expect(csv.split('\n')).toHaveLength(2);

			const firstLine = csv.split('\n')[0];
			expect(firstLine).toBe(
				'"Identifiant";"Observation";"Date";"Date: Confiance";"Espèce";"Espèce: Confiance";"Genre";"Genre: Confiance";"Famille";"Famille: Confiance";"Ordre";"Ordre: Confiance";"Classe";"Classe: Confiance";"Phylum";"Phylum: Confiance";"Règne";"Règne: Confiance"'
			);

			const analysis = JSON.parse(fs.readFileSync(path.join(resultsDir, 'analysis.json'), 'utf8'));
			expect(Analysis.allows(analysis)).toBe(true);

			const image = fs.readFileSync(path.join(resultsDir, 'Cropped', 'Entomobrya muscorum_1.jpeg'));
			expect(image).toMatchSnapshot({
				maxDiffPixelRatio: 0.01
			});
		}
	);
}

test('can import a protocol via ?protocol', async ({ page, context }) => {
	await setSettings({ page }, { showTechnicalMetadata: false });
	const protocolUrl = 'https://example.com/kitchensink.cigaleprotocol.yaml';
	await mockProtocolSourceURL(page, context, protocolUrl, {
		body: await readFile(
			path.join(import.meta.dirname, '..', 'examples', 'kitchensink.cigaleprotocol.yaml'),
			'utf8'
		)
	});

	await page.goto(`?protocol=${encodeURIComponent(protocolUrl)}`);
	await expect(modal(page, 'Importer le protocole distant ?')).toBeVisible();
	await expect(modal(page, 'Importer le protocole distant ?').getByRole('link')).toHaveAttribute(
		'href',
		protocolUrl
	);

	await modal(page, 'Importer le protocole distant ?')
		.getByRole('button', { name: 'Importer' })
		.click();

	await expect(
		page.getByRole('button', {
			name: 'Kitchen sink',
			exact: true
		})
	).toHaveAttribute('aria-pressed', 'true');
});

test('can pre-set models via ?classificationModel and ?cropModel', async ({ page }) => {
	await setSettings({ page }, { showTechnicalMetadata: false });
	await chooseDefaultProtocol(page);

	const classificationModel = page.getByRole('radiogroup', {
		name: "Modèle d'inférence pour Espèce"
	});
	const cropModel = page.getByRole('radiogroup', { name: "Modèle d'inférence pour la détection" });

	async function reset() {
		await classificationModel.getByRole('radio', { name: 'Léger' }).click();
		await cropModel.getByRole('radio', { name: 'YOLO11' }).click();
	}

	await page.goto('?classificationModel=0');
	await expect(classificationModel).toMatchAriaSnapshot(`
	  - radiogroup "Modèle d'inférence pour Espèce":
	    - radio "Aucune inférence" [checked]
	    - radio /Léger/
	`);
	await expect(cropModel).toMatchAriaSnapshot(`
	  - radiogroup "Modèle d'inférence pour la détection":
	    - radio "Aucune inférence"
	    - radio "YOLO11" [checked]
	`);
	await reset();

	await page.goto('?cropModel=0');
	await expect(classificationModel).toMatchAriaSnapshot(`
	  - radiogroup "Modèle d'inférence pour Espèce":
	    - radio "Aucune inférence"
	    - radio /Léger/ [checked]
	`);
	await expect(cropModel).toMatchAriaSnapshot(`
	  - radiogroup "Modèle d'inférence pour la détection":
	    - radio "Aucune inférence" [checked]
	    - radio "YOLO11"
	`);
	await reset();

	await page.goto('?classificationModel=0&cropModel=0');
	await expect(classificationModel).toMatchAriaSnapshot(`
	  - radiogroup "Modèle d'inférence pour Espèce":
	    - radio "Aucune inférence" [checked]
	    - radio /Léger/
	`);
	await expect(cropModel).toMatchAriaSnapshot(`
	  - radiogroup "Modèle d'inférence pour la détection":
	    - radio "Aucune inférence" [checked]
	    - radio "YOLO11"
	`);
	await reset();

	await page.goto('?classificationModel=1');
	await expect(classificationModel).toMatchAriaSnapshot(`
	  - radiogroup "Modèle d'inférence pour Espèce":
	    - radio "Aucune inférence"
	    - radio /Léger/ [checked]
	`);
	await expect(cropModel).toMatchAriaSnapshot(`
	  - radiogroup "Modèle d'inférence pour la détection":
	    - radio "Aucune inférence"
	    - radio "YOLO11" [checked]
	`);
	await reset();

	await page.goto('?cropModel=1');
	await expect(classificationModel).toMatchAriaSnapshot(`
	  - radiogroup "Modèle d'inférence pour Espèce":
	    - radio "Aucune inférence"
	    - radio /Léger/ [checked]
	`);
	await expect(cropModel).toMatchAriaSnapshot(`
	  - radiogroup "Modèle d'inférence pour la détection":
	    - radio "Aucune inférence"
	    - radio "YOLO11" [checked]
	`);
});

test('can import a protocol and pre-set models via URL parameters', async ({ page }) => {
	await setSettings({ page }, { showTechnicalMetadata: false });
	await importProtocol(page, '../../examples/kitchensink.cigaleprotocol.yaml');
	await page.goto('#/protocols');
	await page
		.locator('article')
		.filter({ hasText: lightweightProtocol.id })
		.getByRole('button', { name: 'Supprimer' })
		.click();

	await page.goto(
		`?protocol=${encodeURIComponent(defaultProtocol.source)}&classificationModel=0&cropModel=0`
	);
	await modal(page, 'Importer le protocole distant ?')
		.getByRole('button', { name: 'Importer' })
		.click();
	await expect(
		page.getByRole('button', {
			name: lightweightProtocol.name,
			exact: true
		})
	).toHaveAttribute('aria-pressed', 'true');

	await expect(
		page.getByRole('radiogroup', {
			name: "Modèle d'inférence pour Espèce"
		})
	).toMatchAriaSnapshot(`
	  - radiogroup "Modèle d'inférence pour Espèce":
	    - radio "Aucune inférence" [checked]
	    - radio /Léger/
	`);
	await expect(page.getByRole('radiogroup', { name: "Modèle d'inférence pour la détection" }))
		.toMatchAriaSnapshot(`
	  - radiogroup "Modèle d'inférence pour la détection":
	    - radio "Aucune inférence" [checked]
	    - radio "YOLO11"
	`);
});
