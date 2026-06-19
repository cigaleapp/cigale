import { issue } from './annotations.js';
import { assert, expect, test } from './fixtures.js';
import { chooseFirstSession, setInferenceModels } from './utils/index.js';

test.use({ storageState: 'tests/fixtures/storage-states/basic.json' });

test.beforeEach(async ({ page, app }) => {
	await app.settings.set({ gallerySort: { direction: 'asc', key: 'filename' } });
	await chooseFirstSession(page);
	await setInferenceModels(page, { classify: 'Aucune inférence' });
	await app.tabs.go('classify');
});

test('allows merging and unrolling two observations', async ({ page, app }) => {
	const src = {
		lilfella: await observationImage(app, 'lil-fella').getAttribute('src'),
		cyan: await observationImage(app, 'cyan').getAttribute('src'),
	};
	if (!src.lilfella) throw new Error('Could not get lil-fella image src');
	if (!src.cyan) throw new Error('Could not get cyan image src');

	await assert(page.getByTestId('observations-area').locator('article')).toHaveCount(4);
	await app.gallery.select('lil-fella', 'cyan');

	await page.getByTestId('sidepanel').getByRole('button', { name: 'Regrouper' }).click();

	const imageIds = {
		lilfella: await app.db.image.byFilename('lil-fella.jpeg'),
		cyan: await app.db.image.byFilename('cyan.jpeg'),
	};

	if (!imageIds.lilfella) throw new Error('Could not get lil-fella image ID');
	if (!imageIds.cyan) throw new Error('Could not get cyan image ID');

	assert(await app.db.observation.byLabel('lil-fella')).toHaveProperty('images', [
		imageIds.lilfella.id,
		imageIds.cyan.id,
	]);

	await assert(page.getByTestId('observations-area').locator('article')).toHaveCount(3);
	await assert(app.gallery.card('lil-fella')).toMatchAriaSnapshot(`
		  - article:
		    - img "lil-fella"
		    - img
		    - heading "lil-fella" [level=2]
		    - button "2"
		`);
	await expect(observationImage(app, 'lil-fella')).toHaveAttribute('src', src.lilfella);

	await app.gallery.card('lil-fella').getByRole('button', { name: '2' }).click();

	await assert(page.getByTestId('observations-area').locator('article')).toHaveCount(5);
	await assert(app.gallery.card('cyan.jpeg')).toBeVisible();
	await assert(observationImage(app, 'cyan.jpeg')).toHaveAttribute('src', src.cyan);
	await assert(app.gallery.card('lil-fella.jpeg')).toBeVisible();
	await assert.soft(observationImage(app, 'lil-fella.jpeg')).toHaveAttribute('src', src.lilfella);
	await assert(app.gallery.card('lil-fella')).toBeVisible();

	await app.gallery.card('lil-fella').getByRole('button', { name: '2' }).click();

	await assert(page.getByTestId('observations-area').locator('article')).toHaveCount(3);
	await assert(app.gallery.card('cyan.jpeg')).not.toBeVisible();
	await assert(app.gallery.card('lil-fella.jpeg')).not.toBeVisible();
});

test('allows merging three observations', async ({ page, app }) => {
	await app.gallery.select('leaf', 'lil-fella', 'cyan');
	const leafImageSrc = await observationImage(app, 'leaf').getAttribute('src');
	if (!leafImageSrc) throw new Error('Could not get leaf image src');

	await page.getByTestId('sidepanel').getByRole('button', { name: 'Regrouper' }).click();

	const imageIds = {
		lilfella: await app.db.image.byFilename('lil-fella.jpeg'),
		cyan: await app.db.image.byFilename('cyan.jpeg'),
		leaf: await app.db.image.byFilename('leaf.jpeg'),
	};

	if (!imageIds.lilfella) throw new Error('Could not get lil-fella image ID');
	if (!imageIds.cyan) throw new Error('Could not get cyan image ID');
	if (!imageIds.leaf) throw new Error('Could not get leaf image ID');

	assert(await app.db.observation.byLabel('leaf')).toHaveProperty('images', [
		imageIds.leaf.id,
		imageIds.lilfella.id,
		imageIds.cyan.id,
	]);

	await assert(page.getByTestId('observations-area').locator('article')).toHaveCount(2);
	await assert(app.gallery.card('leaf')).toMatchAriaSnapshot(`
		  - article:
		    - img "leaf"
		    - img
		    - heading "leaf" [level=2]
		    - button "3"
		`);
	await assert(observationImage(app, 'leaf')).toHaveAttribute('src', leafImageSrc);
});

test('allows merging a second time into the same observation', async ({ page, app }) => {
	await app.gallery.select('lil-fella', 'cyan');
	await page.getByTestId('sidepanel').getByRole('button', { name: 'Regrouper' }).click();
	await app.gallery.selectMore('leaf');
	await page.getByTestId('sidepanel').getByRole('button', { name: 'Regrouper' }).click();
	await assert(page.getByTestId('observations-area').locator('article')).toHaveCount(2);
	await assert(app.gallery.card('lil-fella')).toMatchAriaSnapshot(`
	  - article:
	    - img "lil-fella"
	    - img
	    - heading "lil-fella" [level=2]
	    - button "3"
	`);
	const imageIds = {
		lilfella: await app.db.image.byFilename('lil-fella.jpeg'),
		cyan: await app.db.image.byFilename('cyan.jpeg'),
		leaf: await app.db.image.byFilename('leaf.jpeg'),
	};

	if (!imageIds.lilfella) throw new Error('Could not get lil-fella image ID');
	if (!imageIds.cyan) throw new Error('Could not get cyan image ID');
	if (!imageIds.leaf) throw new Error('Could not get leaf image ID');

	assert(await app.db.observation.byLabel('lil-fella')).toHaveProperty('images', [
		imageIds.lilfella.id,
		imageIds.cyan.id,
		imageIds.leaf.id,
	]);
});

test('can split merged observations', async ({ page, app }) => {
	await app.gallery.select('lil-fella', 'cyan');
	await page.getByTestId('sidepanel').getByRole('button', { name: 'Regrouper' }).click();
	await assert(page.getByTestId('observations-area').locator('article')).toHaveCount(3);
	await page.getByTestId('sidepanel').getByRole('button', { name: 'Séparer' }).click();

	await assert(page.getByTestId('observations-area').locator('article')).toHaveCount(4);
	await assert(app.gallery.card('lil-fella')).toBeVisible();
	await assert(app.gallery.card('cyan')).toBeVisible();
	await assert(app.gallery.card('leaf')).toBeVisible();
});

test('selecting multiple images', issue(1054), async ({ page, app }) => {
	await chooseFirstSession(page);
	await setInferenceModels(page, {
		classify: 'Aucune inférence',
	});
	await app.tabs.go('classify');

	// Set identification_difficulty on one of the observations
	await page.getByRole('article', { name: 'cyan' }).click();
	const medium = app.metadata.radio(/Difficulté d'identification/, 'Moyenne');
	await medium.scrollIntoViewIfNeeded();
	await medium.check({ force: true });
	await page.getByRole('article', { name: 'cyan' }).click();

	// Select multiple observations
	await app.gallery.select('cyan', 'leaf', 'lil-fella');
	await app.wait('500ms');
	// TODO: reintroduce when we don't have the ugly workaround that creates "cannot load protocol" error toasts at startup
	// see https://github.com/cigaleapp/cigale/blob/8d458fdd9b3743bcc5e3fbc9fb3ee279aa9826f4/tests/fixtures.ts#L419
	// await assert(app.toasts.byType('error')).not.toBeVisible();

	// Assert sidepanel content
	await assert(page.getByTestId('sidepanel')).toMatchAriaSnapshot(`
	  - complementary:
	    - img "Image 1 de la sélection"
	    - img "Image 2 de la sélection"
	    - img "Image 3 de la sélection"
	    - heading "3 observations" [level=2]
	    - text: Espèce
	    - combobox "Entomobrya muscorum"
	    - code: /\\d+%/
	    - img
	    - button "Supprimer cette valeur":
	      - img
	    - text: Suggestions
	    - list:
	      - listitem:
	        - text: Orchesella cincta
	        - code: /\\d+%/
	        - button:
	          - img
	      - listitem:
	        - text: Allacma fusca
	        - code: /\\d+%/
	        - button:
	          - img
	      - listitem:
	        - text: Dicyrtomina saundersi
	        - code: /\\d+%/
	        - button:
	          - img
	    - group:
	      - img
	      - text: Taxonomie
	      - paragraph: Classification taxonomique de l'espèce
	      - text: Genre
	      - combobox "Entomobrya"
	      - code: /\\d+%/
	      - img
	      - button "Supprimer cette valeur":
	        - img
	      - text: Suggestions
	      - list:
	        - listitem:
	          - text: Dicyrtomina
	          - code: /\\d+%/
	          - button:
	            - img
	        - listitem:
	          - text: Orchesella
	          - code: /\\d+%/
	          - button:
	            - img
	        - listitem:
	          - text: Allacma
	          - code: /\\d+%/
	          - button:
	            - img
	      - text: Famille
	      - combobox "Entomobryidae"
	      - code: /\\d+%/
	      - img
	      - button "Supprimer cette valeur":
	        - img
	      - text: Suggestions
	      - list:
	        - listitem:
	          - text: Sminthuridae
	          - code: /\\d+%/
	          - button:
	            - img
	        - listitem:
	          - text: Dicyrtomidae
	          - code: /\\d+%/
	          - button:
	            - img
	        - listitem:
	          - text: Orchesellidae
	          - code: /\\d+%/
	          - button:
	            - img
	      - text: Ordre
	      - combobox "Entomobryomorpha"
	      - code: /\\d+%/
	      - img
	      - button "Supprimer cette valeur":
	        - img
	      - text: Suggestions
	      - list:
	        - listitem:
	          - text: Symphypleona
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
	      - text: Classe
	      - combobox "Collembola"
	      - code: /\\d+%/
	      - button "Supprimer cette valeur":
	        - img
	      - text: Phylum
	      - combobox "Arthropoda"
	      - code: /\\d+%/
	      - button "Supprimer cette valeur":
	        - img
	      - text: Règne
	      - combobox "Animalia"
	      - code: /\\d+%/
	      - button "Supprimer cette valeur":
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
	    - textbox "Date": /\\d+-\\d+-\\d+/
	    - button "Supprimer cette valeur":
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
	    - button "Supprimer cette valeur":
	      - img
	    - paragraph: Niveau de difficulté pour identifier l'espèce sur la photo
	    - radiogroup:
	      - radio "Facile"
	      - text: Facile
	      - radio "Moyenne" [checked]
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
	    - group:
	      - img
	      - text: Andrènes
	    - button "Regrouper Ctrl + G":
	      - img
	      - text: ""
	    - button "Séparer Ctrl + Shift + G":
	      - img
	      - text: ""
	    - button "Ouvrir en plein écran Ctrl + ⏎" [disabled]:
	      - img
	      - text: ""
	    - button "Supprimer 3 images Suppr":
	      - img
	      - text: ""
	`);
});

/**
 *
 * @param {import('./fixtures.js').AppFixture} app
 * @param {string} observationTitle
 * @returns
 */
function observationImage(app, observationTitle) {
	return app.gallery.card(observationTitle).locator('img:not([data-is-blur="true"])');
}
