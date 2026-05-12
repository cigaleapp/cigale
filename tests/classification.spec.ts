import type { AppFixture } from './fixtures.js';
import type { Page } from '@playwright/test';

import lightweightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { issue, pr } from './annotations.js';
import { assert, expect, test, testBasic } from './fixtures.js';
import {
	chooseFirstSession,
	firstObservationCard,
	imagesByName,
	importPhotos,
	newSession,
	observationsByLabel,
	scrollAndClick,
	scrollIntoViewVirtualized,
	setInferenceModels,
} from './utils/index.js';
import { controlOrMeta } from './utils/keyboard.js';

test('allows cancelling classification of an observation', issue(430), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'lil-fella.jpeg');
	await assert(firstObservationCard(page)).not.toHaveText(/Analyse…|En attente/, {
		timeout: 10_000,
	});
	await app.tabs.go('crop');
	await app.loading.wait();
	await app.tabs.go('classify');
	await assert(firstObservationCard(page)).toHaveText(/Analyse…|En attente/, {
		timeout: 10_000,
	});
	await page.waitForTimeout(1_000);
	await firstObservationCard(page).getByRole('button', { name: 'Supprimer' }).click();
	await assert(firstObservationCard(page)).not.toBeVisible({
		timeout: 5_000,
	});
	assert(await app.db.observation.byLabel('lil-fella')).toBeUndefined();
});

test.describe('full-screen classification view', pr(1071), () => {
	test.use({ storageState: 'tests/fixtures/storage-states/basic.json' });

	test.beforeEach(async ({ page, app }) => {
		await page.setViewportSize({ width: 1280, height: 800 });

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
						"A test description to test stuff out woooo here's some **markdown**. I hope you get rendered into a <strong> HTML tag buddy! See you soon in a expect() call down there :p",
				});
			},
			[speciesOfLilFella.key]
		);

		await chooseFirstSession(page);
		await setInferenceModels(page, {
			classify: 'Aucune inférence',
			crop: 'Aucune inférence',
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
		await app.path.wait(`/o/${lilFella.id}/classify/suggestions/`);
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

				await expect(
					page.getByTestId('fullscreen-header').getByRole('heading', { level: 1 })
				).toHaveAccessibleName(lilFella.label);

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
				  - img
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
				  - img
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
						protocolId: lightweightProtocol.id,
						observation: 'lil-fella',
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

				await page.getByRole('tab', { name: 'Recadrer' }).click();

				await app.path.wait('/(app)/(sidepanel)/o/[observation]/crop/[image]');

				await expect(page).toHaveTitle(/^Recadrer lil-fella.jpeg · /);

				await page.getByRole('tab', { name: 'Suggestions' }).click();

				await app.path.wait('/(app)/(sidepanel)/o/[observation]/classify/suggestions');
				await expect(page).toHaveURL(url);
			});

			test.describe('can exit out to the classification tab', () => {
				test('with the button', async ({ page, app }) => {
					await page
						.getByTestId('fullscreen-header')
						.getByRole('button', { name: 'Retour' })
						.click();

					await app.path.wait('/classify');
				});

				test('with the keyboard', async ({ page, app }) => {
					await page.keyboard.press('Escape');
					await app.path.wait('/classify');
				});
			});

			test('can navigate to other images', async ({ page, app }) => {
				const title = page
					.getByTestId('fullscreen-header')
					.getByRole('heading', { level: 1 });
				const selectedOption = page
					.getByTestId('panel')
					.getByTestId('focused-option')
					.getByTestId('current');

				async function go(direction: 'suivante' | 'précédente', times = 1) {
					for (let i = 0; i < times; i++) {
						await page
							.getByRole('button', { name: `Observation ${direction}` })
							.click();
						await app.wait('200ms');
					}
				}

				await expect(title).toHaveAccessibleName('lil-fella');

				// XXX: fore some reason, in E2E browsers only, this specific click goes two images forward
				// await navigation.getByRole('button', { name: 'Image suivante' }).click();
				await page.keyboard.press(controlOrMeta(page, 'ArrowRight'));
				await expect(title).toHaveAccessibleName('leaf');
				await expect(selectedOption).toHaveText('21%');
				await expect(selectedOption.getByRole('combobox')).toHaveValue('Orchesella cincta');

				await go('suivante', 2);
				await expect(title).toHaveAccessibleName('with-exif-gps');
				await expect(selectedOption).toHaveText('--%');

				await go('précédente', 3);
				await expect(title).toHaveAccessibleName('lil-fella');
				await expect(selectedOption).toHaveText('32%');
				await expect(selectedOption.getByRole('combobox')).toHaveValue(
					'Entomobrya muscorum'
				);
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

		await expect(
			page.getByRole('progressbar', { name: 'Observations classifiées: 75%' })
		).toBeVisible();
		await expect(
			page.getByRole('progressbar', { name: 'Classifications confirmées: 0%' })
		).toBeVisible();
		await assertDatabaseConfirmedStatus(lilFella.id, false);

		// Confirming lil-fella

		await page.getByRole('button', { name: 'Continuer' }).click();
		await expect(confirmedCropOverlay(page)).toBeVisible();

		await expect(
			page.getByRole('progressbar', { name: 'Observations classifiées: 75%' })
		).toBeVisible();
		await expect(
			page.getByRole('progressbar', { name: 'Classifications confirmées: 25%' })
		).toBeVisible();
		await assertDatabaseConfirmedStatus(lilFella.id, true);

		// Confirming leaf

		await app.path.wait(`/o/${leaf.id}/classify/suggestions/`);

		await page.keyboard.press(controlOrMeta(page, 'ArrowUp'));
		await expect(confirmedCropOverlay(page)).not.toBeVisible();

		await expect(
			page.getByRole('progressbar', { name: 'Observations classifiées: 75%' })
		).toBeVisible();
		await expect(
			page.getByRole('progressbar', { name: 'Classifications confirmées: 50%' })
		).toBeVisible();
		await assertDatabaseConfirmedStatus(leaf.id, true);

		// Confirming cyan

		await page.keyboard.press(controlOrMeta(page, 'ArrowRight'));
		await app.path.wait(`/o/${cyan.id}/classify/suggestions/`);

		await page.keyboard.press(controlOrMeta(page, 'ArrowUp'));
		await expect(confirmedCropOverlay(page)).not.toBeVisible();

		await expect(
			page.getByRole('progressbar', { name: 'Observations classifiées: 75%' })
		).toBeVisible();
		await expect(
			page.getByRole('progressbar', { name: 'Classifications confirmées: 75%' })
		).toBeVisible();
		await assertDatabaseConfirmedStatus(cyan.id, true);

		// Confirming with-exif-gps does nothing since theres no classification

		await page.keyboard.press(controlOrMeta(page, 'ArrowRight'));

		await app.path.wait(`/o/${withExifGps.id}/classify/suggestions/`);
		await page.keyboard.press(controlOrMeta(page, 'ArrowUp'));

		await expect(
			page.getByRole('progressbar', { name: 'Observations classifiées: 75%' })
		).toBeVisible();
		await expect(
			page.getByRole('progressbar', { name: 'Classifications confirmées: 75%' })
		).toBeVisible();
		await assertDatabaseConfirmedStatus(withExifGps.id, false);

		// Classify it

		await page.getByTestId('current').getByRole('combobox').fill('Seira musarum');
		await page.keyboard.press('Enter');
		await page.getByTestId('current').getByRole('combobox').blur();
		await expect(
			page.getByRole('progressbar', { name: 'Observations classifiées: 100%' })
		).toBeVisible();
		await expect(
			page.getByRole('progressbar', { name: 'Classifications confirmées: 75%' })
		).toBeVisible();

		// Now that all other observations are classified, confirming should work

		await page.getByRole('button', { name: 'Continuer' }).click();
		await expect(confirmedCropOverlay(page)).toBeVisible();
		await app.path.wait('/results/');

		await assertDatabaseConfirmedStatus(withExifGps.id, true);
	});

	// TODO: revisit once https://github.com/cigaleapp/cigale/issues/1191 is closed
	test('handles merged observations', async ({ page, app }) => {
		await page.keyboard.press('Escape');
		await app.path.wait('/classify/');

		await page.keyboard.down('Control');
		await page.getByRole('article', { name: 'cyan' }).click();
		await page.getByRole('article', { name: 'leaf' }).click();
		await page.keyboard.up('Control');

		await page.getByRole('button', { name: 'Regrouper' }).click();

		await assert(page.getByRole('article', { name: 'leaf' })).not.toBeVisible();

		await page.getByRole('article', { name: 'cyan' }).dblclick();

		await app.path.wait('/(app)/(sidepanel)/o/[observation]/classify/suggestions');

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

test.describe('narrowing view', pr(1570), () => {
	async function expectCandidatesCount(page: Page, count: number) {
		await expect(page.getByRole('tab', { name: 'Candidats' })).toHaveText(
			new RegExp(`${count}$`)
		);
		await expect(page.getByTestId('remaining-candidates')).toHaveText(`${count} restants`);
	}

	/**
	 * Null to test for absence
	 */
	async function expectMetadataValues(app: AppFixture, values: Record<string, string | null>) {
		// Wait a bit for changes to save to DB
		await app.wait('500ms');

		const db = await app.db.metadata.values({
			protocolId: lightweightProtocol.id,
			observation: 'with-exif-gps',
		});

		for (const [key, val] of Object.entries(values)) {
			if (val === null) {
				expect(db).not.toHaveProperty(key);
			} else {
				expect(db).toHaveProperty(key, val);
			}
		}
	}

	test.beforeEach(async ({ page, app }) => {
		await app.settings.set({ showTechnicalMetadata: false });
		await chooseFirstSession(page);
		await setInferenceModels(page, {
			classify: 'Aucune inférence',
		});

		await app.tabs.go('classify');
		await page.getByRole('article', { name: 'with-exif-gps' }).click();
		await page.getByRole('button', { name: 'Ouvrir en plein écran' }).click();
		await app.path.wait('/(app)/(sidepanel)/o/[observation]/classify/suggestions');
		await page.getByRole('tab', { name: 'Élimination' }).click();
		await app.path.wait('/(app)/(sidepanel)/o/[observation]/classify/narrow/(options)/describe');
	});

	test.describe('describe tab', () => {
		testBasic('can choose choices', async ({ page, app }) => {
			await expectCandidatesCount(page, 166);

			const choices = page.locator('aside').getByRole('list');
			const choice = (name: string) => choices.getByRole('listitem', { name });
			async function choose(
				metadata: string,
				name: string,
				{ scroll = 'down' }: { scroll?: 'up' | 'down' | 'no' } = {}
			) {
				const option = app.metadata.radio(metadata, name, { exact: false });
				if (scroll !== 'no') await scrollIntoViewVirtualized(option, scroll);
				await option.click();
			}

			async function expectChoice(
				name: string,
				{ power, count, value }: { power: number; count: number; value: string }
			) {
				await expect(choice(name).getByRole('combobox')).toHaveValue(value);
				await expect(choice(name).getByRole('progressbar')).toHaveAttribute(
					'aria-valuenow',
					power.toString()
				);
				await expect(choice(name)).toHaveText(new RegExp(`\\b${count}\\b`));
			}

			await choose('Pilosité occipitale', 'Pilosité majoritairement claire', {
				scroll: 'no',
			});

			await expectCandidatesCount(page, 142);
			await expect(choices).toHaveText(/Pilosité occipitale/);
			await expectChoice('Pilosité occipitale', {
				value: 'Pilosité majoritairement claire',
				power: 14,
				count: 142,
			});

			await choose('Forme de la tête', 'Plus large que haute');

			await expectCandidatesCount(page, 110);
			await expectChoice('Forme de la tête', {
				value: 'Plus large que haute',
				power: 23,
				count: 110,
			});

			await expectMetadataValues(app, {
				pilosite_occipitale: 'pilositmaj_1738780459445_3719',
				forme_de_la_tete: 'pluslargeq_1738780492342_5503',
			});

			// Try clearing an option by clicking on it again

			await choose('Pilosité occipitale', 'Pilosité majoritairement claire', {
				scroll: 'up',
			});

			await expect(choice('Pilosité occipitale')).not.toBeVisible();
			await expectCandidatesCount(page, 118);
			await expectChoice('Forme de la tête', {
				value: 'Plus large que haute',
				power: 29,
				count: 118,
			});

			await expectMetadataValues(app, {
				pilosite_occipitale: null,
				forme_de_la_tete: 'pluslargeq_1738780492342_5503',
			});

			await choose(
				'Couleur de la face ventrale du flagelle antennaire',
				'Flagelle orange ventralement'
			);
			await choose('Taille du 3ème segment antennaire', 'A3 plus court que A4+5');
			await choose('Dépression des fovéas', 'Bien définie, fovéas creusées');
			await choose('Ligne centrale du clypéus', 'Sans ligne longitudinale');

			await expectMetadataValues(app, {
				pilosite_occipitale: null,
				couleur_de_la_face_ventrale_du_flagelle_antennaire: 'flagelleor_1738780660819_6814',
				depression_des_foveas: 'biendfinie_1738780813959_8479',
				forme_de_la_tete: 'pluslargeq_1738780492342_5503',
				ligne_centrale_du_clypeus: 'sanslignel_1738781166639_9542',
				taille_du_3eme_segment_antennaire: 'a3pluscour_1738780689285_1923',
			});

			// Try clearing an option by clicking on the x
			await page
				.getByRole('main')
				.getByRole('button', { name: 'Supprimer cette valeur', disabled: false })
				.first()
				.click();

			await expectMetadataValues(app, {
				pilosite_occipitale: null,
				couleur_de_la_face_ventrale_du_flagelle_antennaire: 'flagelleor_1738780660819_6814',
				depression_des_foveas: 'biendfinie_1738780813959_8479',
				forme_de_la_tete: 'pluslargeq_1738780492342_5503',
				ligne_centrale_du_clypeus: null,
				taille_du_3eme_segment_antennaire: 'a3pluscour_1738780689285_1923',
			});

			// Try clearing an option via the choices list

			await choice('Taille du 3ème segment antennaire')
				.getByRole('button', { name: 'Enlever ce choix' })
				.click();

			await expectMetadataValues(app, {
				pilosite_occipitale: null,
				couleur_de_la_face_ventrale_du_flagelle_antennaire: 'flagelleor_1738780660819_6814',
				depression_des_foveas: 'biendfinie_1738780813959_8479',
				forme_de_la_tete: 'pluslargeq_1738780492342_5503',
				ligne_centrale_du_clypeus: null,
				taille_du_3eme_segment_antennaire: null,
			});

			// Use reset button

			await page.getByRole('button', { name: 'Recommencer' }).click();

			await expectMetadataValues(app, {
				pilosite_occipitale: null,
				couleur_de_la_face_ventrale_du_flagelle_antennaire: null,
				depression_des_foveas: null,
				forme_de_la_tete: null,
				ligne_centrale_du_clypeus: null,
				taille_du_3eme_segment_antennaire: null,
			});

			expect(choices.getByRole('listitem')).toHaveCount(1);
			expect(choices).toHaveText(/Aucun choix effectué pour l'instant/);
		});

		testBasic('can search through metadata', async ({ page, app }) => {
			await page.getByRole('textbox', { name: 'Rechercher' }).fill('Pilosité');
			await page.getByRole('textbox', { name: 'Rechercher' }).blur();
			await expect(page.getByRole('search')).toHaveText(/38 résultats/);
			await expect(app.metadata.section('Taille')).not.toBeVisible();
			await expect(app.metadata.section('Pilosité occipitale')).toBeVisible();

			// With a typo
			await page.getByRole('textbox', { name: 'Rechercher' }).fill('fovéasss');
			await page.getByRole('textbox', { name: 'Rechercher' }).blur();
			await expect(page.getByRole('search')).toHaveText(/13 résultats/);
			await expect(app.metadata.section('Fovéas latérales du tergite 2')).toBeVisible();
			await expect(app.metadata.section('Pilosité occipitale')).not.toBeVisible();

			// No results case
			await page.getByRole('textbox', { name: 'Rechercher' }).fill('skibidi');
			await page.getByRole('textbox', { name: 'Rechercher' }).blur();
			await expect(page.getByRole('search')).toHaveText(/0 résultats/);
			await expect(page.getByRole('main')).toHaveText(/Aucun résultat pour “skibidi”/);

			// Show all
			await page.getByRole('button', { name: 'Tout afficher' }).click();
			await expect(page.getByRole('textbox', { name: 'Rechercher' })).toHaveValue('');
			await expect(app.metadata.section('Taille')).toBeVisible();
			await expect(app.metadata.section('Pilosité occipitale')).toBeVisible();
		});
	});

	test.describe('candidates tab', () => {
		test.beforeEach(async ({ page, app }) => {
			await page.getByTestId('descriptors').hover({ force: true });
			await scrollAndClick(
				app.metadata.radio(
					'Couleur de la pilosité de la face',
					'Pilosité de la face différente',
					{ exact: false }
				)
			);
			await page.getByRole('tab', { name: 'Candidats' }).click();
			await app.path.wait('/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates');
		});

		testBasic('shows candidates that were narrowed down', async ({ page, app }) => {
			const names = [
				'Andrena gredana',
				'Andrena orbitalis',
				'Andrena brumanensis ',
				'Andrena synadelpha',
				'Andrena bucephala',
				'Andrena binominata ',
				'Andrena granulosa ',
				'Andrena fulvata ',
				'Andrena russula ',
				'Andrena rugulosa ',
				'Andrena afrensis ',
				'Andrena parviceps ',
				'Andrena limbata ',
				'Andrena rogenhoferi ',
				'Andrena chrysopus ',
				'Andrena mucida ',
				'Andrena pauxilla',
			];

			await page.getByRole('main').hover();
			for (const name of names) {
				await scrollIntoViewVirtualized(page.getByRole('main').getByText(name));
			}

			const species = page.getByRole('main').getByText('Andrena fulvata');
			await scrollIntoViewVirtualized(species, 'up');
			await species.hover();
			await page.getByRole('button', { name: 'Choisir' }).click();

			await expectMetadataValues(app, {
				largeur_des_foveas_dorsalement: 'fovatrstro_1738780852057_7781',
				divergeance_des_foveas: 'nedivergea_1738780918546_5646',
				forme_des_foveas_au_milieu: 'fovasnonrt_1738780949142_3244',
				ligne_centrale_du_clypeus: 'avecunelig_1738781162379_975',
				aspect_de_la_ligne_centrale_du_clypeus: 'moinsmarqu_1738781197223_2786',
				forme_de_lappendice_du_labre: 'enformedet_1738837442835_2826',
				reflets_de_la_tete_et_du_mesosome: 'sansreflet_1738781679769_4181',
				ride_du_pronotum: 'pronotumav_1738781708314_7333',
				forme_de_la_pilosite_du_scutum: 'piliforme_1738781807041_8905',
				corbeilles_du_propodeum: 'corbeilles_1738837562663_8904',
				aspect_de_la_marge_des_tergites: 'margesdest_1738783146593_949',
				type_de_pilosite_des_scopas: 'pilositmaj_1738784759008_2070',
				forme_de_leperon_interne_du_tibia_3: 'perondutib_1738837728807_5472',
				longueur_de_la_face: 'faceetpice_1738780627912_5962',
				diagnose_a_fulva: 'thoraxetab_1763132717229_3725',
				largeur_de_la_marge_du_tergite_2: 't2avecunem_1738784182703_8707',
				echancrure_de_la_plaque_pygidiale: 'alapexnonc_1738784313047_3618',
				couleur_de_la_pilosite_bordant_la_plaque_pygidiale: 'plaquepygi_1738784378366_3042',
				nombre_de_cellules_cubitales: '3_1738784490337_8950',
				identification_rapide: 'aucunedece_1774517089291_6062',
				genus: '1345710',
				family: '7901',
				order: '1457',
				class: '216',
				phylum: '54',
				kingdom: '1',
			});

			const speciesChoice = page.locator('aside').getByRole('listitem', { name: 'Espèce' });
			await expect(speciesChoice).toBeVisible();
			await expect(speciesChoice.getByRole('combobox')).toHaveValue('Andrena fulvata');

			await speciesChoice.getByRole('button', { name: 'Enlever ce choix' }).click();
			await expectMetadataValues(app, {
				species: null,
			});

			await page.getByRole('button', { name: 'Recommencer' }).click();
			await expect(page.getByRole('main').getByText('Andrena tenuistriata')).toBeVisible();
		});
	});
});

/**
 * Gets the "Confirmé" overlay that appears in the cropper view if the current image has been marked as confirmed through implicit means.
 */
function confirmedCropOverlay(page: Page) {
	return page.locator('.confirmed-overlay');
}
