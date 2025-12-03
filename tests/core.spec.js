import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import * as yauzl from 'yauzl-promise';

import defaultProtocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import lightweightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { Analysis } from '../src/lib/schemas/exports.js';
import { pr, withParallelism } from './annotations';
import { expect, test } from './fixtures.js';
import {
	chooseInDropdown,
	chooseProtocol,
	expectZipFiles,
	firstObservationCard,
	goToTab,
	importPhotos,
	importProtocol,
	makeRegexpUnion,
	mockProtocolSourceURL,
	modal,
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
					.getByRole('button', { name: 'Préparation hors-ligne' })
					.click();
				await modal(page, 'Préparation hors-ligne')
					.getByRole('button', { name: 'Démarrer' })
					.click();

				await expect(modal(page, 'Préparation hors-ligne')).toHaveText(/OK!/, {
					timeout: 10_000
				});

				await modal(page, 'Préparation hors-ligne')
					.getByRole('button', { name: 'Fermer' })
					.first()
					.click();

				context.setOffline(true);
			}

			await setSettings({ page }, { showTechnicalMetadata: false });
			await chooseProtocol(page);
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
			await firstObservationCard(page).click();
			await expect(page.getByText('Espèce')).toBeVisible();

			// Export results
			await page.getByTestId('app-nav').getByRole('button', { name: 'Résultats' }).click();
			await page.getByText(/et images originales/i).click();
			await page.getByText('results.zip').click();
			const download = await page.waitForEvent('download');
			expect(download.suggestedFilename()).toBe('results.zip');
			await download.saveAs('./tests/results/lil-fella.zip');

			await expectZipFiles(
				await yauzl.open('./tests/results/lil-fella.zip'),
				[
					'analysis.json',
					'metadata.csv',
					'Cropped/Entomobrya muscorum_obs1_1.jpeg',
					'Original/Entomobrya muscorum_obs1_1.jpeg'
				],
				{
					'analysis.json': {
						json(data) {
							expect.soft(Analysis.allows(data)).toBe(true);
						}
					},
					'metadata.csv': {
						text(txt) {
							const lines = txt.split('\n');
							expect(lines).toHaveLength(2);
							expect
								.soft(lines.at(0))
								.toBe(
									'"Identifiant";"Observation";"Date";"Date: Confiance";"Espèce";"Espèce: Confiance";"Genre";"Genre: Confiance";"Famille";"Famille: Confiance";"Ordre";"Ordre: Confiance";"Classe";"Classe: Confiance";"Phylum";"Phylum: Confiance";"Règne";"Règne: Confiance"'
								);
						}
					},
					'Cropped/Entomobrya muscorum_obs1_1.jpeg': {
						buffer(buf) {
							expect.soft(buf).toMatchSnapshot({ maxDiffPixelRatio: 0.01 });
						},
						entry(entry) {
							expect
								.soft(entry.getLastMod().toISOString())
								.toEqual('2025-04-25T12:38:36.000Z');
						}
					}
				}
			);
		}
	);
}

test('can handle a bunch of images at once', withParallelism(4), async ({ page }) => {
	test.fixme(
		true,
		"Really flaky since this week for no reason, even on local runs, sometimes it works fines, sometimes it makes Chrome freeze. Even the profiler freezes, so we can't know what causes it. Nothing obvious in the console too."
	);

	const imagesCount = 10;

	const timeouts = { begin: 500, finish: imagesCount * 0.4 * 60_000 };
	test.setTimeout(3 * timeouts.finish);

	await setSettings(
		{ page },
		{
			showTechnicalMetadata: false
		}
	);
	await chooseProtocol(page);
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
	await expect(observations).not.toHaveText(new RegExp('Rééssayer'));
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
	await expect(modal(page, 'Importer le protocole distant ?')).toBeVisible({
		timeout: 30_000
	});
	await expect(modal(page, 'Importer le protocole distant ?').getByRole('link')).toHaveAttribute(
		'href',
		protocolUrl
	);

	await modal(page, 'Importer le protocole distant ?')
		.getByRole('button', { name: 'Importer' })
		.click();

	await expect(page.getByTestId('protocol-switcher-open')).toHaveAccessibleName('Kitchen sink');
});

test('can pre-set models via ?classificationModel and ?cropModel', async ({ page }) => {
	await setSettings({ page }, { showTechnicalMetadata: false });
	await chooseProtocol(page);

	async function reset() {
		await chooseInDropdown(page, 'classify-models', 'Collemboles');
		await chooseInDropdown(page, 'crop-models', 'YOLO11');
		await page.waitForTimeout(500);
	}

	await page.goto('?classificationModel=0');

	await expect(page.getByTestId('protocol-switcher-open')).toHaveAccessibleName(
		'Example: arthropodes (lightweight)',
		{
			timeout: 30_000
		}
	);

	await page.getByTestId('crop-models-open').click();
	await expect(page.getByTestId('crop-models-options')).toMatchAriaSnapshot(`
	  - menu:
	    - group "Modèle d'inférence":
	      - group: Modèle d'inférence
	      - menuitemcheckbox "Aucune inférence"
	      - menuitemcheckbox "YOLO11" [checked]:
	        - img
	    - group
	`);
	await page.keyboard.press('Escape');

	await page.getByTestId('classify-models-open').click();
	await expect(page.getByTestId('classify-models-options')).toMatchAriaSnapshot(`
	  - menu:
	    - group "Modèle d'inférence":
	      - group: Modèle d'inférence
	      - menuitemcheckbox "Aucune inférence" [checked]:
	        - img
	      - menuitemcheckbox /Collemboles \\(~\\d+ classes\\)/
	    - group
	`);
	await page.keyboard.press('Escape');

	await reset();

	await page.goto('?cropModel=0');

	await page.getByTestId('crop-models-open').click({ timeout: 30_000 });
	await expect(page.getByTestId('crop-models-options')).toMatchAriaSnapshot(`
	  - menu:
	    - group "Modèle d'inférence":
	      - group: Modèle d'inférence
	      - menuitemcheckbox "Aucune inférence" [checked]:
	        - img
	      - menuitemcheckbox "YOLO11"
	    - group
	`);
	await page.keyboard.press('Escape');

	await page.getByTestId('classify-models-open').click();
	await expect(page.getByTestId('classify-models-options')).toMatchAriaSnapshot(`
	  - menu:
	    - group "Modèle d'inférence":
	      - group: Modèle d'inférence
	      - menuitemcheckbox "Aucune inférence"
	      - menuitemcheckbox /Collemboles \\(~\\d+ classes\\)/ [checked]:
	        - img
	    - group
	`);
	await page.keyboard.press('Escape');

	await reset();

	await page.goto('?classificationModel=0&cropModel=0');

	await page.getByTestId('crop-models-open').click({ timeout: 30_000 });
	await expect(page.getByTestId('crop-models-options')).toMatchAriaSnapshot(`
	  - menu:
	    - group "Modèle d'inférence":
	      - group: Modèle d'inférence
	      - menuitemcheckbox "Aucune inférence" [checked]:
	        - img
	      - menuitemcheckbox "YOLO11"
	    - group
	`);
	await page.keyboard.press('Escape');

	await page.getByTestId('classify-models-open').click();
	await expect(page.getByTestId('classify-models-options')).toMatchAriaSnapshot(`
	  - menu:
	    - group "Modèle d'inférence":
	      - group: Modèle d'inférence
	      - menuitemcheckbox "Aucune inférence" [checked]:
	        - img
	      - menuitemcheckbox /Collemboles \\(~\\d+ classes\\)/
	    - group
	`);
	await page.keyboard.press('Escape');

	await reset();

	await page.goto('?classificationModel=1');

	await page.getByTestId('crop-models-open').click({ timeout: 30_000 });
	await expect(page.getByTestId('crop-models-options')).toMatchAriaSnapshot(`
	  - menu:
	    - group "Modèle d'inférence":
	      - group: Modèle d'inférence
	      - menuitemcheckbox "Aucune inférence"
	      - menuitemcheckbox "YOLO11" [checked]:
	        - img
	    - group
	`);
	await page.keyboard.press('Escape');

	await page.getByTestId('classify-models-open').click();
	await expect(page.getByTestId('classify-models-options')).toMatchAriaSnapshot(`
	  - menu:
	    - group "Modèle d'inférence":
	      - group: Modèle d'inférence
	      - menuitemcheckbox "Aucune inférence"
	      - menuitemcheckbox /Collemboles \\(~\\d+ classes\\)/ [checked]:
	        - img
	    - group
	`);
	await page.keyboard.press('Escape');

	await reset();

	await page.goto('?cropModel=1');

	await page.getByTestId('crop-models-open').click({ timeout: 30_000 });
	await expect(page.getByTestId('crop-models-options')).toMatchAriaSnapshot(`
	  - menu:
	    - group "Modèle d'inférence":
	      - group: Modèle d'inférence
	      - menuitemcheckbox "Aucune inférence"
	      - menuitemcheckbox "YOLO11" [checked]:
	        - img
	    - group
	`);
	await page.keyboard.press('Escape');

	await page.getByTestId('classify-models-open').click();
	await expect(page.getByTestId('classify-models-options')).toMatchAriaSnapshot(`
	  - menu:
	    - group "Modèle d'inférence":
	      - group: Modèle d'inférence
	      - menuitemcheckbox "Aucune inférence"
	      - menuitemcheckbox /Collemboles \\(~\\d+ classes\\)/ [checked]:
	        - img
	    - group
	`);
	await page.keyboard.press('Escape');
});

test('can import a protocol and pre-set models via URL parameters', async ({ page }) => {
	await setSettings({ page }, { showTechnicalMetadata: false });

	await page.getByTestId('protocol-switcher-open').click();
	await page
		.getByTestId('protocol-switcher-options')
		.getByRole('menuitem', { name: 'Gérer les protocoles' })
		.click();
	await page.waitForURL((u) => u.hash === '#/protocols');

	await importProtocol(page, '../../examples/kitchensink.cigaleprotocol.yaml');
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
		.click({
			timeout: 60_000
		});

	await expect(page.getByTestId('protocol-switcher-open')).toHaveAccessibleName(
		'Example: arthropodes (lightweight)'
	);

	await page.getByTestId('crop-models-open').click();
	await expect(page.getByTestId('crop-models-options')).toMatchAriaSnapshot(`
	  - menu:
	    - group "Modèle d'inférence":
	      - group: Modèle d'inférence
	      - menuitemcheckbox "Aucune inférence" [checked]:
	        - img
	      - menuitemcheckbox "YOLO11"
	    - group
	`);
	await page.keyboard.press('Escape');

	await page.getByTestId('classify-models-open').click();
	await expect(page.getByTestId('classify-models-options')).toMatchAriaSnapshot(`
	  - menu:
	    - group "Modèle d'inférence":
	      - group: Modèle d'inférence
	      - menuitemcheckbox "Aucune inférence" [checked]:
	        - img
	      - menuitemcheckbox /Collemboles \\(~\\d+ classes\\)/
	    - group
	`);
	await page.keyboard.press('Escape');
});

test('changing model while on tab reloads it @real-protocol', pr(659), async ({ page }) => {
	await setSettings({ page }, { showTechnicalMetadata: false });
	await chooseProtocol(page);

	await goToTab(page, 'import');
	await importPhotos({ page }, ['cyan.jpeg']);
	await waitForLoadingEnd(page);

	/**
	 *
	 * @param {'crop'|'classify'} tab
	 * @param {string|RegExp} name
	 */
	async function setModel(tab, name) {
		await chooseInDropdown(page, `${tab}-models`, name);
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

	await setModel('crop', 'Aucune inférence');
	await goToTab(page, 'crop');
	await expectLoadingText(false, 'Chargement du modèle de recadrage…');

	await setModel('crop', 'YOLO11');
	await expectLoadingText(true, 'Chargement du modèle de recadrage…');
	await waitForLoadingEnd(page);

	await setModel('classify', 'Aucune inférence');
	await goToTab(page, 'classify');
	await expectLoadingText(false, 'Chargement du modèle de classification');

	await setModel('classify', /80 classes/);
	await expectLoadingText(true, 'Chargement du modèle de classification');
	await waitForLoadingEnd(page);
	await expect(firstObservationCard(page)).not.toHaveText(/Erreur/);

	await setModel('classify', /17000 classes/);
	await expectLoadingText(true, 'Chargement du modèle de classification');
});
