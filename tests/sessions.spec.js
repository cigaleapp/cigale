import { tz } from '@date-fns/tz';
import { differenceInMinutes, format as formatDate } from 'date-fns';

import { assert, exampleProtocol, expect, test } from './fixtures.js';
import {
	chooseInDropdown,
	deleteSession,
	goToProtocolManagement,
	goToSessionPage,
	importPhotos,
	importProtocol,
	loadDatabaseDump,
	newSession,
	pickFiles,
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

		await assert(page.getByText('lil-fella.jpeg')).not.toBeVisible();

		await importPhotos({ page }, 'debugsquare.png');
		await app.loading.wait();

		await assert(page.getByText('debugsquare.png')).toBeVisible();
		await assert(page.getByText('lil-fella.jpeg')).not.toBeVisible();

		await switchSession(page, 'Session α');
		await app.tabs.go('import');

		await assert(page.getByText('lil-fella.jpeg')).toBeVisible();
		await assert(page.getByText('debugsquare.png')).not.toBeVisible();
	});

	test('deleting a session only deletes its images', async ({ page, app }) => {
		await newSession(page, { name: 'Session α' });
		await app.tabs.go('import');
		await importPhotos({ page }, 'lil-fella.jpeg');
		await app.loading.wait();
		await assert(page.getByText('lil-fella.jpeg')).toBeVisible();

		await newSession(page, { name: 'Session β' });
		await app.tabs.go('import');
		await importPhotos({ page }, 'debugsquare.png');
		await app.loading.wait();
		await assert(page.getByText('debugsquare.png')).toBeVisible();

		await deleteSession(page, 'Session α');
		await assert(page.getByText('Session α')).not.toBeVisible();

		await switchSession(page, 'Session β');
		await app.tabs.go('import');
		await assert(page.getByText('debugsquare.png')).toBeVisible();
		await assert(page.getByText('lil-fella.jpeg')).not.toBeVisible();
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

	await assert(page.getByTestId('goto-current-session')).toHaveText('Testing session');

	await assert(page.getByText('cyan.jpeg')).toBeVisible();
	await assert(page.getByText('leaf.jpeg')).toBeVisible();
	await assert(page.getByText('lil-fella.jpeg')).toBeVisible();
	await assert(page.getByText('with-exif-gps.jpeg')).toBeVisible();
	await assert(page.locator('main article')).toHaveCount(4);

	await setInferenceModels(page, {
		crop: 'Aucune inférence',
		classify: 'Aucune inférence'
	});

	await app.tabs.go('crop');
	await assert(page.locator('main header > *').nth(2)).toHaveText('4 éléments');

	await app.tabs.go('classify');
	await page.getByText('cyan', { exact: true }).click();
	await assert(page.getByTestId('sidepanel').locator('> *').nth(2)).toMatchAriaSnapshot(`
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
	`);

	await page.getByTestId('goto-current-session').click();
	await app.path.wait('/(app)/sessions/[id]');
	// Check metadata set in the export
	await assert(
		sessionMetadataSectionFor(page, 'Durée de prospection').getByRole('textbox').first()
	).toHaveValue('54');
	await assert(
		sessionMetadataSectionFor(page, 'Vent')
			.getByRole('radiogroup')
			.getByRole('radio', { name: 'Modéré' })
	).toBeChecked();
	// Check that other metadata are unset
	await assert(
		sessionMetadataSectionFor(page, 'Distance de prospection').getByRole('textbox').first()
	).toBeEmpty();

	await assert(page.getByRole('textbox', { name: 'Description' })).toHaveValue(
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

	assert(await metadataValueFor('prospection_duration')).toBeUndefined();

	await sessionMetadataSectionFor(page, 'Durée de prospection')
		.getByRole('textbox')
		.first()
		.fill('120');

	await sessionMetadataSectionFor(page, 'Durée de prospection')
		.getByRole('textbox')
		.first()
		.blur();

	assert(await metadataValueFor('prospection_duration')).toBe(120);

	assert(await metadataValueFor('wind')).toBeUndefined();

	await sessionMetadataSectionFor(page, 'Vent')
		.getByRole('radiogroup')
		.getByRole('radio', { name: 'Fort' })
		.check();

	await page.waitForTimeout(500); // Wait for DB write

	assert(await metadataValueFor('wind')).toBe('strong');
});

test('changing session info saves in the database', async ({ page, app }) => {
	await newSession(page, { name: 'Test!!' });
	await page.getByTestId('goto-current-session').click();
	await app.path.wait('/(app)/sessions/[id]');

	const id = new URL(page.url()).pathname.split('/')[2];

	assert(await app.db.session.byId(id)).toMatchObject({
		id,
		name: 'Test!!',
		createdAt: assert.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z/),
		openedAt: assert.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z/),
		description: '',
		protocol: exampleProtocol.id,
		metadata: {}
	});

	const nameInput = page.getByRole('textbox', { name: 'Nom de la session' });
	await nameInput.fill('New name');
	await nameInput.blur();

	assert(await app.db.session.byId(id)).toHaveProperty('name', 'New name');

	const descriptionInput = page.getByRole('textbox', { name: 'Description' });
	await descriptionInput.fill('A description');
	await descriptionInput.blur();

	assert(await app.db.session.byId(id)).toHaveProperty('description', 'A description');
});

test('can change protocol of session', async ({ page, app }) => {
	await app.settings.set({ showTechnicalMetadata: false });
	await goToProtocolManagement(page);
	await importProtocol(page, 'kitchensink.cigaleprotocol.yaml');
	await newSession(page, { name: 'Test' });

	await page.getByTestId('goto-current-session').click();
	await app.path.wait('/(app)/sessions/[id]');

	assert(await app.db.session.byName('Test')).toHaveProperty('protocol', exampleProtocol.id);

	await chooseInDropdown(
		page,
		page.getByRole('button', { name: 'Choisir un protocole' }),
		'Kitchen sink'
	);

	assert(await app.db.session.byName('Test')).toHaveProperty(
		'protocol',
		'io.github.cigaleapp.kitchensink'
	);

	await app.tabs.go('import');
	await importPhotos({ page }, 'cyan.jpeg');
	await app.loading.wait();
	await page.getByText('cyan.jpeg').click();
	await assert(page.getByTestId('sidepanel').locator('> *').nth(2)).toMatchAriaSnapshot(`
	  - text: bool
	  - switch:
	    - img
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - paragraph: boolean metadata
	  - text: crop
	  - img
	  - paragraph: Irreprésentable
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - text: date
	  - textbox "date"
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - paragraph: date metadata
	  - text: enum
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - paragraph: enum metadata
	  - radiogroup:
	    - radio "One Option 1"
	    - text: One
	    - paragraph: Option 1
	    - radio "Two Option 2"
	    - text: Two
	    - paragraph: Option 2
	  - text: float
	  - textbox "float"
	  - button "Décrémenter":
	    - img
	  - button "Incrémenter":
	    - img
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - paragraph: float metadata
	  - text: integer
	  - textbox "integer"
	  - button "Décrémenter":
	    - img
	  - button "Incrémenter":
	    - img
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - paragraph: integer metadata
	  - text: location
	  - combobox
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - paragraph: location metadata
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
	  - text: sidecar
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - paragraph: sidecar file
	  - code: ∞
	  - text: Aucun fichier
	  - button "Ajouter"
	  - text: string
	  - textbox "string"
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - paragraph: string metadata
	`);
});

test('session metadata form has default values', async ({ page, app }) => {
	await loadDatabaseDump(page, 'db/kitchensink-protocol.devalue');
	await app.settings.set({ showTechnicalMetadata: false });
	await newSession(page, { name: 'Test' });
	await page.getByTestId('app-nav').getByRole('link', { name: 'Test' }).click();
	await app.path.wait('/(app)/sessions/[id]');

	const session = await app.db.session.byName('Test');
	if (!session) throw new Error('Session not found');

	expect(differenceInMinutes(new Date(), new Date(session.createdAt))).toBeLessThan(5);

	await expect(page.getByRole('textbox', { name: 'Date du transect' })).toHaveValue(
		formatDate(session.createdAt, 'yyyy-MM-dd', {
			in: tz('Etc/UTC')
		})
	);
	await expect(page.getByRole('textbox', { name: 'Code du transect' })).toHaveValue(
		formatDate(session.createdAt, "yyyyMMddHHmm'AB'", {
			in: tz('Etc/UTC')
		})
	);

	await expect(page.getByRole('textbox', { name: 'ohio respect' })).toHaveValue('6.7');
	await expect(page.getByRole('textbox', { name: 'has no default' })).toHaveValue('');

	// Changing a value that another default value depends on

	await page.getByRole('textbox', { name: 'Date du transect' }).fill('2024-01-01');

	await expect(page.getByRole('textbox', { name: 'Code du transect' })).toHaveValue(
		'202401010000AB'
	);

	// Value should not change even if resolved default value changes if its value has been modified by the user

	await page.getByRole('textbox', { name: 'Code du transect' }).fill('custom code');

	await page.getByRole('textbox', { name: 'Date du transect' }).fill('2024-02-01');

	await expect(page.getByRole('textbox', { name: 'Code du transect' })).toHaveValue(
		'custom code'
	);
});

test('can set file-type metadata', async ({ page, app, browserName }) => {
	test.skip(
		browserName === 'webkit',
		'Unsupported on webkit, see https://stackoverflow.com/questions/59138045/error-indexeddb-error-preparing-blob-file-to-be-stored-in-object-store'
	);

	await loadDatabaseDump(page, 'db/kitchensink-protocol.devalue');
	await app.settings.set({ showTechnicalMetadata: false });
	await newSession(page, { name: 'Test' });
	await goToSessionPage(page);

	const metadataKey = 'io.github.cigaleapp.kitchensink__sessionwide_file';

	const fileMetadata = sessionMetadataSectionFor(page, 'Sessionwide file');

	// Make sure DB is clean
	assert(await app.db.count('MetadataValueFile')).toBe(0);

	/**
	 * @param {{size: number, type: string, name: string}} expected
	 */
	async function expectFileInDB(expected) {
		const session = await app.db.session.byName('Test');
		if (!session) throw new Error('Session not found');

		assert(session.metadata).toHaveProperty([metadataKey]);
		const fileId = String(JSON.parse(session.metadata[metadataKey].value));

		const file = await page.evaluate(async (fileId) => {
			const value = await window.DB.get('MetadataValueFile', fileId);
			if (!value) return;
			return {
				id: value.id,
				file: {
					name: value.file.name,
					type: value.file.type,
					size: value.file.size
				}
			};
		}, fileId);

		expect(file).toMatchObject({
			id: fileId,
			file: expected
		});
	}

	await expect(fileMetadata).toHaveText(/<1,2Mo/);
	await expect(fileMetadata).toHaveText(/Aucun fichier/);

	// Empty -> a file

	await pickFiles(fileMetadata.getByRole('button', { name: 'Ajouter' }), '20K-gray.jpeg');

	await expect(fileMetadata).toHaveText(/1,6\sMo/);
	await expect(fileMetadata.locator('code.size')).toHaveTooltip(
		'La taille maximale est de 1,2 Mo'
	);
	await expect(fileMetadata).toHaveText(/20K-gray\.jpeg/);
	await expect(fileMetadata.getByRole('img', { name: '20K-gray.jpeg' })).toHaveScreenshot();

	await page.waitForTimeout(500); // XXX: Wait for DB write

	await expectFileInDB({
		name: '20K-gray.jpeg',
		type: 'image/jpeg',
		size: 1_562_661
	});

	// A file -> another file

	await pickFiles(fileMetadata.getByRole('button', { name: 'Modifier' }), 'large-image.jpeg');

	await expect(fileMetadata).toHaveText(/792\sko/);
	await expect(fileMetadata).toHaveText(/large-image\.jpeg/);
	await expect(fileMetadata.getByRole('img', { name: 'large-image.jpeg' })).toHaveScreenshot();

	await page.waitForTimeout(500); // XXX: Wait for DB write

	// Old file should be deleted
	expect(await app.db.count('MetadataValueFile')).toBe(1);

	await expectFileInDB({
		name: 'large-image.jpeg',
		type: 'image/jpeg',
		size: 792_031
	});

	// A file -> empty

	await fileMetadata.getByRole('button', { name: 'Supprimer cette valeur' }).click();

	await expect(fileMetadata).toHaveText(/Aucun fichier/);
	await expect(fileMetadata).not.toHaveText(/large-image\.jpeg/);

	await page.waitForTimeout(500); // XXX: Wait for DB write

	// File should be deleted
	expect(await app.db.count('MetadataValueFile')).toBe(0);

	const session = await app.db.session.byName('Test');
	if (!session) throw new Error('Session not found');

	expect(session.metadata).not.toHaveProperty([metadataKey]);
});
