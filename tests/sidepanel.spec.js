import { issue } from './annotations.js';
import { expect, test } from './fixtures.js';
import {
	chooseDefaultProtocol,
	getMetadataOverridesOfObservation,
	loadDatabaseDump,
	sidepanelMetadataSectionFor,
	metadataValueInDatabase,
	setSettings,
	firstObservationCard
} from './utils';

/**
 * @import { Page } from '@playwright/test';
 */

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {'basic'|'kitchensink-protocol'} [param0.dump=basic] name of the database dump to load, without extension
 * @param {string} [param0.observation] name of the observation to open
 * @param {string} [param0.protocol] protocol to choose, if not the default one
 */
async function initialize({
	page,
	dump = 'basic',
	protocol = dump === 'basic' ? undefined : 'Kitchen sink',
	observation = dump === 'basic' ? 'lil-fella' : 'leaf'
}) {
	await loadDatabaseDump(page, `${dump}.devalue`);

	await setSettings({ page }, { showTechnicalMetadata: false });
	if (protocol) {
		await page.getByRole('button', { name: protocol, exact: true }).click();
	} else {
		await chooseDefaultProtocol(page);
	}
	await page.getByTestId('goto-classify').click();
	await page.waitForURL((u) => u.hash === '#/classify');
	await page.getByText(observation, { exact: true }).click({ timeout: 10_000 });
}

test('allows changing metadata values on import page', issue(440), async ({ page }) => {
	await initialize({ page, dump: 'kitchensink-protocol' });

	await page.getByTestId('goto-import').click();
	await page.waitForURL((u) => u.hash === '#/import');
	await firstObservationCard(page).click();
	await expect(page.getByTestId('sidepanel')).toBeVisible();

	// Set to True on image itself
	await expect(sidepanelMetadataSectionFor(page, 'bool')).toMatchAriaSnapshot(`
	  - text: bool
	  - switch "":
	    - img
	  - button [disabled]:
	    - img
	`);
	await sidepanelMetadataSectionFor(page, 'bool').getByRole('switch').click();
	await expect(sidepanelMetadataSectionFor(page, 'bool').getByRole('switch')).toMatchAriaSnapshot(`
	  - switch "" [checked]:
	    - img
	`);

	// Set to False on observation
	await page.getByTestId('goto-classify').click();
	await page.waitForURL((u) => u.hash === '#/classify');
	await firstObservationCard(page).click();
	await sidepanelMetadataSectionFor(page, 'bool').getByRole('switch').click();
	await sidepanelMetadataSectionFor(page, 'bool').getByRole('switch').click();
	await sidepanelMetadataSectionFor(page, 'bool').getByRole('switch').click();
	await expect(sidepanelMetadataSectionFor(page, 'bool').getByRole('switch')).toMatchAriaSnapshot(`
	  - switch "":
	    - img
	`);

	// Expect image to be still True
	await page.getByTestId('goto-import').click();
	await page.waitForURL((u) => u.hash === '#/import');
	await firstObservationCard(page).click();
	await expect(sidepanelMetadataSectionFor(page, 'bool')).toMatchAriaSnapshot(`
	  - text: bool
	  - switch "" [checked]:
	    - img
	  - text: Oui
	  - button:
	    - img
	`);
});

test('does not show technical metadata ', async ({ page }) => {
	await initialize({ page });
	await expect(
		page.getByText('io.github.cigaleapp.arthropods.example__crop', { exact: true })
	).toBeHidden();
});

test('can update a enum-type metadata with cascades', async ({ page }) => {
	await initialize({ page });

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
	    - code: /\\d+%/
	  - option /Dicyrtomina saundersi \\d+%/:
	    - code: /\\d+%/
	  - option "Allacma fusca 9%":
	    - code: 9%
	  - option "Anurida maritima"
	  - option "Bilobella aurantiaca"
	  - option "Bilobella braunerae"
	  - option "Bourletiella arvalis"
	  - option "Bourletiella hortensis"
	  - option "Brachystomella parvula"
	  - option "Caprainea marginata"
	  - heading "Entomobrya muscorum" [level=2]
	  - link "En savoir plus gbif.org":
	    - /url: https://gbif.org/species/2120749
	    - img
	    - code: gbif.org
	  - table:
	    - rowgroup:
	      - row "Règne Animalia":
	        - cell "Règne"
	        - cell "Animalia"
	      - row "└─ Phylum Arthropoda":
	        - cell "└─ Phylum"
	        - cell "Arthropoda"
	      - row "└─ Classe Collembola":
	        - cell "└─ Classe"
	        - cell "Collembola"
	      - row "└─ Ordre Entomobryomorpha":
	        - cell "└─ Ordre"
	        - cell "Entomobryomorpha"
	      - row "└─ Famille Entomobryidae":
	        - cell "└─ Famille"
	        - cell "Entomobryidae"
	      - row "└─ Genre Entomobrya":
	        - cell "└─ Genre"
	        - cell "Entomobrya"
	  - paragraph:
	    - emphasis: Métadonées mise à jour à la sélection de cette option
	`);

	// Hovering over another option
	await page
		.getByTestId('metadata-combobox-viewport')
		.getByText('Dicyrtomina saundersi 18%')
		.hover();
	await expect.soft(page.getByTestId('metadata-combobox-viewport')).toMatchAriaSnapshot(`
	  - option /Entomobrya muscorum \\d+%/ [selected]:
	    - img
	    - code: /\\d+%/
	  - option /Dicyrtomina saundersi \\d+%/:
	    - code: /\\d+%/
	  - option "Allacma fusca 9%":
	    - code: 9%
	  - option "Anurida maritima"
	  - option "Bilobella aurantiaca"
	  - option "Bilobella braunerae"
	  - option "Bourletiella arvalis"
	  - option "Bourletiella hortensis"
	  - option "Brachystomella parvula"
	  - option "Caprainea marginata"
	  - heading "Dicyrtomina saundersi" [level=2]
	  - link "En savoir plus gbif.org":
	    - /url: https://gbif.org/species/4536978
	    - img
	    - code: gbif.org
	  - table:
	    - rowgroup:
	      - row "Règne Animalia":
	        - cell "Règne"
	        - cell "Animalia"
	      - row "└─ Phylum Arthropoda":
	        - cell "└─ Phylum"
	        - cell "Arthropoda"
	      - row "└─ Classe Collembola":
	        - cell "└─ Classe"
	        - cell "Collembola"
	      - row "└─ Ordre Symphypleona":
	        - cell "└─ Ordre"
	        - cell "Symphypleona"
	      - row "└─ Famille Dicyrtomidae":
	        - cell "└─ Famille"
	        - cell "Dicyrtomidae"
	      - row "└─ Genre Dicyrtomina":
	        - cell "└─ Genre"
	        - cell "Dicyrtomina"
	  - paragraph:
	    - emphasis: Métadonées mise à jour à la sélection de cette option
	`);

	// Selecting the other option
	await page
		.getByTestId('metadata-combobox-viewport')
		.getByText('Dicyrtomina saundersi 18%')
		.click();
	await expect.soft(page.locator('[data-testid="sidepanel"] .metadata:first-child'))
		.toMatchAriaSnapshot(`
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
	await expect(page.locator('[data-testid="sidepanel"] .metadata:first-child')).toMatchAriaSnapshot(
		`
	  - text: Espèce
	  - combobox: Dicyrtomina saundersi
	  - button:
	    - img
	`
	);

	// Check database
	const metadata = await getMetadataOverridesOfObservation({
		page,
		protocolId: 'io.github.cigaleapp.arthropods.example.light',
		observation: 'lil-fella'
	});

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

test('can search in a enum-type metadata combobox', async ({ page }) => {
	await initialize({ page });
	await page.getByTestId('sidepanel').getByRole('combobox').first().fill('Dicyrt');

	await expect(page.getByTestId('metadata-combobox-viewport')).toMatchAriaSnapshot(`
	  - option "Dicyrtoma fusca"
	  - option "Dicyrtomina flavosignata"
	  - option "Dicyrtomina minuta"
	  - option "Dicyrtomina ornata"
	  - option /Dicyrtomina saundersi \\d+%/:
	    - code: /\\d+%/
	  - option "Dicyrtomina signata"
	  - heading "Entomobrya muscorum" [level=2]
	  - link "En savoir plus gbif.org":
	    - /url: https://gbif.org/species/2120749
	    - img
	    - code: gbif.org
	  - table:
	    - rowgroup:
	      - row "Règne Animalia":
	        - cell "Règne"
	        - cell "Animalia"
	      - row "└─ Phylum Arthropoda":
	        - cell "└─ Phylum"
	        - cell "Arthropoda"
	      - row "└─ Classe Collembola":
	        - cell "└─ Classe"
	        - cell "Collembola"
	      - row "└─ Ordre Entomobryomorpha":
	        - cell "└─ Ordre"
	        - cell "Entomobryomorpha"
	      - row "└─ Famille Entomobryidae":
	        - cell "└─ Famille"
	        - cell "Entomobryidae"
	      - row "└─ Genre Entomobrya":
	        - cell "└─ Genre"
	        - cell "Entomobrya"
	  - paragraph:
	    - emphasis: Métadonées mise à jour à la sélection de cette option
	`);
});

test('can update a boolean-type metadata', issue(216), async ({ page }) => {
	await initialize({ page, dump: 'kitchensink-protocol' });

	expect.soft(await metadataValueInDatabase(page, 'bool')).toBeUndefined();
	await expect
		.soft(sidepanelMetadataSectionFor(page, 'bool').getByRole('switch'))
		.not.toHaveAttribute('aria-checked');

	await sidepanelMetadataSectionFor(page, 'bool').getByRole('switch').click();

	await expect.soft(sidepanelMetadataSectionFor(page, 'bool').getByRole('switch'))
		.toMatchAriaSnapshot(`
	  - switch "" [checked]:
	    - img
	`);
	expect.soft(await metadataValueInDatabase(page, 'bool')).toBe(true);

	await sidepanelMetadataSectionFor(page, 'bool').getByRole('switch').click();

	await expect.soft(sidepanelMetadataSectionFor(page, 'bool').getByRole('switch'))
		.toMatchAriaSnapshot(`
	  - switch "":
	    - img
	`);
	expect.soft(await metadataValueInDatabase(page, 'bool')).toBe(false);
});

test('shows crop-type metadata as non representable', async ({ page }) => {
	await initialize({ page, dump: 'kitchensink-protocol' });

	await expect(sidepanelMetadataSectionFor(page, 'crop')).toMatchAriaSnapshot(`
	  - text: crop
	  - img
	  - paragraph: Irreprésentable
	  - button [disabled]:
	    - img
	`);
});

test('can update a date-type metadata', async ({ page }) => {
	await initialize({ page, dump: 'kitchensink-protocol' });

	const dateSection = sidepanelMetadataSectionFor(page, 'date');
	await expect(dateSection.getByRole('textbox')).toHaveValue('');

	await dateSection.getByRole('textbox').fill('2025-05-01');

	await expect(dateSection.getByRole('textbox')).toHaveValue('2025-05-01');
	expect(await metadataValueInDatabase(page, 'date')).toBe('2025-05-01T00:00:00');
});

test('can update a float-type metadata', async ({ page }) => {
	await initialize({ page, dump: 'kitchensink-protocol' });

	const floatSection = sidepanelMetadataSectionFor(page, 'float');
	await expect(floatSection.getByRole('textbox')).toHaveValue('');

	await floatSection.getByRole('textbox').fill('3.14');
	await floatSection.getByRole('textbox').blur();
	await floatSection.getByRole('button', { name: 'Incrémenter' }).click();

	await expect(floatSection.getByRole('textbox')).toHaveValue('4.14');
	expect(await metadataValueInDatabase(page, 'float')).toBe(4.14);
});

test('can update a integer-type metadata', async ({ page }) => {
	await initialize({ page, dump: 'kitchensink-protocol' });

	const integerSection = sidepanelMetadataSectionFor(page, 'integer');
	await expect(integerSection.getByRole('textbox')).toHaveValue('');

	await integerSection.getByRole('textbox').fill('42');
	await integerSection.getByRole('textbox').blur();
	await integerSection.getByRole('button', { name: 'Décrémenter' }).click();

	await expect(integerSection.getByRole('textbox')).toHaveValue('41');
	expect(await metadataValueInDatabase(page, 'integer')).toBe(41);
});

test('can update a string-type metadata', async ({ page }) => {
	await initialize({ page, dump: 'kitchensink-protocol' });

	const stringSection = sidepanelMetadataSectionFor(page, 'string');
	await expect(stringSection.getByRole('textbox')).toHaveValue('');

	await stringSection.getByRole('textbox').fill('Hello world');
	await stringSection.getByRole('textbox').blur();

	await expect(stringSection.getByRole('textbox')).toHaveValue('Hello world');
	expect(await metadataValueInDatabase(page, 'string')).toBe('Hello world');
});
