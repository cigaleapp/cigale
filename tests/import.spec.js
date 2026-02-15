import * as dates from 'date-fns';
import * as yauzl from 'yauzl-promise';

import { issue } from './annotations.js';
import { assert, test } from './fixtures.js';
import {
	chooseFirstSession,
	expectZipFiles,
	exportResults,
	firstObservationCard,
	importPhotos,
	importResults,
	loadDatabaseDump,
	loadingText,
	mockUrl,
	newSession,
	observationCard,
	setInferenceModels
} from './utils/index.js';

test.describe('correct results.zip', () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'exports/correct.zip');
	});

	test('has all the images', async ({ page }) => {
		await assert(page.getByText('lil-fella.jpeg', { exact: true })).toBeVisible();
		await assert(page.getByText('cyan.jpeg', { exact: true })).toBeVisible();
		await assert(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
		await assert(page.getByText('with-exif-gps.jpeg', { exact: true })).toBeVisible();
		await assert(page.getByText(/\.jpeg$/)).toHaveCount(4);
	});

	test('has the correct bounding boxes @webkit-no-parallelization', async ({ page, app }) => {
		await app.tabs.go('crop');

		/**
		 *
		 * @param {string} id
		 * @param {number} count
		 */
		async function expectBoundingBoxesCount(id, count) {
			await assert(
				page.locator(`[data-id='${id}']`).getByTestId('card-observation-bounding-box')
			).toHaveCount(count);
		}

		const images = await app.db.image
			.list()
			.then((images) => images.sort((a, b) => dates.compareAsc(a.addedAt, b.addedAt)));

		await expectBoundingBoxesCount(images[0].fileId ?? '', 1);
		await expectBoundingBoxesCount(images[1].fileId ?? '', 1);
		await expectBoundingBoxesCount(images[2].fileId ?? '', 1);
		await expectBoundingBoxesCount(images[3].fileId ?? '', 1);
	});

	test('does not re-analyze when going to classify tab @webkit-no-parallelization', async ({
		page,
		app
	}) => {
		await app.tabs.go('classify');
		await page.getByText('cyan', { exact: true }).click({
			timeout: 5_000
		});
		await assert(page.getByTestId('sidepanel')).toMatchAriaSnapshot(`
		  - complementary:
		    - img "Image 1 de l'observation cyan"
		    - heading "cyan" [level=2]:
		      - img
		      - textbox "Nom de l'observation":
		        - /placeholder: ""
		        - text: ""
		    - text: Espèce
		    - combobox: Allacma fusca
		    - code: /\\d+%/
		    - button "Supprimer cette valeur":
		      - img
		    - text: Alternatives
		    - list:
		      - listitem:
		        - text: Sminthurus viridis
		        - code: /\\d+%/
		        - button:
		          - img
		      - listitem:
		        - text: Bourletiella hortensis
		        - code: /\\d+%/
		        - button:
		          - img
		      - listitem:
		        - text: Sminthurides aquaticus
		        - code: 4%
		        - button:
		          - img
		    - text: Genre
		    - combobox: Allacma
		    - code: /\\d+%/
		    - button "Supprimer cette valeur":
		      - img
		    - text: Alternatives
		    - list:
		      - listitem:
		        - text: Bourletiella
		        - code: /\\d+%/
		        - button:
		          - img
		      - listitem:
		        - text: Sminthurus
		        - code: /\\d+%/
		        - button:
		          - img
		      - listitem:
		        - text: Willowsia
		        - code: 7%
		        - button:
		          - img
		    - text: Famille
		    - combobox: Sminthuridae
		    - code: /\\d+%/
		    - button "Supprimer cette valeur":
		      - img
		    - text: Alternatives
		    - list:
		      - listitem:
		        - text: Entomobryidae
		        - code: /\\d+%/
		        - button:
		          - img
		      - listitem:
		        - text: Bourletiellidae
		        - code: /\\d+%/
		        - button:
		          - img
		      - listitem:
		        - text: Isotomidae
		        - code: 6%
		        - button:
		          - img
		    - text: Ordre
		    - combobox: Symphypleona
		    - code: /\\d+%/
		    - button "Supprimer cette valeur":
		      - img
		    - text: Alternatives
		    - list:
		      - listitem:
		        - text: Entomobryomorpha
		        - code: /\\d+%/
		        - button:
		          - img
		      - listitem:
		        - text: Poduromorpha
		        - code: 5%
		        - button:
		          - img
		      - listitem:
		        - text: Neelipleona
		        - code: 0.8%
		        - button:
		          - img
		    - text: Photo d'habitat
		    - button "Supprimer cette valeur" [disabled]:
		      - img
		    - paragraph: Indique si cette photo est une photo de l'habitat. Laisser vide si ce n'est pas une photo d'habitat
		    - radiogroup:
		      - radio "C'est une photo de l'habitat actuel"
		      - text: C'est une photo de l'habitat actuel
		      - radio "C'est une photo de l'habitat à proximité"
		      - text: C'est une photo de l'habitat à proximité
		    - text: Date
		    - textbox "Date"
		    - button "Supprimer cette valeur" [disabled]:
		      - img
		    - paragraph: Moment où la photo a été prise
		    - text: Localisation
		    - combobox
		    - button "Supprimer cette valeur" [disabled]:
		      - img
		    - paragraph: Endroit où la photo a été prise
		    - region "Map"
		    - button "Zoom in"
		    - button "Zoom out" [disabled]
		    - button "Drag to rotate map, click to reset north"
		    - button "Find my location"
		    - button "Enter fullscreen"
		    - text: /\\d+ km/
		    - group:
		      - link "MapLibre":
		        - /url: https://maplibre.org/
		      - text: "| ©"
		      - link "CARTO":
		        - /url: https://carto.com/about-carto/
		      - text: ", ©"
		      - link "OpenStreetMap":
		        - /url: http://www.openstreetmap.org/about/
		      - text: contributors
		    - text: Difficulté d'identification
		    - button "Supprimer cette valeur" [disabled]:
		      - img
		    - paragraph: Niveau de difficulté pour identifier l'espèce sur la photo
		    - radiogroup:
		      - radio "Facile"
		      - text: Facile
		      - radio "Moyenne"
		      - text: Moyenne
		      - radio "Difficile"
		      - text: Difficile
		      - radio "Très difficile"
		      - text: Très difficile
		    - text: Statut de conservation
		    - button "Supprimer cette valeur" [disabled]:
		      - img
		    - paragraph: Statut de conservation IUCN de l'espèce
		    - radiogroup:
		      - radio "EX Éteint (“Extinct”)"
		      - text: EX
		      - paragraph: Éteint (“Extinct”)
		      - radio "EW Éteint à l’état sauvage (“Extinct in the Wild”)"
		      - text: EW
		      - paragraph: Éteint à l’état sauvage (“Extinct in the Wild”)
		      - radio "CR En danger critique d’extinction (“Critically Endangered”)"
		      - text: CR
		      - paragraph: En danger critique d’extinction (“Critically Endangered”)
		      - radio "EN En danger (“Endangered”)"
		      - text: EN
		      - paragraph: En danger (“Endangered”)
		      - radio "VU Vulnérable (“Vulnerable”)"
		      - text: VU
		      - paragraph: Vulnérable (“Vulnerable”)
		      - radio "NT Quasi menacé (“Near Threatened”)"
		      - text: NT
		      - paragraph: Quasi menacé (“Near Threatened”)
		      - radio "LC Préoccupation mineure (“Least Concern”)"
		      - text: LC
		      - paragraph: Préoccupation mineure (“Least Concern”)
		    - text: Classe
		    - combobox: Collembola
		    - code: /\\d+%/
		    - button "Supprimer cette valeur":
		      - img
		    - text: Phylum
		    - combobox: Arthropoda
		    - code: /\\d+%/
		    - button "Supprimer cette valeur":
		      - img
		    - text: Règne
		    - combobox: Animalia
		    - code: /\\d+%/
		    - button "Supprimer cette valeur":
		      - img
		    - button "Regrouper Ctrl + G":
		      - img
		      - text: ""
		    - button "Séparer Ctrl + Shift + G":
		      - img
		      - text: ""
		    - button "Ouvrir en plein écran Ctrl + ⏎":
		      - img
		      - text: ""
		    - button "Supprimer 1 images Suppr":
		      - img
		      - text: ""
		`);
	});

	test('exporting does not fail', async ({ page, app }) => {
		await app.tabs.go('results');
		const zip = await exportResults(page, { kind: 'full' });
		await expectZipFiles(zip, [
			'analysis.json',
			'metadata.csv',
			/^Cropped\/Allacma fusca_obs\d_1\.jpeg$/,
			/^Original\/Allacma fusca_obs\d_1\.jpeg$/,
			/^Cropped\/Orchesella cincta_obs\d_2\.jpeg$/,
			/^Original\/Orchesella cincta_obs\d_2\.jpeg$/,
			/^Cropped\/Entomobrya muscorum_obs\d_3\.jpeg$/,
			/^Original\/Entomobrya muscorum_obs\d_3\.jpeg$/,
			/^Cropped\/\(Unknown\)_obs\d_4\.jpeg$/,
			/^Original\/\(Unknown\)_obs\d_4\.jpeg$/
		]);
	});
});

test.describe('missing original photos', () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'exports/no-originals.zip', { waitForLoading: false });
	});

	test('fails with the appropriate error message', async ({ app }) => {
		await assert(app.toasts.byMessage('error', 'Aucune image trouvée')).toBeVisible();
	});
});

test.describe('missing analysis file', () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'exports/no-analysis.zip', { waitForLoading: false });
	});

	test('fails with the appriopriate error message', async ({ app }) => {
		await assert(app.toasts.byMessage('error', "Aucun fichier d'analyse")).toBeVisible();
	});
});

test.describe('wrong protocol used', () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'exports/wrong-protocol.zip', { waitForLoading: false });
	});

	test('fails with the appriopriate error message', async ({ app }) => {
		await assert(app.toasts.byMessage('error', 'le protocole de la session est')).toBeVisible();
	});
});

test.describe('invalid json analysis', async () => {
	test.beforeEach(async ({ page }) => {
		await importResults(page, 'exports/invalid-json-analysis.zip', { waitForLoading: false });
	});

	test('fails with the appriopriate error message', async ({ app }) => {
		await assert(app.toasts.byMessage('error', 'JSON')).toBeVisible();
	});
});

test('fails when importing a .CR2 image', issue(413), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'sample.cr2');
	await assert(page.getByText(/Analyse…|En attente/)).toHaveCount(0, {
		timeout: 5_000
	});
	await assert(firstObservationCard(page)).toHaveTooltip(
		/Les fichiers .+? ne sont pas (encore )?supportés/
	);
});

test('can import a large image', issue(412, 415), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'large-image.jpeg');
	await assert(page.getByText('large-image.jpeg')).toBeVisible({
		timeout: 10_000
	});
	await app.tabs.go('classify');
	await assert(page.getByText('large-image')).toBeVisible({
		timeout: 10_000
	});
});

test('cannot import an extremely large image', issue(412, 414), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, '20K-gray.jpeg');
	await app.loading.wait();
	await assert(firstObservationCard(page)).toHaveTooltip(
		/L'image est trop grande pour être traitée/
	);
});

test.fixme('can cancel import', issue(430), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page, wait: false }, [
		'lil-fella.jpeg',
		'cyan.jpeg',
		'leaf.jpeg',
		'with-exif-gps.jpeg'
	]);
	await assert(firstObservationCard(page)).toHaveText(loadingText, {
		timeout: 10_000
	});
	await page
		.locator('article', { hasText: 'lil-fella.jpeg' })
		.getByRole('button', { name: 'Supprimer' })
		.click();
	await assert(page.getByText('lil-fella.jpeg').first()).not.toBeVisible({
		timeout: 500
	});
});

test('can import in multiple batches', async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos(
		{ page, wait: false },
		['lil-fella.jpeg', 'leaf.jpeg'],
		['with-exif-gps.jpeg', '20K-gray.jpeg', 'debugsquare.png']
	);
	await assert(page.locator('main').getByText(/Analyse…|En attente/)).toHaveCount(0, {
		timeout: 60_000
	});
	await assert(page.locator('main').getByText('lil-fella.jpeg')).toBeVisible();
	await assert(page.locator('main').getByText('leaf.jpeg')).toBeVisible();
	await assert(page.locator('main').getByText('with-exif-gps.jpeg')).toBeVisible();
	await assert(page.locator('main').getByText('debugsquare.png')).toBeVisible();
	await assert(page.locator('main').locator('article.observation')).toHaveCount(5);
});

test(
	'deleting an image in the import tab does not create ghost observation cards',
	issue(439),
	async ({ page, app }) => {
		await loadDatabaseDump(page, 'db/basic.devalue');
		await chooseFirstSession(page);
		await setInferenceModels(page, { classify: 'Aucune inférence' });
		await app.tabs.go('classify');
		await app.tabs.go('import');
		await observationCard(page, 'cyan.jpeg').click();
		await page
			.getByTestId('sidepanel')
			.getByRole('button', { name: 'Supprimer 1 images Suppr' })
			.click();
		await app.tabs.go('classify');
		await assert(observationCard(page, 'cyan')).not.toBeVisible();
	}
);

test('cannot go to classify tab while detection is ongoing', issue(437), async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'lil-fella.jpeg', 'cyan.jpeg');

	// Now, we have at least one image loaded (so technically the classify tab should be accessible),
	// but the other image is still being analyzed.

	await app.tabs.go('crop');

	await assert(app.tabs.get('classify')).toBeDisabled({ timeout: 100 });

	// Once everything is done, make sure that we can go to the classify tab
	await app.loading.wait();

	await assert(app.tabs.get('classify')).toBeEnabled({ timeout: 1_000 });
	await app.tabs.go('classify');
});

test('can extract EXIF date from an image', async ({ page, app }) => {
	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'lil-fella.jpeg');
	await app.loading.wait();
	await firstObservationCard(page).click();
	await assert(app.sidepanel.metadataSection('Date').getByRole('textbox')).toHaveValue(
		'2025-04-25'
	);

	const metadataValues = await app.db.metadata.values({ image: 'lil-fella.jpeg' });

	assert(metadataValues).toMatchObject({
		...metadataValues,
		shoot_date: '2025-04-25T12:38:36'
	});
});

test('can extract EXIF GPS data from an image', async ({ page, context, app }) => {
	await mockUrl(
		page,
		context,
		'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=43.46715666666389&lon=11.885394999997223&addressdetails=0',
		{
			json: {
				place_id: 73806197,
				licence: 'Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright',
				osm_type: 'node',
				osm_id: 4797360321,
				lat: '43.4674527',
				lon: '11.8850787',
				category: 'tourism',
				type: 'viewpoint',
				place_rank: 30,
				importance: 0.00006763332570377688,
				addresstype: 'tourism',
				name: '',
				display_name: 'Via Madonna Laura, Arezzo, Toscane, 52100, Italie',
				boundingbox: ['43.4674027', '43.4675027', '11.8850287', '11.8851287']
			}
		}
	);

	await newSession(page);
	await app.tabs.go('import');
	await importPhotos({ page }, 'with-exif-gps.jpeg');
	await app.loading.wait();
	await firstObservationCard(page).click();
	await assert(app.sidepanel.metadataSection('Date').getByRole('textbox')).toHaveValue(
		'2008-10-22'
	);
	await assert(app.sidepanel.metadataSection('Localisation').getByRole('combobox')).toHaveValue(
		'Via Madonna Laura, Arezzo, Toscane, 52100, Italie'
	);

	const metadataValues = await app.db.metadata.values({ image: 'with-exif-gps.jpeg' });

	assert(metadataValues).toMatchObject({
		...metadataValues,
		shoot_date: '2008-10-22T16:29:49',
		shoot_location: {
			latitude: 43.46715666666389,
			longitude: 11.885394999997223
		}
	});
});
