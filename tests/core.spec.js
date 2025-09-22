import extract from 'extract-zip';
import * as fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import defaultProtocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import lightweightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import fr from '../messages/fr.json' with { type: 'json' };
import { Analysis } from '../src/lib/schemas/results.js';
import { pr, withParallelism } from './annotations';
import { expect, test } from './fixtures.js';
import {
	chooseDefaultProtocol,
	goToTab,
	importPhotos,
	importProtocol,
	makeRegexpUnion,
	mockProtocolSourceURL,
	modal,
	readdirTreeSync,
	setSettings,
	waitForLoadingEnd
} from './utils.js';

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

				await modal(page, fr.prepare_for_offline)
					.getByRole('button', { name: 'Fermer' })
					.first()
					.click();

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

			await goToTab(page, 'crop');
			await waitForLoadingEnd(page);

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
			await waitForLoadingEnd(page);

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

test('can handle a bunch of images at once', withParallelism(4), async ({ page }) => {
	const imagesCount = 10;

	const timeouts = { begin: 500, finish: imagesCount * 0.4 * 60_000 };
	test.setTimeout(3 * timeouts.finish);

	await setSettings(
		{ page },
		{
			showTechnicalMetadata: false
		}
	);
	await chooseDefaultProtocol(page);
	await goToTab(page, 'import');

	const observations = page.getByTestId('observations-area');

	const images = ['cyan.jpeg', 'lil-fella.jpeg', 'leaf.jpeg', 'large-image.jpeg'];
	const randomImage = () => images[Math.floor(Math.random() * images.length)];
	await importPhotos({ page, wait: false }, Array.from({ length: imagesCount }, randomImage));

	await waitForLoadingEnd(observations, { ...timeouts, concurrency: 4 });

	// Makes the test really slow

	// await goToTab(page, 'crop');
	// await waitForLoadingEnd(observations, timeouts);

	// await goToTab(page, 'classify');
	// await waitForLoadingEnd(observations, timeouts);

	await page.keyboard.press('Control+A');
	// await expect(page.getByTestId('sidepanel')).toMatchAriaSnapshot();
	await expect(page.getByTestId('sidepanel').getByRole('heading', { level: 2 })).toHaveText(
		`${imagesCount} images`
	);
	await expect(observations).not.toHaveText(new RegExp(fr.retry));
});

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
		await page.waitForTimeout(500);
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
		.getByRole('listitem')
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

test('changing model while on tab reloads it @real-protocol', pr(659), async ({ page }) => {
	await setSettings({ page }, { showTechnicalMetadata: false });
	await chooseDefaultProtocol(page);

	await goToTab(page, 'import');
	await importPhotos({ page }, ['cyan.jpeg']);
	await waitForLoadingEnd(page);

	/**
	 *
	 * @param {'crop'|'classify'} tab
	 * @param {string|RegExp} name
	 */
	async function setModel(tab, name) {
		const button = page.getByTestId(`${tab}-model-select`);
		await button.click();

		const modalId = await button.getAttribute('aria-controls');
		await page.locator(`#${modalId}`).getByRole('menuitem', { name }).click();
	}

	/**
	 * @param {boolean} toBePresent
	 * @param {string} text
	 */
	async function expectLoadingText(toBePresent, text) {
		let expector = expect(page.getByTestId('app-main'));
		if (!toBePresent) expector = expector.not;
		await expector.toHaveText(makeRegexpUnion(text));
	}

	await setModel('crop', fr.no_inference);
	await goToTab(page, 'crop');
	await expectLoadingText(false, fr.loading_cropping_model);

	await setModel('crop', 'YOLO11');
	await expectLoadingText(true, fr.loading_cropping_model);
	await waitForLoadingEnd(page);

	await setModel('classify', fr.no_inference);
	await goToTab(page, 'classify');
	await expectLoadingText(false, fr.loading_classification_model);

	await setModel('classify', /80 classes/);
	await expectLoadingText(true, fr.loading_classification_model);
	await waitForLoadingEnd(page);
	await expect(page.getByTestId('first-observation-card')).not.toHaveText(/Erreur/);

	await setModel('classify', /17000 classes/);
	await expectLoadingText(true, fr.loading_classification_model);
});
