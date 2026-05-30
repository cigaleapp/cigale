import type { AppFixture } from './fixtures.js';
import type { Page } from '@playwright/test';

import { ms } from 'convert';

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
					page
						.getByTestId('fullscreen-header')
						.getByRole('heading', { level: 1, name: lilFella.label, exact: true })
				).toBeVisible();

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
				      - row "Genre Entomobrya":
				        - cell "Genre"
				        - cell "Entomobrya"
				      - row "Famille Entomobryidae":
				        - cell "Famille"
				        - cell "Entomobryidae"
				      - row "Ordre Entomobryomorpha":
				        - cell "Ordre"
				        - cell "Entomobryomorpha"
				      - row "Classe Collembola":
				        - cell "Classe"
				        - cell "Collembola"
				      - row "Phylum Arthropoda":
				        - cell "Phylum"
				        - cell "Arthropoda"
				      - row "Règne Animalia":
				        - cell "Règne"
				        - cell "Animalia"
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
					.getByRole('heading', { level: 1 })
					.first();
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
	async function expectCandidatesCount(
		page: Page,
		count: number,
		options: { timeout?: number } = {}
	) {
		await expect(page.getByRole('tab', { name: 'Candidats' })).toHaveText(
			new RegExp(`${count}$`),
			options
		);
		await expect(page.getByTestId('remaining-candidates')).toHaveText(
			`${count} restants`,
			options
		);
	}

	/**
	 * Null to test for absence
	 */
	async function expectMetadataValues(
		app: AppFixture,
		values: Record<string, string | null>,
		hard = false
	) {
		// Wait a bit for changes to save to DB
		await app.wait('500ms');

		const db = await app.db.metadata.values({
			protocolId: lightweightProtocol.id,
			observation: 'with-exif-gps',
		});

		const ex = hard ? assert : expect;

		for (const [key, val] of Object.entries(values)) {
			if (val === null) {
				ex(db).not.toHaveProperty(key);
			} else {
				ex(db).toHaveProperty(key, val);
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
		await app.path.wait('/(app)/(sidepanel)/o/[observation]/classify/narrow/describe');
	});

	// TODO: more E2E testing
	test.describe('describe tab', () => {
		testBasic('can choose choices', async ({ page, app }) => {
			await expectCandidatesCount(page, 182, { timeout: ms('10s') });

			async function choose(
				metadata: string,
				name: string,
				{ scroll = 'down' }: { scroll?: 'up' | 'down' | 'no' } = {}
			) {
				const option = app.metadata.checkbox(metadata, name, { exact: false });
				if (scroll !== 'no') await scrollIntoViewVirtualized(option, scroll);
				await option.click({ force: true });
				await app.wait('2.5s');
			}

			// TODO
			// async function expectRemainingCandidate(label: string) {
			// 	const locator = page
			// 		.locator('aside')
			// 		.getByRole('list')
			// 		.getByRole('listitem', { name: new RegExp(`^${label} \\d+%$`) });

			// 	await scrollIntoViewVirtualized(locator);

			// 	await expect(locator).toBeVisible();
			// 	await expect(locator.getByRole('deletion')).not.toBeVisible();
			// }

			await choose('Identification rapide', 'Aucune de ces caractéristiques', {
				scroll: 'no',
			});

			await choose('Pilosité occipitale', 'Pilosité majoritairement claire');

			await expectCandidatesCount(page, 156);
			// await expectRemainingCandidate('')

			await choose('Forme de la tête', 'Plus large que haute');

			await expectCandidatesCount(page, 128);

			await expectMetadataValues(app, {
				pilosite_occipitale: 'pilositmaj_1738780459445_3719',
				forme_de_la_tete: 'pluslargeq_1738780492342_5503',
			});

			// Try clearing an option by clicking on it again

			await page.getByRole('tab', { name: 'Choix' }).click();
			await app.path.wait('/(app)/(sidepanel)/o/[observation]/classify/narrow/choices');

			await page.getByRole('group', { name: 'Pilosité occipitale' }).click();
			await app.wait('1s');
			await choose('Pilosité occipitale', 'Pilosité majoritairement claire');

			await expectMetadataValues(
				app,
				{
					pilosite_occipitale: null,
					forme_de_la_tete: 'pluslargeq_1738780492342_5503',
				},
				true
			);

			await page.getByRole('tab', { name: 'Décrire' }).click();
			await app.path.wait('/(app)/(sidepanel)/o/[observation]/classify/narrow/describe');

			await expectCandidatesCount(page, 136);

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

			// Try clearing an option in the choices tab

			await page.getByRole('tab', { name: 'Choix' }).click();
			await app.path.wait('/(app)/(sidepanel)/o/[observation]/classify/narrow/choices');

			await page.getByRole('group', { name: 'Ligne centrale du clypéus' }).click();

			await page
				.getByRole('main')
				.getByRole('button', { name: 'Supprimer cette valeur', disabled: false })
				.first()
				.click();

			await page.getByRole('tab', { name: 'Décrire' }).click();
			await app.path.wait('/(app)/(sidepanel)/o/[observation]/classify/narrow/describe');

			await expectMetadataValues(app, {
				pilosite_occipitale: null,
				couleur_de_la_face_ventrale_du_flagelle_antennaire: 'flagelleor_1738780660819_6814',
				depression_des_foveas: 'biendfinie_1738780813959_8479',
				forme_de_la_tete: 'pluslargeq_1738780492342_5503',
				ligne_centrale_du_clypeus: null,
				taille_du_3eme_segment_antennaire: 'a3pluscour_1738780689285_1923',
			});

			await expectCandidatesCount(page, 23);

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

			await expectCandidatesCount(page, 182);
		});

		testBasic('can search through metadata', async ({ page, app }) => {
			await page.getByRole('textbox', { name: 'Rechercher' }).fill('Pilosité');
			await page.getByRole('textbox', { name: 'Rechercher' }).blur();
			await expect(page.getByRole('search')).toHaveText(/38 résultats/);
			await expect(app.metadata.section('Identification rapide')).not.toBeVisible();
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
				app.metadata.checkbox('Corbeilles du propodéum', /^En vue latérale/),
				{ force: true }
			);
			await app.wait('2.5s');
			await page.getByRole('tab', { name: 'Candidats' }).click();
			await app.path.wait('/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates');
		});

		testBasic('shows candidates that were narrowed down', async ({ page, app }) => {
			const names = [
				'Andrena vetula',
				'Andrena antigana',
				'Andrena fuscipes',
				'Andrena dorsata',
				'Andrena congruens',
				'Andrena combinata',
				'Andrena thomsonii',
				'Andrena lepida',
				'Andrena propinqua',
				'Andrena confinis',
			];

			await page.getByRole('main').hover();
			for (const name of names) {
				await scrollIntoViewVirtualized(
					page.getByRole('main').getByRole('heading', { level: 2, name })
				);
			}

			await scrollAndClick(
				page.getByRole('main').getByRole('heading', { level: 2, name: 'Andrena vetula' }),
				{
					scroll: 'up',
				}
			);

			await app.modals
				.byTitle('Andrena vetula')
				.getByRole('button', { name: 'Choisir ce candidat' })
				.click();

			await expect(app.modals.byTitle('Andrena vetula')).not.toBeVisible();

			await expectMetadataValues(app, {
				densite_des_bandes_de_poils_des_tergites: 'pilositden_1738782981690_2927',
				depression_des_foveas: 'peuvisible_1738780816142_6205',
				identification_rapide: 'aucunedece_1774517089291_6062',
				regularite_de_la_ponctuation_du_scutum: 'scutumimpo_1738782016651_8814',
				aspect_du_clypeus: 'chagrinsur_1738781423480_7012',
				excavation_ventrale_du_mesepisternum: 'msepistern_1738782237571_3600',
				bandes_de_poils_des_tergites: 'prsenteset_1738782950734_6462',
				couleur_des_bandes_de_poils_des_tergites: 'bandesdepo_1738783054410_1229',
				densite_de_la_ponctuation_du_tergite_1: 'disquedut1_1738783850157_1486',
				face_posterieure_du_femur_3: 'facearrond_1738784590799_583',
				aspect_du_scutellum: 'mat_1738782208434_7944',
				forme_du_clypeus: 'clypusclai_1738781362065_7869',
				forme_de_leperon_interne_du_tibia_3: 'perondutib_1738837728807_5472',
				aspect_de_la_marge_des_tergites: 'margesdest_1738783146593_949',
				couleur_de_la_scopa_bicolore_des_tibias_3: 'scopasdest_1738784843423_7212',
				echancrure_de_la_plaque_pygidiale: 'alapexnonc_1738784313047_3618',
				cretes_transverses_du_clypeus: 'absentes_1738781227772_539',
				angle_humeral_du_pronotum: 'pronotumsa_1738781741393_7710',
				forme_du_bord_anterieur_du_clypeus: 'bordantrie_1738781485238_2295',
				forme_de_la_pilosite_du_scutum: 'piliforme_1738781807041_8905',
				diagnose_a_fulva: 'thoraxetab_1763132717229_3725',
				divergeance_des_foveas: 'nedivergea_1738780918546_5646',
				stries_longitudinales_du_clypeus: 'absentes_1738781134029_8838',
				pilosite_du_disque_des_tergites: 'disquesgla_1738782842914_8746',
				aspect_du_disque_des_tergites: 'fortementc_1738782710184_1247',
				ponctuation_du_propodeum: 'propodumpo_1738782437421_4476',
				taille_des_poils_de_la_scopa_des_tibias_3: 'scopadesti_1738784874548_6929',
				largeur_des_foveas_dorsalement: 'fovastrsla_1738780844874_734',
				reflets_de_la_tete_et_du_mesosome: 'sansreflet_1738781679769_4181',
				ligne_centrale_du_clypeus: 'sanslignel_1738781166639_9542',
				largeur_des_marges: 'margesdest_1738783177141_8874',
				couleur_de_la_face_ventrale_du_flagelle_antennaire: 'flagelleor_1738780660819_6814',
				aspect_de_la_surface_interne_du_triangle_du_propdeum:
					'surfaceint_1738782376741_6760',
				nombre_de_cellules_cubitales: '3_1738784490337_8950',
				ride_du_pronotum: 'pronotumav_1738781708314_7333',
				// couleur_des_marges_des_tergites: [
				// 	'apexdesmar_1738782673247_2164',
				// 	'apexdesmar_1738782675476_2563',
				// ],
				aspect_du_disque_du_tergite_1: 'disquedut1_1738783953470_7962',
				aspect_du_scutum: 'scutumunif_1738781976497_4798',
				pilosite_occipitale: 'pilositmaj_1738780461645_4261',
				depression_de_la_marge_des_tergites: 'tergitespa_1738783116041_318',
				taille_de_lappendice_du_labre: 'appendiced_1738837409603_218',
				forme_des_tibias_3: 'tibias3net_1738784652417_2290',
				ponctuation_de_la_marge_du_tergite_1: 'margenonpo_1738783988657_5201',
				longueur_de_la_face: 'faceetpice_1738780627912_5962',
				separation_des_aires_horizontales_et_verticales_du_propodeum:
					'propodumav_1738782515539_2243',
				continuite_des_bandes_de_poils_des_tergites: 'interrompu_1738783016497_2542',
				densite_de_la_ponctuation_du_disque_des_tergites: 'nonponctus_1738782739010_4162',
				forme_de_la_tete: 'aussilarge_1738780494459_7150',
				couleur_de_la_cuticule_du_tibia_3: 'foncnoir_b_1738784691415_4385',
				couleur_de_la_scopa_des_tibias_3: 'bicolore_1738784806316_8180',
				forme_des_foveas: 'fovasrtrci_1738780883007_5446',
				couleur_de_la_pilosite_de_la_face: 'pilositmaj_1738780525348_7702',
				couleur_des_tergites: 'noirssansr_1738782613180_8704',
				couleur_des_basitarses_3: 'foncsnoir_1738784728418_9571',
				taille_du_3eme_segment_antennaire: 'a3dpassant_1738780693605_2384',
				cretes_des_faces_laterales_du_propodeum: 'faceslatra_1738782473565_9266',
				longueur_des_foveas: 'fovaslongu_1738780977802_6832',
				forme_des_foveas_au_milieu: 'fovasnonrt_1738780949142_3244',
				aspect_du_mesepisternum_et_des_aires_laterales_du_propodeum:
					'msepistern_1738782299982_7773',
				// aspect_de_la_ponctuation_du_clypeus: [
				// 	'ponctuatio_1738781291580_4872',
				// 	'ponctuatio_1738781293693_2364',
				// ],
				forme_de_lappendice_du_labre: 'enformedet_1738837442835_2826',
				// densite_de_la_ponctuation_du_clypeus: [
				// 	'densmentpo_1738781258555_2079',
				// 	'ponctuatio_1738781260774_7579',
				// ],
				forme_de_la_plaque_pygidiale: 'plaquepygi_1738784280397_1841',
				corbeilles_du_propodeum: 'envuelatra_1738837557451_8267',
				type_de_pilosite_des_scopas: 'pilositmaj_1738784759008_2070',
				distance_occello_occipitale: 'distanceoc_1738780595154_4028',
				pilosite_des_mesopleures: 'longue_1738781774174_4840',
				taille_du_2eme_segment_antennaire: 'a2pluslong_1738780722156_8303',
				couleur_de_la_frange_terminale: 'foncenoir_1738784408817_6055',
				presence_de_gradulus_sur_les_tergites_2_3: 't2_3sansgr_1738783084860_3752',
				carene_du_triangle_du_propodeum: 'dlimitlatr_1738782333562_1312',
				genus: '1345710',
				family: '7901',
				order: '1457',
				class: '216',
				phylum: '54',
				kingdom: '1',
			});

			const speciesChoice = page.locator('aside').getByRole('region', { name: 'Espèce' });
			await expect(speciesChoice).toBeVisible();
			await expect(speciesChoice.getByRole('combobox')).toHaveValue('Andrena vetula');

			await speciesChoice.getByRole('button', { name: 'Enlever ce choix' }).click();
			await expectMetadataValues(app, {
				species: null,
			});

			await page.getByRole('button', { name: 'Recommencer' }).click();
			await expect(page.getByRole('main').getByText('Andrena gredana')).toBeVisible();
		});
	});
});

/**
 * Gets the "Confirmé" overlay that appears in the cropper view if the current image has been marked as confirmed through implicit means.
 */
function confirmedCropOverlay(page: Page) {
	return page.locator('.confirmed-overlay');
}
