import { exampleProtocol, expect, test } from './fixtures.js';
import {
	chooseInDropdown,
	deleteSession,
	goToProtocolManagement,
	importPhotos,
	importProtocol,
	newSession,
	sessionMetadataSectionFor,
	setInferenceModels,
	switchSession
} from './utils/index.js';

test.describe('isolation', () => {
	test.beforeEach(() => {
		test.setTimeout(40_000);
	});
	test('no images from one session shows up in another', async ({ page, app }) => {
		await newSession(page, { name: 'Session α' });
		await app.tabs.go('import');
		await importPhotos({ page }, 'lil-fella.jpeg');
		await app.loading.wait();

		await newSession(page, { name: 'Session β' });
		await app.tabs.go('import');

		await expect(page.getByText('lil-fella.jpeg')).not.toBeVisible();

		await importPhotos({ page }, 'debugsquare.png');
		await app.loading.wait();

		await expect(page.getByText('debugsquare.png')).toBeVisible();
		await expect(page.getByText('lil-fella.jpeg')).not.toBeVisible();

		await switchSession(page, 'Session α');
		await app.tabs.go('import');

		await expect(page.getByText('lil-fella.jpeg')).toBeVisible();
		await expect(page.getByText('debugsquare.png')).not.toBeVisible();
	});

	test('deleting a session only deletes its images', async ({ page, app }) => {
		await newSession(page, { name: 'Session α' });
		await app.tabs.go('import');
		await importPhotos({ page }, 'lil-fella.jpeg');
		await app.loading.wait();
		await expect(page.getByText('lil-fella.jpeg')).toBeVisible();

		await newSession(page, { name: 'Session β' });
		await app.tabs.go('import');
		await importPhotos({ page }, 'debugsquare.png');
		await app.loading.wait();
		await expect(page.getByText('debugsquare.png')).toBeVisible();

		await deleteSession(page, 'Session α');
		await expect(page.getByText('Session α')).not.toBeVisible();

		await switchSession(page, 'Session β');
		await app.tabs.go('import');
		await expect(page.getByText('debugsquare.png')).toBeVisible();
		await expect(page.getByText('lil-fella.jpeg')).not.toBeVisible();
	});
});

test('import into new session', async ({ page, app }) => {
	await app.settings.set({ showTechnicalMetadata: false });
	const picker = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Importer un export .zip' }).click();
	await picker.then((picker) => {
		picker.setFiles('./tests/fixtures/exports/correct.zip');
	});
	await app.path.wait('/import');

	await expect(page.getByTestId('goto-current-session')).toHaveText('Testing session');

	await expect(page.getByText('cyan.jpeg')).toBeVisible();
	await expect(page.getByText('leaf.jpeg')).toBeVisible();
	await expect(page.getByText('lil-fella.jpeg')).toBeVisible();
	await expect(page.getByText('with-exif-gps.jpeg')).toBeVisible();
	await expect(page.locator('main article')).toHaveCount(4);

	await setInferenceModels(page, {
		crop: 'Aucune inférence',
		classify: 'Aucune inférence'
	});

	await app.tabs.go('crop');
	await expect(page.locator('main header > *').nth(2)).toHaveText('4 éléments');

	await app.tabs.go('classify');
	await page.getByText('cyan', { exact: true }).click();
	await expect(page.getByTestId('sidepanel').locator('> *').nth(2)).toMatchAriaSnapshot(`
	  - text: Espèce
	  - combobox: Allacma fusca
	  - code: /\\d+%/
	  - button:
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
	  - button:
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
	  - button:
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
	  - button:
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
	  - radiogroup:
	    - radio "C'est une photo de l'habitat actuel"
	    - text: C'est une photo de l'habitat actuel
	    - radio "C'est une photo de l'habitat à proximité"
	    - text: C'est une photo de l'habitat à proximité
	  - button [disabled]:
	    - img
	  - paragraph: Indique si cette photo est une photo de l'habitat. Laisser vide si ce n'est pas une photo d'habitat
	  - text: Date
	  - textbox "Date"
	  - button [disabled]:
	    - img
	  - paragraph: Moment où la photo a été prise
	  - text: Localisation
	  - textbox "Localisation"
	  - button [disabled]:
	    - img
	  - paragraph: Endroit où la photo a été prise
	  - text: Difficulté d'identification
	  - radiogroup:
	    - radio "Facile"
	    - text: Facile
	    - radio "Moyenne"
	    - text: Moyenne
	    - radio "Difficile"
	    - text: Difficile
	    - radio "Très difficile"
	    - text: Très difficile
	  - button [disabled]:
	    - img
	  - paragraph: Niveau de difficulté pour identifier l'espèce sur la photo
	  - text: Statut de conservation
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
	  - button [disabled]:
	    - img
	  - paragraph: Statut de conservation IUCN de l'espèce
	  - text: Classe
	  - combobox: Collembola
	  - code: /\\d+%/
	  - button:
	    - img
	  - text: Phylum
	  - combobox: Arthropoda
	  - code: /\\d+%/
	  - button:
	    - img
	  - text: Règne
	  - combobox: Animalia
	  - code: /\\d+%/
	  - button:
	    - img
	`);

	await page.getByTestId('goto-current-session').click();
	await app.path.wait('/(app)/sessions/[id]');
	// Check metadata set in the export
	await expect(
		sessionMetadataSectionFor(page, 'Durée de prospection').getByRole('textbox').first()
	).toHaveValue('54');
	await expect(
		sessionMetadataSectionFor(page, 'Vent')
			.getByRole('radiogroup')
			.getByRole('radio', { name: 'Modéré' })
	).toBeChecked();
	// Check that other metadata are unset
	await expect(
		sessionMetadataSectionFor(page, 'Distance de prospection').getByRole('textbox').first()
	).toBeEmpty();

	await expect(page.getByRole('textbox', { name: 'Description' })).toHaveValue(
		'Importée depuis correct.zip'
	);
});

test('changing metadata values saves them in the database', async ({ page, app }) => {
	await newSession(page, { name: 'Metadata session' });
	await page.getByTestId('goto-current-session').click();
	await app.path.wait('/(app)/sessions/[id]');

	/** @param {string} key */
	const metadataValueFor = async (key) =>
		app.db.metadata.values({ session: 'Metadata session' }).then((values) => values[key]);

	expect(await metadataValueFor('prospection_duration')).toBeUndefined();

	await sessionMetadataSectionFor(page, 'Durée de prospection')
		.getByRole('textbox')
		.first()
		.fill('120');

	await sessionMetadataSectionFor(page, 'Durée de prospection')
		.getByRole('textbox')
		.first()
		.blur();

	expect(await metadataValueFor('prospection_duration')).toBe(120);

	expect(await metadataValueFor('wind')).toBeUndefined();

	await sessionMetadataSectionFor(page, 'Vent')
		.getByRole('radiogroup')
		.getByRole('radio', { name: 'Fort' })
		.check();

	await page.waitForTimeout(500); // Wait for DB write

	expect(await metadataValueFor('wind')).toBe('strong');
});

test('changing session info saves in the database', async ({ page, app }) => {
	await newSession(page, { name: 'Test!!' });
	await page.getByTestId('goto-current-session').click();
	await app.path.wait('/(app)/sessions/[id]');

	const id = new URL(page.url()).pathname.split('/')[2];

	expect(await app.db.session.byId(id)).toMatchObject({
		id,
		name: 'Test!!',
		createdAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z/),
		openedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z/),
		description: '',
		protocol: exampleProtocol.id,
		metadata: {}
	});

	const nameInput = page.getByRole('textbox', { name: 'Nom de la session' });
	await nameInput.fill('New name');
	await nameInput.blur();

	expect(await app.db.session.byId(id)).toHaveProperty('name', 'New name');

	const descriptionInput = page.getByRole('textbox', { name: 'Description' });
	await descriptionInput.fill('A description');
	await descriptionInput.blur();

	expect(await app.db.session.byId(id)).toHaveProperty('description', 'A description');
});

test('can change protocol of session', async ({ page, app }) => {
	await app.settings.set({ showTechnicalMetadata: false });
	await goToProtocolManagement(page);
	await importProtocol(page, 'kitchensink.cigaleprotocol.yaml');
	await newSession(page, { name: 'Test' });

	await page.getByTestId('goto-current-session').click();
	await app.path.wait('/(app)/sessions/[id]');

	expect(await app.db.session.byName('Test')).toHaveProperty('protocol', exampleProtocol.id);

	await chooseInDropdown(
		page,
		page.getByRole('button', { name: 'Choisir un protocole' }),
		'Kitchen sink'
	);

	expect(await app.db.session.byName('Test')).toHaveProperty(
		'protocol',
		'io.github.cigaleapp.kitchensink'
	);

	await app.tabs.go('import');
	await importPhotos({ page }, 'cyan.jpeg');
	await app.loading.wait();
	await page.getByText('cyan.jpeg').click();
	await expect(page.getByTestId('sidepanel').locator('> *').nth(2)).toMatchAriaSnapshot(`
	  - text: bool
	  - switch:
	    - img
	  - button [disabled]:
	    - img
	  - paragraph: boolean metadata
	  - text: crop
	  - img
	  - paragraph: Irreprésentable
	  - button [disabled]:
	    - img
	  - text: date
	  - textbox "date"
	  - button [disabled]:
	    - img
	  - paragraph: date metadata
	  - text: enum
	  - radiogroup:
	    - radio "One Option 1"
	    - text: One
	    - paragraph: Option 1
	    - radio "Two Option 2"
	    - text: Two
	    - paragraph: Option 2
	  - button [disabled]:
	    - img
	  - paragraph: enum metadata
	  - text: float
	  - textbox "float"
	  - button "Décrémenter":
	    - img
	  - button "Incrémenter":
	    - img
	  - button [disabled]:
	    - img
	  - paragraph: float metadata
	  - text: integer
	  - textbox "integer"
	  - button "Décrémenter":
	    - img
	  - button "Incrémenter":
	    - img
	  - button [disabled]:
	    - img
	  - paragraph: integer metadata
	  - text: location
	  - textbox "location"
	  - button [disabled]:
	    - img
	  - paragraph: location metadata
	  - text: string
	  - textbox "string"
	  - button [disabled]:
	    - img
	  - paragraph: string metadata
	`);
});
