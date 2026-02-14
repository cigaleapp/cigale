import type { Page } from '@playwright/test';

import lightweightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { issue, pr } from './annotations.js';
import { expect, assert, test, type AppFixture } from './fixtures.js';
import {
	chooseFirstSession,
	firstObservationCard,
	imagesByName,
	importPhotos,
	loadDatabaseDump,
	newSession,
	observationsByLabel,
	setInferenceModels
} from './utils/index.js';

test('allows cancelling classification of an observation', issue(430), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'lil-fella.jpeg');
	await assert(firstObservationCard(page)).not.toHaveText(/Analyse…|En attente/, {
		timeout: 10_000
	});
	await app.tabs.go('crop');
	await app.loading.wait();
	await app.tabs.go('classify');
	await assert(firstObservationCard(page)).toHaveText(/Analyse…|En attente/, {
		timeout: 10_000
	});
	await page.waitForTimeout(1_000);
	await firstObservationCard(page).getByRole('button', { name: 'Supprimer' }).click();
	await assert(firstObservationCard(page)).not.toBeVisible({
		timeout: 5_000
	});
	assert(await app.db.observation.byLabel('lil-fella')).toBeUndefined();
});

test.describe('full-screen classification view', pr(1071), () => {
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

		await firstObservationCard(page).dblclick();
		await app.path.wait(`/classify/${lilFella.id}`);
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

				const panel = page.getByTestId('panel');
				const option = panel.getByTestId('focused-option');

				await expect(panel.getByRole('heading', { level: 1 })).toHaveAccessibleName(
					lilFella.label
				);

				await expect(option.getByRole('combobox')).toHaveValue('Entomobrya muscorum');
				await expect(option.getByTestId('current')).toHaveText(/32%\s*$/);

				const prev = option.getByRole('button', { name: 'Option précédente' });
				const next = option.getByRole('button', { name: 'Option suivante' });

				await expect(prev).toBeDisabled();
				await expect(next).not.toBeDisabled();

				await expect(next).toHaveTooltip(
					// [A-Z] is the keybind hint
					/^\s*Dicyrtomina saundersi [A-Z]\s*$/
				);
				await expect(next).toHaveText(/\s*(Suivante )?\s*18%\s*/);

				await expect(page.getByTestId('cascades')).toMatchAriaSnapshot(`
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
				await expect(page.getByTestId('synonyms')).toMatchAriaSnapshot(`
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
				await expect(page.getByTestId('description')).toMatchAriaSnapshot(`
				  - img
				  - text: Description
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
						protocolId: lightweightProtocol.id,
						observation: 'lil-fella'
					});

					const expectedOption = lightweightProtocol.metadata[
						'io.github.cigaleapp.arthropods.example.light__species'
					].options.find((o) => o.label === expectedOptionLabel)!;

					expect(species).toBe(expectedOption.key);

					const confidence = (await app.db.observation.byLabel('lil-fella'))
						?.metadataOverrides[`${lightweightProtocol.id}__species`]?.confidence;

					if (confidence === undefined)
						throw new Error('Missing confidence value in database');

					expect(confidence).toBeCloseTo(confidencePercentage / 100);
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

					await expect(combobox).toHaveValue('Allacma fusca');
					await assertValueInDB(app, 'Allacma fusca', 9);
				});

				test('using the next/previous buttons', async ({ page, app }) => {
					const option = page.getByTestId('panel').getByTestId('focused-option');
					const next = option.getByRole('button', { name: 'Option suivante' });
					const prev = option.getByRole('button', { name: 'Option précédente' });

					await next.click();
					await expect(option.getByRole('combobox')).toHaveValue('Dicyrtomina saundersi');
					await assertValueInDB(app, 'Dicyrtomina saundersi', 18);

					await next.click();
					await expect(option.getByRole('combobox')).toHaveValue('Allacma fusca');
					await assertValueInDB(app, 'Allacma fusca', 9);

					await prev.click();
					await expect(option.getByRole('combobox')).toHaveValue('Dicyrtomina saundersi');
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

				await expect(page).toHaveTitle(/^Recadrer lil-fella.jpeg · /);

				await page.getByRole('button', { name: 'Retour' }).click();

				await app.path.wait('/(app)/(sidepanel)/classify/[observation]');
				await expect(page).toHaveURL(url);
			});

			test.describe('can exit out to the classification tab', () => {
				test('with the button', async ({ page, app }) => {
					await page
						.getByTestId('panel')
						.getByTestId('header')
						.getByRole('button', { name: 'Voir tout' })
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

				await expect(title).toHaveAccessibleName('lil-fella');

				// XXX: fore some reason, in E2E browsers only, this specific click goes two images forward
				// await navigation.getByRole('button', { name: 'Image suivante' }).click();
				await page.keyboard.press('Control+ArrowRight');
				await expect(title).toHaveAccessibleName('leaf');
				await expect(selectedOption).toHaveText('21%');
				await expect(selectedOption.getByRole('combobox')).toHaveValue('Orchesella cincta');

				await navigation.getByRole('button', { name: 'Observation suivante' }).click();
				await navigation.getByRole('button', { name: 'Observation suivante' }).click();
				await expect(title).toHaveAccessibleName('with-exif-gps');
				await expect(selectedOption).toHaveText('--%');

				await navigation.getByRole('button', { name: 'Observation précédente' }).click();
				await navigation.getByRole('button', { name: 'Observation précédente' }).click();
				await navigation.getByRole('button', { name: 'Observation précédente' }).click();
				await expect(title).toHaveAccessibleName('lil-fella');
				await expect(selectedOption).toHaveText('32%');
				await expect(selectedOption.getByRole('combobox')).toHaveValue('Entomobrya muscorum');
			});
		});
	}

	test('classification confirmation', async ({ page, app }) => {
		// eslint-disable-next-line prefer-const
		let { leaf, lilFella, cyan, withExifGps } = await observationsByLabel(app);

		async function assertDatabaseConfirmedStatus(observationId: string, confirmed: boolean) {
			const observation = await app.db.observation.byId(observationId);
			if (!observation) throw new Error(`Missing observation ${observationId} in database`);

			const metadata = observation.metadataOverrides[`${lightweightProtocol.id}__species`];

			if (confirmed) {
				expect(metadata).toHaveProperty('confirmed', true);
			} else {
				// allow either a confirmed=false or no confirmed property at all
				// TODO: a custom matcher to make the error more readable
				expect(metadata?.confirmed ?? false).toBe(false);
			}
		}

		// Switch to horizontal layout for window size reasons
		await page.getByTestId('layout-switcher').getByRole('button').click();

		// Initially

		await expect(page.getByText('Observations classifiées 75%')).toBeVisible();
		await expect(page.getByText('Classifications confirmées 0%')).toBeVisible();
		await assertDatabaseConfirmedStatus(lilFella.id, false);

		// Confirming lil-fella

		await page.getByRole('button', { name: 'Continuer' }).click();
		await expect(confirmedCropOverlay(page)).toBeVisible();

		await expect(page.getByText('Observations classifiées 75%')).toBeVisible();
		await expect(page.getByText('Classifications confirmées 25%')).toBeVisible();
		await assertDatabaseConfirmedStatus(lilFella.id, true);

		// Confirming leaf

		await app.path.wait(`/classify/${leaf.id}`);

		await page.keyboard.press('ArrowUp');
		await expect(confirmedCropOverlay(page)).not.toBeVisible();

		await expect(page.getByText('Observations classifiées 75%')).toBeVisible();
		await expect(page.getByText('Classifications confirmées 50%')).toBeVisible();
		await assertDatabaseConfirmedStatus(leaf.id, true);

		// Confirming cyan

		await page.keyboard.press('Control+ArrowRight');
		await app.path.wait(`/classify/${cyan.id}`);

		await page.keyboard.press('ArrowUp');
		await expect(confirmedCropOverlay(page)).not.toBeVisible();

		await expect(page.getByText('Observations classifiées 75%')).toBeVisible();
		await expect(page.getByText('Classifications confirmées 75%')).toBeVisible();
		await assertDatabaseConfirmedStatus(cyan.id, true);

		// Confirming with-exif-gps does nothing since theres no classification

		await page.keyboard.press('Control+ArrowRight');

		await app.path.wait(`/classify/${withExifGps.id}`);
		await page.keyboard.press('ArrowUp');

		await expect(page.getByText('Observations classifiées 75%')).toBeVisible();
		await expect(page.getByText('Classifications confirmées 75%')).toBeVisible();
		await assertDatabaseConfirmedStatus(withExifGps.id, false);

		// Classify it

		await page.getByTestId('current').getByRole('combobox').fill('Seira musarum');
		await page.keyboard.press('Enter');
		await page.getByTestId('current').getByRole('combobox').blur();
		await expect(page.getByText('Observations classifiées 100%')).toBeVisible();
		await expect(page.getByText('Classifications confirmées 75%')).toBeVisible();

		// Now that all other observations are classified, confirming should work

		await page.getByRole('button', { name: 'Continuer' }).click();
		await expect(confirmedCropOverlay(page)).toBeVisible();
		await assertDatabaseConfirmedStatus(withExifGps.id, true);

		await app.path.wait('/results');
	});

	// TODO: revisit once https://github.com/cigaleapp/cigale/issues/1191 is closed
	test('handles merged observations', async ({ page, app }) => {
		await page.keyboard.press('Escape');
		await app.path.wait('/classify');

		await page.keyboard.down('Control');
		await page.getByRole('article', { name: 'cyan' }).click();
		await page.getByRole('article', { name: 'leaf' }).click();
		await page.keyboard.up('Control');

		await page.getByRole('button', { name: 'Regrouper' }).click();

		await assert(page.getByRole('article', { name: 'leaf' })).not.toBeVisible();

		await page.getByRole('article', { name: 'cyan' }).dblclick();

		await app.path.wait('/(app)/(sidepanel)/classify/[observation]');

		await expect(page.getByTestId('focused-option').getByText('21%')).toBeVisible();
		await expect(page.getByTestId('focused-option').getByRole('combobox')).toHaveValue(
			'Orchesella cincta'
		);

		await page.getByRole('button', { name: 'Option suivante' }).click();

		await expect(page.getByTestId('focused-option').getByText('16%')).toBeVisible();
		await expect(page.getByTestId('focused-option').getByRole('combobox')).toHaveValue(
			'Tomocerus vulgaris'
		);

		// Can flip through the observation's images
		const subject = page.getByTestId('subject');

		await expect(subject).toBeOnSlide('cyan.jpeg (1 sur 2)');
		await expect(subject.getByRole('img', { name: 'cyan.jpeg' })).toBeInViewport();

		await subject.getByRole('button', { name: 'Image suivante' }).click();
		await expect(subject).toBeOnSlide('leaf.jpeg (2 sur 2)');
		await expect(subject.getByRole('img', { name: 'leaf.jpeg' })).toBeInViewport();

		await subject.getByRole('button', { name: 'Image précédente' }).click();
		await expect(subject).toBeOnSlide('cyan.jpeg (1 sur 2)');
		await expect(subject.getByRole('img', { name: 'cyan.jpeg' })).toBeInViewport();
	});
});

/**
 * Gets the "Confirmé" overlay that appears in the cropper view if the current image has been marked as confirmed through implicit means.
 */
function confirmedCropOverlay(page: Page) {
	return page.locator('.confirmed-overlay');
}
