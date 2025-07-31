import { expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import defaultProtocol from '../examples/arthropods.light.cigaleprotocol.json' assert { type: 'json' };

/**
 * @param {unknown} value
 */
function safeJSONParse(value) {
	try {
		return JSON.parse(value);
	} catch (e) {
		console.warn('Failed to parse JSON value:', value, e);
		return undefined; // Return the original value if parsing fails
	}
}

/**
 * @import { Page } from '@playwright/test';
 * @import { Settings, MetadataValue } from '$lib/database.js';
 */

/**
 *
 * @param {object} ctx
 * @param {Page} ctx.page
 * @param {...string} names paths relative to ./tests/fixtures. If no extension is provided, .jpeg is used
 */
export async function importPhotos({ page }, ...names) {
	if (!names) throw new Error('No file names provided');
	names = names.map((name) => (path.extname(name) ? name : `${name}.jpeg`));

	await expect(page.getByText('(.zip)')).toBeVisible();
	const fileInput = await page.$("input[type='file']");
	await fileInput?.setInputFiles(names.map((f) => path.join('./tests/fixtures', f)));
	await expect(page.getByText(names.at(-1), { exact: true })).toBeVisible({
		timeout: 20_000
	});
}

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {Partial<Settings>} newSettings
 */
export async function setSettings({ page }, newSettings) {
	await page.evaluate(async ([newSettings]) => {
		const settings = await window.DB.get('Settings', 'user').then(
			(settings) => settings ?? window.DB.get('Settings', 'defaults')
		);
		if (!settings) throw new Error('Settings not found in the database');
		await window.DB.put('Settings', { ...settings, id: 'user', ...newSettings });
		await window.refreshDB();
	}, /** @type {const} */ ([newSettings]));
}

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @returns {Promise<Settings>}
 */
export async function getSettings({ page }) {
	return page.evaluate(async () => {
		const settings = await window.DB.get('Settings', 'user').then(
			(settings) => settings ?? window.DB.get('Settings', 'defaults')
		);
		if (!settings) throw new Error('Settings not found in the database');
		return settings;
	});
}

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {string} id
 * @returns {Promise<typeof import('$lib/database').Schemas.Image.inferIn>}
 */
export async function getImage({ page }, id) {
	const image = await page.evaluate(async ([id]) => {
		const image = await window.DB.get('Image', id);
		if (!image) throw new Error(`Image ${id} not found in the database`);
		return image;
	}, /** @type {const} */ ([id]));
	return image;
}

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {string} param0.label
 * @returns {Promise<typeof import('$lib/database').Schemas.Observation.inferIn>}
 */
export async function getObservation({ page, label }) {
	const observation = await page.evaluate(async ([label]) => {
		const observations = await window.DB.getAll('Observation');
		return observations.find((obs) => obs.label === label);
	}, /** @type {const} */ ([label]));
	if (!observation) throw new Error(`Observation ${label} not found in the database`);
	return observation;
}

/**
 * Returns object mapping metadata keys to their (runtime, deserialized) values
 * @param {object} param0
 * @param {Page} param0.page
 * @param {string} [param0.protocolId] keep only metadata from this protocol, strip the prefix (namespace) from the keys in the returned object
 * @param {string} param0.image id of the image to get metadata from
 * @returns {Promise<Record<string, import('$lib/metadata').RuntimeValue>>}
 */
export async function getMetadataValuesOfImage({ page, protocolId, image }) {
	const { metadata } = await getImage({ page }, image);
	return Object.fromEntries(
		Object.entries(metadata)
			.filter(([id]) => (protocolId ? id.startsWith(`${protocolId}__`) : true))
			.map(([id, { value }]) => [
				protocolId ? id.replace(`${protocolId}__`, '') : id,
				safeJSONParse(value)
			])
	);
}

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {string} param0.protocolId
 * @param {string} param0.observation
 * @returns {Promise<Record<string, import('$lib/metadata').RuntimeValue>>}
 */
export async function getMetadataOverridesOfObservation({ page, protocolId, observation }) {
	const { metadataOverrides } = await getObservation({ page, label: observation });
	return Object.fromEntries(
		Object.entries(metadataOverrides)
			.filter(([id]) => (protocolId ? id.startsWith(`${protocolId}__`) : true))
			.map(([id, { value }]) => [
				protocolId ? id.replace(`${protocolId}__`, '') : id,
				safeJSONParse(value)
			])
	);
}

/**
 *
 * @param {Page} page
 * @param {string} observationLabelOrImageId
 * @param {string} metadataKey
 * @param {string} [protocolId]
 */
export async function getMetadataValue(
	page,
	observationLabelOrImageId,
	metadataKey,
	protocolId = defaultProtocol.id
) {
	if (/\d{6}_\d{6}/.test(observationLabelOrImageId)) {
		const metadata = await getMetadataValuesOfImage({
			page,
			image: observationLabelOrImageId,
			protocolId
		});
		return metadata[metadataKey];
	}

	const metadataOverrides = await getMetadataOverridesOfObservation({
		page,
		protocolId,
		observation: observationLabelOrImageId
	});

	return metadataOverrides[metadataKey];
}

/**
 *
 * @template {keyof typeof import('$lib/idb.svelte.js').tables} Table
 * @param {Page} page
 * @param {Table} tableName
 * @returns {Promise<typeof import('$lib/idb.svelte.js').tables[Table]['state']>}
 */
export async function listTable(page, tableName) {
	const table = await page.evaluate(async ([tableName]) => {
		const table = await window.DB.getAll(tableName);
		if (!table) throw new Error(`Table ${tableName} not found in the database`);
		return table;
	}, /** @type {const} */ ([tableName]));
	return table;
}

/**
 *
 * @param {object} param0
 * @param {Page} param0.page
 * @param {string} id
 * @param {Record<string, MetadataValue>} metadata
 * @param {object} options
 * @param {boolean} [options.refreshDB=true] whether to refresh the database after updating
 */
export async function setImageMetadata({ page }, id, metadata, { refreshDB = true } = {}) {
	await page.evaluate(async ([id, metadata, refreshDB]) => {
		const image = await window.DB.get('Image', id);
		if (!image) throw new Error(`Image ${id} not found in the database`);
		await window.DB.put('Image', {
			...image,
			metadata: {
				...image.metadata,
				...Object.fromEntries(
					Object.entries(metadata).map(([key, { value, ...rest }]) => [
						key,
						{ ...rest, value: JSON.stringify(value) }
					])
				)
			}
		});
		console.log('Image updated, refreshing DB', { id, metadata });
		if (refreshDB) await window.refreshDB();
	}, /** @type {const} */ ([id, metadata, refreshDB]));
}

/**
 *
 * @param {Page} page
 * @param {Record<string, string>} [models] names of tasks to names of models to select. use "la détection" for the detection model, and the metadata's labels for classification model(s)
 */
export async function chooseDefaultProtocol(page, models = {}) {
	// Choose default protocol
	await expect(page.getByTestId('protocol-to-choose')).toBeVisible({ timeout: 20_000 });
	await page.getByTestId('protocol-to-choose').click();
	if (models) {
		for (const [task, model] of Object.entries(models)) {
			await page
				.locator('.model-select', {
					hasText: `Modèle d'inférence pour ${task}`,
					has: page.locator('input[type="radio"]')
				})
				.getByRole('radio', { name: model })
				.check();
		}
	}
}

/**
 *
 * @param {Page} page
 * @param {'protocol'|'import'|'crop'|'classify'} tabName
 * @param {typeof import('../messages/fr.json')} [m] translations for the tab displayed names
 */
export async function goToTab(page, tabName, m = undefined) {
	const tabs = {
		protocol: { name: m?.protocol_tab ?? 'Protocole', hash: '#/protocol' },
		import: { name: m?.import_tab ?? 'Importer', hash: '#/import' },
		crop: { name: m?.crop_tab ?? 'Recadrer', hash: '#/crop' },
		classify: { name: m?.classify_tab ?? 'Classifier', hash: '#/classify' }
	};

	const tab = tabs[tabName];
	if (!tab) throw new Error(`Unknown tab: ${tabName}`);

	await page.getByTestId('app-nav').getByRole('link', { name: tab.name }).click();
	await page.waitForURL((u) => u.hash.replace(/\/$/, '') === tab.hash.replace(/\/$/, ''));
}

/**
 *
 * @param {Page} page
 * @param {string} filepath relative to tests/fixtures/
 */
export async function importProtocol(page, filepath) {
	const fileChooser = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Importer un protocole' }).click();
	await fileChooser.then((chooser) =>
		chooser.setFiles(path.join(import.meta.dirname, './fixtures', filepath))
	);
}

/**
 * @template {*} Leaf
 * @typedef {Array<Leaf | { [dir: string]: ArrayTree<Leaf> }>} ArrayTree
 */

/**
 *
 * @param {string} root
 * @returns {ArrayTree<string>}
 */
export function readdirTreeSync(root) {
	const result = [];
	const files = readdirSync(root, { withFileTypes: true });
	for (const file of files) {
		if (file.isDirectory()) {
			result.push({
				[file.name]: readdirTreeSync(path.join(root, file.name))
			});
		} else {
			result.push(file.name);
		}
	}

	return result.sort((a, b) => {
		// Sort folders before files
		if (typeof a === 'object' && typeof b === 'string') return -1;
		if (typeof a === 'string' && typeof b === 'object') return 1;
		if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
		return Object.keys(a)[0].localeCompare(Object.keys(b)[0]);
	});
}

/**
 *
 * @param {Page} page
 * @param {string|RegExp} message
 * @param {object} options
 * @param {boolean} [options.exact]
 * @param {undefined | import('$lib/toasts.svelte').Toast<null>['type']} [options.type]
 */
export function toast(page, message, { exact = false, type = undefined }) {
	const area = page.getByTestId('toasts-area');

	if (type) {
		return area.locator(`[data-type='${type}']`).getByText(message, { exact });
	}

	return area.getByText(message, { exact });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} filepath to the zip file, relative to tests/fixtures/exports
 * @param {object} [options]
 * @param {boolean} [options.waitForLoading] wait for loading to finish
 */
export async function importResults(page, filepath, { waitForLoading = true } = {}) {
	await setSettings({ page }, { showTechnicalMetadata: false });
	await chooseDefaultProtocol(page);
	await goToTab(page, 'import');
	// Import fixture zip
	await expect(page.getByText(/Cliquer ou déposer/)).toBeVisible();
	const fileInput = await page.$("input[type='file']");
	await fileInput?.setInputFiles(path.join('./tests/fixtures/exports/', filepath));
	if (waitForLoading) {
		await expect(page.getByText('Analyse…').first()).toBeVisible();
		await expect(page.getByText('Analyse…')).toHaveCount(0, { timeout: 30_000 });
	}
}

/**
 * Store a database dump in the fixtures/db directory
 * @param {import('@playwright/test').Page} page
 * @param {string} filepath relative to tests/fixtures/db
 */
export async function dumpDatabase(page, filepath) {
	const dest = path.join(import.meta.dirname, './fixtures/db/', filepath);

	const encodedDump = await page.evaluate(async () => {
		const tableNames = window.DB.objectStoreNames;
		const dump = {};
		for (const tableName of tableNames) {
			dump[tableName] = await window.DB.getAll(tableName);
		}
		return window.devalue.stringify(dump);
	});

	await mkdir(path.dirname(dest), { recursive: true });
	await writeFile(dest, encodedDump, 'utf-8');
}

/**
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} filepath relative to tests/fixtures/db
 */
export async function loadDatabaseDump(page, filepath = 'basic.devalue') {
	const location = path.join(import.meta.dirname, './fixtures/db/', filepath);

	await page.evaluate(
		async (dump) => {
			const decoded = window.devalue.parse(dump);
			for (const [tableName, entries] of Object.entries(decoded)) {
				await window.DB.clear(tableName);
				for (const entry of entries) {
					console.log('[loadDatabaseDump] Adding entry to', tableName, entry);
					await window.DB.put(tableName, entry);
				}
			}
			await window.refreshDB();
		},
		readFileSync(location, 'utf-8')
	);
}
