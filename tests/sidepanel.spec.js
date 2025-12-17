import { issue } from './annotations.js';
import { expect, test } from './fixtures.js';
import {
	changeSessionProtocol,
	chooseFirstSession,
	firstObservationCard,
	loadDatabaseDump,
	setInferenceModels
} from './utils';

/**
 * @import { Page } from '@playwright/test';
 * @import { AppFixture } from './fixtures';
 */

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {AppFixture} param0.app
 * @param {'basic'|'kitchensink-protocol'} [param0.dump=basic] name of the database dump to load, without extension
 */
async function initialize({ page, app, dump = 'basic' }) {
	await loadDatabaseDump(page, `${dump}.devalue`);
	await app.settings.set({ showTechnicalMetadata: false });
	await chooseFirstSession(page);
	if (dump === 'kitchensink-protocol') await changeSessionProtocol(page, 'Kitchen sink');
	await setInferenceModels(page, { classify: 'Aucune inférence' });
	await app.tabs.go('classify');
	await page
		.getByText(dump === 'basic' ? 'lil-fella' : 'leaf', { exact: true })
		.click({ timeout: 10_000 });
}

/**
 *
 * @param {AppFixture} app
 * @param {string} key
 * @param {string} [observation]
 * @returns
 */
async function metadataValueInDatabase(app, key, observation = 'leaf') {
	return app.db.metadata.values({ observation }).then((metadata) => metadata[key]);
}

test('allows changing metadata values on import page', issue(440), async ({ page, app }) => {
	await initialize({ page, app, dump: 'kitchensink-protocol' });

	await page.getByTestId('goto-import').click();
	await page.waitForURL((u) => u.hash === '#/import');
	await firstObservationCard(page).click();
	await expect(page.getByTestId('sidepanel')).toBeVisible();

	// Set to True on image itself
	await expect(app.sidepanel.metadataSection('bool')).toMatchAriaSnapshot(`
	  - text: bool
	  - switch "":
	    - img
	  - button [disabled]:
	    - img
	`);
	await app.sidepanel.metadataSection('bool').getByRole('switch').click();
	await expect(app.sidepanel.metadataSection('bool').getByRole('switch')).toMatchAriaSnapshot(`
	  - switch "" [checked]:
	    - img
	`);

	// Set to False on observation
	await page.getByTestId('goto-classify').click();
	await page.waitForURL((u) => u.hash === '#/classify');
	await firstObservationCard(page).click();
	await app.sidepanel.metadataSection('bool').getByRole('switch').click();
	await app.sidepanel.metadataSection('bool').getByRole('switch').click();
	await app.sidepanel.metadataSection('bool').getByRole('switch').click();
	await expect(app.sidepanel.metadataSection('bool').getByRole('switch')).toMatchAriaSnapshot(`
	  - switch "":
	    - img
	`);

	// Expect image to be still True
	await page.getByTestId('goto-import').click();
	await page.waitForURL((u) => u.hash === '#/import');
	await firstObservationCard(page).click();
	await expect(app.sidepanel.metadataSection('bool')).toMatchAriaSnapshot(`
	  - text: bool
	  - switch "" [checked]:
	    - img
	  - text: Oui
	  - button:
	    - img
	`);
});

test('does not show technical metadata ', async ({ page, app }) => {
	await initialize({ page, app });
	await expect(
		page.getByText('io.github.cigaleapp.arthropods.example__crop', { exact: true })
	).toBeHidden();
});

test('can update a enum-type metadata with cascades', async ({ page, app }) => {
	await initialize({ page, app });

	const nthCombobox = (/** @type {number} */ n) =>
		page
			.getByTestId('sidepanel')
			.getByRole('combobox')
			.nth(n - 1);

	// Opening the combobox
	await nthCombobox(1).click();
	await expect(page.getByTestId('metadata-combobox-viewport')).toBeVisible();
	await expect.soft(page.getByTestId('metadata-combobox-viewport')).toMatchAriaSnapshot(`
	  - option /Entomobrya muscorum \\d+%/ [selected]:
	    - img
	    - text: ""
	    - code: /\\d+%/
	  - option /Dicyrtomina saundersi \\d+%/:
	    - text: ""
	    - code: /\\d+%/
	  - option "Allacma fusca 9%":
	    - text: ""
	    - code: 9%
	  - option "Pogonognathellus longicornis 5%":
	    - text: ""
	    - code: 5%
	  - option "Dicyrtomina ornata 4%":
	    - text: ""
	    - code: 4%
	  - option "Orchesella quinquefasciata 3%":
	    - text: ""
	    - code: 3%
	  - option "Entomobrya nivalis 2%":
	    - text: ""
	    - code: 2%
	  - option "Entomobrya superba 2%":
	    - text: ""
	    - code: 2%
	  - option "Caprainea marginata 2%":
	    - text: ""
	    - code: 2%
	  - heading "Entomobrya muscorum" [level=2]
	  - link "En savoir plus gbif.org":
	    - /url: https://gbif.org/species/2120749
	    - img
	    - text: ""
	    - code: gbif.org
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
	  - paragraph:
	    - emphasis: Métadonées mises à jour à la sélection de cette option
	`);

	// Hovering over another option
	await page
		.getByTestId('metadata-combobox-viewport')
		.getByText('Dicyrtomina saundersi 18%')
		.hover();
	await expect.soft(page.getByTestId('metadata-combobox-viewport')).toMatchAriaSnapshot(`
	  - option /Entomobrya muscorum \\d+%/ [selected]:
	    - img
	    - text: ""
	    - code: /\\d+%/
	  - option /Dicyrtomina saundersi \\d+%/:
	    - text: ""
	    - code: /\\d+%/
	  - option "Allacma fusca 9%":
	    - text: ""
	    - code: 9%
	  - option "Pogonognathellus longicornis 5%":
	    - text: ""
	    - code: 5%
	  - option "Dicyrtomina ornata 4%":
	    - text: ""
	    - code: 4%
	  - option "Orchesella quinquefasciata 3%":
	    - text: ""
	    - code: 3%
	  - option "Entomobrya nivalis 2%":
	    - text: ""
	    - code: 2%
	  - option "Entomobrya superba 2%":
	    - text: ""
	    - code: 2%
	  - option "Caprainea marginata 2%":
	    - text: ""
	    - code: 2%
	  - heading "Dicyrtomina saundersi" [level=2]
	  - link "En savoir plus gbif.org":
	    - /url: https://gbif.org/species/4536978
	    - img
	    - text: ""
	    - code: gbif.org
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
	      - row "Ordre Symphypleona":
	        - cell "Ordre"
	        - cell "Symphypleona"
	      - row "Famille Dicyrtomidae":
	        - cell "Famille"
	        - cell "Dicyrtomidae"
	      - row "Genre Dicyrtomina":
	        - cell "Genre"
	        - cell "Dicyrtomina"
	  - paragraph:
	    - emphasis: Métadonées mises à jour à la sélection de cette option
	`);

	// Selecting the other option
	await page
		.getByTestId('metadata-combobox-viewport')
		.getByText('Dicyrtomina saundersi 18%')
		.click();
	await expect.soft(app.sidepanel.metadataSection('Espèce')).toMatchAriaSnapshot(`
		  - text: Espèce
		  - combobox: Dicyrtomina saundersi
		  - button:
		    - img
		`);

	// Check the cascades
	await expect.soft(nthCombobox(2)).toMatchAriaSnapshot(`
	  - combobox: Dicyrtomina
	`);
	await expect.soft(nthCombobox(3)).toMatchAriaSnapshot(`
	  - combobox: Dicyrtomidae
	`);
	await expect.soft(nthCombobox(4)).toMatchAriaSnapshot(`
	  - combobox: Symphypleona
	`);
	await expect.soft(nthCombobox(5)).toMatchAriaSnapshot(`
	  - combobox: Collembola
	`);
	await expect.soft(nthCombobox(6)).toMatchAriaSnapshot(`
	  - combobox: Arthropoda
	`);
	await expect.soft(nthCombobox(7)).toMatchAriaSnapshot(`
	  - combobox: Animalia
	`);

	// Click out and back again
	await page.getByRole('main').click({ position: { x: 10, y: 10 } });
	await page.getByText('lil-fella', { exact: true }).click();
	await expect(app.sidepanel.metadataSection('Espèce')).toMatchAriaSnapshot(
		`
	  - text: Espèce
	  - combobox: Dicyrtomina saundersi
	  - button:
	    - img
	`
	);

	// Check database
	const metadata = await app.db.metadata.values({ observation: 'lil-fella' });

	expect(metadata).toEqual({
		...metadata,
		species: '4536978',
		genus: '2122281',
		family: '7217',
		order: '10730025',
		shoot_date: '2025-04-25T12:38:36.000Z',
		class: '10713444',
		phylum: '54',
		kingdom: '1'
	});
});

test.describe('can search in a enum-type metadata combobox', () => {
	test('by name', async ({ page, app }) => {
		await initialize({ page, app });
		await page.getByTestId('sidepanel').getByRole('combobox').first().fill('Dicyrt');

		await expect(page.getByTestId('metadata-combobox-viewport')).toMatchAriaSnapshot(`
		  - option "Dicyrtoma fusca 0.4%":
		    - text: ""
		    - code: 0.4%
		  - option "Dicyrtomina flavosignata 0.2%":
		    - text: ""
		    - code: 0.2%
		  - option "Dicyrtomina minuta 1%":
		    - text: ""
		    - code: 1%
		  - option "Dicyrtomina ornata 4%":
		    - text: ""
		    - code: 4%
		  - option /Dicyrtomina saundersi \\d+%/:
		    - text: ""
		    - code: /\\d+%/
		  - option "Dicyrtomina signata 0.3%":
		    - text: ""
		    - code: 0.3%
		  - option "Allacma fusca AKA Dicyrtoma fusca 9%":
		    - text: ""
		    - code: 9%
		  - heading "Entomobrya muscorum" [level=2]
		  - link "En savoir plus gbif.org":
		    - /url: https://gbif.org/species/2120749
		    - img
		    - text: ""
		    - code: gbif.org
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
		  - paragraph:
		    - emphasis: Métadonées mises à jour à la sélection de cette option
		`);
	});

	test('by synonym', async ({ page, app }) => {
		await initialize({ page, app });
		await page.getByTestId('sidepanel').getByRole('combobox').first().fill('desoria');
		await expect(page.getByTestId('metadata-combobox-viewport')).toMatchAriaSnapshot(`
		  - option "Isotoma riparia AKA Desoria riparia 0.4%":
		    - text: ""
		    - code: 0.4%
		  - option "Isotoma viridis AKA Desoria fusia 0.1%":
		    - text: ""
		    - code: 0.1%
		  - option "Isotomurus maculatus AKA Desoria riparia 1%":
		    - text: ""
		    - code: 1%
		  - option "Isotomurus palustris AKA Desoria riparia 0.1%":
		    - text: ""
		    - code: 0.1%
		  - option "Parisotoma notabilis AKA Desoria monticola 0.1%":
		    - text: ""
		    - code: 0.1%
		  - option "Vertagopus asiaticus AKA Desoria cylindrica 0.1%":
		    - text: ""
		    - code: 0.1%
		  - heading "Entomobrya muscorum" [level=2]
		  - link "En savoir plus gbif.org":
		    - /url: https://gbif.org/species/2120749
		    - img
		    - text: ""
		    - code: gbif.org
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
		  - paragraph:
		    - emphasis: Métadonées mises à jour à la sélection de cette option
		`);
	});
});

test('can update a boolean-type metadata', issue(216), async ({ page, app }) => {
	await initialize({ page, app, dump: 'kitchensink-protocol' });

	expect.soft(await metadataValueInDatabase(app, 'bool')).toBeUndefined();
	await expect
		.soft(app.sidepanel.metadataSection('bool').getByRole('switch'))
		.not.toHaveAttribute('aria-checked');

	await app.sidepanel.metadataSection('bool').getByRole('switch').click();

	await expect.soft(app.sidepanel.metadataSection('bool').getByRole('switch'))
		.toMatchAriaSnapshot(`
	  - switch "" [checked]:
	    - img
	`);
	expect.soft(await metadataValueInDatabase(app, 'bool')).toBe(true);

	await app.sidepanel.metadataSection('bool').getByRole('switch').click();

	await expect.soft(app.sidepanel.metadataSection('bool').getByRole('switch'))
		.toMatchAriaSnapshot(`
	  - switch "":
	    - img
	`);
	expect.soft(await metadataValueInDatabase(app, 'bool')).toBe(false);
});

test('shows crop-type metadata as non representable', async ({ page, app }) => {
	await initialize({ page, app, dump: 'kitchensink-protocol' });

	await expect(app.sidepanel.metadataSection('crop')).toMatchAriaSnapshot(`
	  - text: crop
	  - img
	  - paragraph: Irreprésentable
	  - button [disabled]:
	    - img
	`);
});

test('can update a date-type metadata', async ({ page, app }) => {
	await initialize({ page, app, dump: 'kitchensink-protocol' });

	const dateSection = app.sidepanel.metadataSection('date');
	await expect(dateSection.getByRole('textbox')).toHaveValue('');

	await dateSection.getByRole('textbox').fill('2025-05-01');

	await expect(dateSection.getByRole('textbox')).toHaveValue('2025-05-01');
	expect(await metadataValueInDatabase(app, 'date')).toBe('2025-05-01T00:00:00');
});

test('can update a float-type metadata', async ({ page, app }) => {
	await initialize({ page, app, dump: 'kitchensink-protocol' });

	const floatSection = app.sidepanel.metadataSection('float');
	await expect(floatSection.getByRole('textbox')).toHaveValue('');

	await floatSection.getByRole('textbox').fill('3.14');
	await floatSection.getByRole('textbox').blur();
	await floatSection.getByRole('button', { name: 'Incrémenter' }).click();

	await expect(floatSection.getByRole('textbox')).toHaveValue('4.14');
	expect(await metadataValueInDatabase(app, 'float')).toBe(4.14);
});

test('can update a integer-type metadata', async ({ page, app }) => {
	await initialize({ page, app, dump: 'kitchensink-protocol' });

	const integerSection = app.sidepanel.metadataSection('integer');
	await expect(integerSection.getByRole('textbox')).toHaveValue('');

	await integerSection.getByRole('textbox').fill('42');
	await integerSection.getByRole('textbox').blur();
	await integerSection.getByRole('button', { name: 'Décrémenter' }).click();

	await expect(integerSection.getByRole('textbox')).toHaveValue('41');
	expect(await metadataValueInDatabase(app, 'integer')).toBe(41);
});

test('can update a string-type metadata', async ({ page, app }) => {
	await initialize({ page, app, dump: 'kitchensink-protocol' });

	const stringSection = app.sidepanel.metadataSection('string');
	await expect(stringSection.getByRole('textbox')).toHaveValue('');

	await stringSection.getByRole('textbox').fill('Hello world');
	await stringSection.getByRole('textbox').blur();

	await expect(stringSection.getByRole('textbox')).toHaveValue('Hello world');
	expect(await metadataValueInDatabase(app, 'string')).toBe('Hello world');
});
