import { expect, test } from './fixtures.js';
import {
	chooseDefaultProtocol,
	getMetadataValuesOfImage,
	loadDatabaseDump,
	setSettings
} from './utils';

/**
 * @import { Page } from '@playwright/test';
 */

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {'basic'|'kitchensink-protocol'} [param0.dump=basic] name of the database dump to load, without extension
 * @param {string} [param0.observation="lil-fella"] name of the observation to open
 * @param {string} [param0.protocol] protocol to choose, if not the default one
 */
async function initialize({ page, dump = 'basic', protocol, observation = 'lil-fella' }) {
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

test('does not show technical metadata ', async ({ page }) => {
	await initialize({ page });
	await expect(
		page.getByText('io.github.cigaleapp.arthropods.example__crop', { exact: true })
	).toBeHidden();
});

test('can update a enum-type metadata with cascades', async ({ page }) => {
	initialize({ page });

	const nthCombobox = (/** @type {number} */ n) =>
		page
			.getByTestId('sidepanel')
			.getByRole('combobox')
			.nth(n - 1);

	// Opening the combobox
	await nthCombobox(1).click();
	await expect(page.getByTestId('metadata-combobox-viewport')).toBeVisible();
	await expect.soft(page.getByTestId('metadata-combobox-viewport')).toMatchAriaSnapshot(`
	  - option /Allacma fusca \\d+%/ [selected]:
	    - img
	    - code: /\\d+%/
	  - option /Dicyrtomina saundersi \\d+%/:
	    - code: /\\d+%/
	  - option "Dicyrtomina ornata 8%":
	    - code: 8%
	  - option "Anurida maritima"
	  - option "Bilobella aurantiaca"
	  - option "Bilobella braunerae"
	  - option "Bourletiella arvalis"
	  - option "Bourletiella hortensis"
	  - option "Brachystomella parvula"
	  - option "Caprainea marginata"
	  - option "Ceratophysella denticulata"
	  - heading "Allacma fusca" [level=2]
	  - link "En savoir plus gbif.org":
	    - /url: https://gbif.org/species/4537246
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
	      - row "└─ Famille Sminthuridae":
	        - cell "└─ Famille"
	        - cell "Sminthuridae"
	      - row "└─ Genre Allacma":
	        - cell "└─ Genre"
	        - cell "Allacma"
	  - paragraph:
	    - emphasis: Métadonées mise à jour à la sélection de cette option
	`);

	// Hovering over another option
	await page
		.getByTestId('metadata-combobox-viewport')
		.getByText('Dicyrtomina saundersi 26%')
		.hover();
	await expect.soft(page.getByTestId('metadata-combobox-viewport')).toMatchAriaSnapshot(`
	  - option /Allacma fusca \\d+%/ [selected]:
	    - img
	    - code: /\\d+%/
	  - option /Dicyrtomina saundersi \\d+%/:
	    - code: /\\d+%/
	  - option "Dicyrtomina ornata 8%":
	    - code: 8%
	  - option "Anurida maritima"
	  - option "Bilobella aurantiaca"
	  - option "Bilobella braunerae"
	  - option "Bourletiella arvalis"
	  - option "Bourletiella hortensis"
	  - option "Brachystomella parvula"
	  - option "Caprainea marginata"
	  - option "Ceratophysella denticulata"
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
		.getByText('Dicyrtomina saundersi 26%')
		.click();
	await expect
		.soft(page.locator('[data-testid="sidepanel"] .metadata:first-child'))
		.toMatchAriaSnapshot(
			`
	  - text: Espèce
	  - combobox: Dicyrtomina saundersi
	  - button:
	    - img
	`
		);

	// Check the cascades
	await expect.soft(nthCombobox(2)).toHaveText('Dicrytomina');
	await expect.soft(nthCombobox(3)).toHaveText('Dicrytomidae');
	await expect.soft(nthCombobox(4)).toHaveText('Symphypleona');
	await expect.soft(nthCombobox(5)).toHaveText('Collembola');
	await expect.soft(nthCombobox(6)).toHaveText('Arthropoda');
	await expect.soft(nthCombobox(7)).toHaveText('Animalia');

	// Click out and back again
	await page.locator('section').filter({ hasText: 'with-exif-gps' }).first().click();
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
	const metadata = await getMetadataValuesOfImage({
		page,
		protocolId: 'io.github.cigaleapp.arthropods.example.light',
		image: '000002_000000'
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

/**
 * @param {Page} page
 * @param {string} nameOrDescription
 */
function metadataSectionFor(page, nameOrDescription) {
	return page
		.getByTestId('sidepanel')
		.locator('section')
		.filter({ hasText: nameOrDescription })
		.first();
}

/**
 * @param {Page} page
 * @param {string} key
 */
async function metadataValue(page, key) {
	return await getMetadataValuesOfImage({
		image: '000001_000000',
		page,
		protocolId: 'io.github.cigaleapp.kitchensink'
	}).then((values) => values[key]);
}

test('can update a boolean-type metadata', async ({ page }) => {
	await initialize({
		page,
		dump: 'kitchensink-protocol',
		protocol: 'Kitchen sink',
		observation: 'leaf'
	});

	expect.soft(await metadataValue(page, 'bool')).toBeUndefined();
	await expect
		.soft(metadataSectionFor(page, 'bool').getByRole('switch'))
		.not.toHaveAttribute('aria-checked');

	await metadataSectionFor(page, 'bool').getByRole('switch').click();

	await expect.soft(metadataSectionFor(page, 'bool').getByRole('switch')).toMatchAriaSnapshot(`
	  - switch "on/off switch" [checked]:
	    - img
	`);
	expect.soft(await metadataValue(page, 'bool')).toBe(true);

	await metadataSectionFor(page, 'bool').getByRole('switch').click();

	await expect.soft(metadataSectionFor(page, 'bool').getByRole('switch')).toMatchAriaSnapshot(`
	  - switch "on/off switch":
	    - img
	`);
	expect.soft(await metadataValue(page, 'bool')).toBe(false);
});

test('shows crop-type metadata as non representable', async ({ page }) => {
	await initialize({ page, dump: 'kitchensink-protocol', observation: 'crop' });

	await expect(metadataSectionFor(page, 'crop')).toMatchAriaSnapshot('');
});

test('can update a date-type metadata', async ({ page }) => {
	await initialize({ page, dump: 'kitchensink-protocol', observation: 'crop' });

	const dateSection = metadataSectionFor(page, 'date');
	await expect(dateSection.getByRole('textbox')).toHaveValue('');

	await dateSection.getByRole('textbox').fill('2025-05-01T12:00:00.000Z');

	await expect(dateSection.getByRole('textbox')).toHaveValue('2025-05-01T12:00:00.000Z');
	expect(await metadataValue(page, 'date')).toBe('2025-05-01T12:00:00.000Z');
});
