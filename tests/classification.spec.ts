import type { Page } from '@playwright/test';

import lightweightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { issue, pr } from './annotations.js';
import { expect, test, type AppFixture } from './fixtures.js';
import {
	chooseFirstSession,
	firstObservationCard,
	imagesByName,
	importPhotos,
	loadDatabaseDump,
	newSession,
	setInferenceModels
} from './utils/index.js';

test('allows cancelling classification of an observation', issue(430), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'lil-fella.jpeg');
	await expect(firstObservationCard(page)).not.toHaveText(/Analyse…|En attente/, {
		timeout: 10_000
	});
	await app.tabs.go('crop');
	await app.loading.wait();
	await app.tabs.go('classify');
	await expect(firstObservationCard(page)).toHaveText(/Analyse…|En attente/, {
		timeout: 10_000
	});
	await page.waitForTimeout(1_000);
	await firstObservationCard(page).getByRole('button', { name: 'Supprimer' }).click();
	await expect(firstObservationCard(page)).not.toBeVisible({
		timeout: 5_000
	});
	expect(await app.db.observation.byLabel('lil-fella')).toBeUndefined();
});

test.describe('full-screen classification view', pr(1071), () => {
	const ex = expect.soft;

	test.beforeEach(async ({ page, app }) => {
		page.setViewportSize({ width: 1280, height: 800 });

		await loadDatabaseDump(page, 'db/basic.devalue');

		const speciesOfLilFella = lightweightProtocol.metadata[
			'io.github.cigaleapp.arthropods.example.light__species'
		].options.find((o) => o.label === 'Entomobrya muscorum')!;

		await page.evaluate(
			async ([key]) => {
				const option = await window.DB.get(
					'MetadataOption',
					`io.github.cigaleapp.arthropods.example.light__species:${key}`
				);

				window.DB.put('MetadataOption', {
					...option!,
					description:
						"A test description to test stuff out woooo here's some **markdown**. I hope you get rendered into a <strong> HTML tag buddy! See you soon in a expect() call down there :p"
				});
			},
			[speciesOfLilFella.key]
		);

		await chooseFirstSession(page);
		await setInferenceModels(page, {
			classify: 'Aucune inférence',
			crop: 'Aucune inférence'
		});

		await app.tabs.go('classify');

		const lilFella = await app.db.observation.byLabel('lil-fella');
		if (!lilFella) throw new Error('Missing lil-fella observation in database dump');

		// Set shoot_date for every image to ensure deterministic ordering, as some tests rely on it.
		// Make sure that cyan is sorted before leaf
		const { leaf, cyan } = await imagesByName(app);
		await app.db.metadata.set(leaf.id, 'shoot_date', '2023-01-02T12:00:00Z');
		await app.db.metadata.set(cyan.id, 'shoot_date', '2023-01-03T12:00:00Z');
		await app.db.refresh();

		await app.path.wait(`/classify/${lilFella.images[0]}`);
	});

	for (const switchLayout of [false, true]) {
		test.describe(`with the ${switchLayout ? 'other' : 'default'} layout`, () => {
			if (switchLayout) {
				test.beforeEach(async ({ page }) => {
					await page.getByTestId('layout-switcher').getByRole('button').click();
				});
			}

			test('displays the correct information', async ({ page, app }) => {
				const lilFella = await app.db.observation.byLabel('lil-fella');
				if (!lilFella) throw new Error('Missing lil-fella observation in database dump');
				const image = await app.db.image.byId(lilFella.images[0]);
				if (!image) throw new Error('Missing lil-fella first image in database dump');

				const panel = page.getByTestId('panel');
				const option = panel.getByTestId('focused-option');

				await ex(panel.getByRole('heading', { level: 1 })).toHaveAccessibleName(
					`${image.filename} #1`
				);

				await ex(option.getByRole('combobox')).toHaveValue('Entomobrya muscorum');
				await ex(option.getByTestId('current')).toHaveText(/32%\s*$/);

				const prev = option.getByRole('button', { name: 'Option précédente' });
				const next = option.getByRole('button', { name: 'Option suivante' });

				await ex(prev).toBeDisabled();
				await ex(next).not.toBeDisabled();

				await ex(await app.tooltips.trigger(next)).toHaveText(
					// [A-Z] is the keybind hint
					/^\s*Dicyrtomina saundersi [A-Z]\s*$/
				);
				await ex(next).toHaveText(/\s*(Suivante )?\s*18%\s*/);

				await ex(page.getByTestId('cascades')).toMatchAriaSnapshot(`
				  - text: Métadonnées associées
				  - table:
				    - rowgroup:
				      - row "Règne Animalia":
				        - cell "Règne"
				        - cell "Animalia"
				      - row "Phylum Arthropoda":
				        - cell "Phylum"
				        - cell "Arthropoda"
				      - row "Classe Collembola":
				        - cell "Classe"
				        - cell "Collembola"
				      - row "Ordre Entomobryomorpha":
				        - cell "Ordre"
				        - cell "Entomobryomorpha"
				      - row "Famille Entomobryidae":
				        - cell "Famille"
				        - cell "Entomobryidae"
				      - row "Genre Entomobrya":
				        - cell "Genre"
				        - cell "Entomobrya"
				`);
				await ex(page.getByTestId('synonyms')).toMatchAriaSnapshot(`
				  - text: Synonymes
				  - list:
				    - listitem: Degeeria muscorum
				    - listitem: Entomobrya cognata
				    - listitem: Entomobrya cognata albicans
				    - listitem: Entomobrya cognata nigricans
				    - listitem: Entomobrya intermedea elongata
				    - listitem: Entomobrya intermedia
				    - listitem: Entomobrya intermedia elongata
				    - listitem: Entomobrya macrocerata
				    - listitem: Entomobrya muscorum albina
				    - listitem: Entomobrya muscorum puncticepta
				    - listitem: Entomobrya muscorum punctincepta
				    - listitem: Entomobrya muscorum nigricans
				    - listitem: Entomobrya muscorum postbimaculata
				    - listitem: Entomobrya muscorum-albina
				    - listitem: Entomobrya muscorum-postbimaculata
				    - listitem: Entomobrya nivalis
				    - listitem: Entomobrya orcheselloides
				`);
				await ex(page.getByTestId('description')).toMatchAriaSnapshot(`
				  - text: Description
				  - paragraph:
				    - text: A test description to test stuff out woooo here's some
				    - strong: markdown
				    - text: . I hope you get rendered into a
				    - strong: HTML tag buddy! See you soon in a expect() call down there :p
				  - strong
				  - link "En savoir plus gbif.org":
				    - /url: https://gbif.org/species/2120749
				    - img
				    - text: ""
				    - code: gbif.org
				`);
			});

			test.describe('can change the selected option', () => {
				async function assertValueInDB(
					app: AppFixture,
					expectedOptionLabel: string,
					/** between 0 and 100 */
					confidencePercentage: number
				) {
					const { species } = await app.db.metadata.values({
						image: 'lil-fella.jpeg',
						protocolId: lightweightProtocol.id
					});

					const expectedOption = lightweightProtocol.metadata[
						'io.github.cigaleapp.arthropods.example.light__species'
					].options.find((o) => o.label === expectedOptionLabel)!;

					ex(species).toBe(expectedOption.key);

					const image = await app.db.image.byFilename('lil-fella.jpeg');
					if (!image) throw new Error('Missing lil-fella image in database');

					ex(image.metadata[`${lightweightProtocol.id}__species`].confidence).toBeCloseTo(
						confidencePercentage / 100
					);
				}

				test('using the combobox', async ({ page, app }) => {
					const combobox = page
						.getByTestId('panel')
						.getByTestId('focused-option')
						.getByRole('combobox');

					await combobox.fill('Allacma fu');
					await page
						.getByTestId('metadata-combobox-viewport')
						.getByRole('option')
						.first()
						.click();

					await ex(combobox).toHaveValue('Allacma fusca');
					await assertValueInDB(app, 'Allacma fusca', 9);
				});

				test('using the next/previous buttons', async ({ page, app }) => {
					const option = page.getByTestId('panel').getByTestId('focused-option');
					const next = option.getByRole('button', { name: 'Option suivante' });
					const prev = option.getByRole('button', { name: 'Option précédente' });

					await next.click();
					await ex(option.getByRole('combobox')).toHaveValue('Dicyrtomina saundersi');
					await assertValueInDB(app, 'Dicyrtomina saundersi', 18);

					await next.click();
					await ex(option.getByRole('combobox')).toHaveValue('Allacma fusca');
					await assertValueInDB(app, 'Allacma fusca', 9);

					await prev.click();
					await ex(option.getByRole('combobox')).toHaveValue('Dicyrtomina saundersi');
					await assertValueInDB(app, 'Dicyrtomina saundersi', 18);
				});
			});

			test('can go to the crop view and back', async ({ page, app }) => {
				const url = page.url();

				await page
					.getByTestId('panel')
					.getByTestId('header')
					.getByRole('button', { name: 'Recadrer' })
					.click();

				await app.path.wait('/(app)/(sidepanel)/crop/[image]/[[from]]');

				await ex(page).toHaveTitle(/^Recadrer lil-fella.jpeg · /);

				await page.getByRole('button', { name: 'Retour' }).click();

				await app.path.wait('/(app)/(sidepanel)/classify/[image]');
				await ex(page).toHaveURL(url);
			});

			test.describe('can exit out to the classification tab', () => {
				test('with the button', async ({ page, app }) => {
					await page
						.getByTestId('panel')
						.getByTestId('header')
						.getByRole('button', { name: 'Autres images' })
						.click();

					await app.path.wait('/classify');
				});

				test('with the keyboard', async ({ page, app }) => {
					await page.keyboard.press('Escape');
					await app.path.wait('/classify');
				});
			});

			test('can navigate to other images', async ({ page }) => {
				const navigation = page.getByTestId('panel').getByTestId('nav');
				const title = page.getByTestId('panel').getByRole('heading', { level: 1 });
				const selectedOption = page
					.getByTestId('panel')
					.getByTestId('focused-option')
					.getByTestId('current');

				await ex(title).toHaveAccessibleName('lil-fella.jpeg #1');

				// XXX: fore some reason, in E2E browsers only, this specific click goes two images forward
				// await navigation.getByRole('button', { name: 'Image suivante' }).click();
				await page.keyboard.press('Control+ArrowRight');
				await ex(title).toHaveAccessibleName('leaf.jpeg #1');
				await ex(selectedOption).toHaveText('21%');
				await ex(selectedOption.getByRole('combobox')).toHaveValue('Orchesella cincta');

				await navigation.getByRole('button', { name: 'Image suivante' }).click();
				await navigation.getByRole('button', { name: 'Image suivante' }).click();
				await ex(title).toHaveAccessibleName('with-exif-gps.jpeg #1');
				await ex(selectedOption).toHaveText('--%');

				await navigation.getByRole('button', { name: 'Image précédente' }).click();
				await navigation.getByRole('button', { name: 'Image précédente' }).click();
				await navigation.getByRole('button', { name: 'Image précédente' }).click();
				await ex(title).toHaveAccessibleName('lil-fella.jpeg #1');
				await ex(selectedOption).toHaveText('32%');
				await ex(selectedOption.getByRole('combobox')).toHaveValue('Entomobrya muscorum');
			});
		});
	}

	test('classification confirmation', async ({ page, app }) => {
		// XXX: DONT MERGE
		// TODO: assertions about the progress bar

		const ex = expect.soft;

		// Switch to horizontal layout for window size reasons
		await page.getByTestId('layout-switcher').getByRole('button').click();

		// Go to next when continue is clicked, since there are still other unconfirmed images
		await page.getByRole('button', { name: 'Continuer' }).click();

		await ex(confirmedCropOverlay(page)).toBeVisible();

		// eslint-disable-next-line prefer-const
		let { leaf, lilFella, cyan, withExifGps } = await imagesByName(app);

		ex(lilFella.metadata[`${lightweightProtocol.id}__species`]).toHaveProperty(
			'confirmed',
			true
		);

		await app.path.wait(`/classify/${leaf.id}`);

		// Mark the next images as confirmed too

		await page.keyboard.press('ArrowUp');

		// Arrows should be silent
		await ex(confirmedCropOverlay(page)).not.toBeVisible();
		({ leaf } = await imagesByName(app));
		ex(leaf.metadata[`${lightweightProtocol.id}__species`]).toHaveProperty('confirmed', true);

		await page.keyboard.press('Control+ArrowRight');

		await app.path.wait(`/classify/${cyan.id}`);
		await page.keyboard.press('ArrowUp');
		await page.keyboard.press('Control+ArrowRight');

		await app.path.wait(`/classify/${withExifGps.id}`);
		await page.keyboard.press('ArrowUp');

		await page.keyboard.press('ArrowDown');
		({ withExifGps } = await imagesByName(app));
		ex(withExifGps.metadata[`${lightweightProtocol.id}__species`]).toHaveProperty(
			'confirmed',
			false
		);

		// Now all the other images are confirmed, clicking continue should exit the full screen view
		await page.getByRole('button', { name: 'Continuer' }).click();
		await ex(confirmedCropOverlay(page)).toBeVisible();

		await app.path.wait('/results');
	});
});

/**
 * Gets the "Confirmé" overlay that appears in the cropper view if the current image has been marked as confirmed through implicit means.
 */
function confirmedCropOverlay(page: Page) {
	return page.locator('.confirmed-overlay');
}
