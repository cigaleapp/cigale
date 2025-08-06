import { expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import defaultProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };

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
 * @param {boolean} [ctx.wait=true] whether to wait for the loading message to disappear
 * @param {...(string|string[])} names paths relative to ./tests/fixtures. If no extension is provided, .jpeg is used. Pass in arrays to import multiple files at once.
 */
export async function importPhotos({ page, wait = true }, ...names) {
	if (!names) throw new Error('No file names provided');

	/** @param {string} name */
	const addDotJpeg = (name) => (path.extname(name) ? name : `${name}.jpeg`);

	/** @param {string} name */
	const nameToPath = (name) => path.join('./tests/fixtures', addDotJpeg(name));

	await expect(page.getByText('(.zip)')).toBeVisible();
	const fileInput = await page.$("input[type='file']");

	// In case import order matters
	for (const name of names) {
		await fileInput?.setInputFiles(Array.isArray(name) ? name.map(nameToPath) : nameToPath(name));
	}

	if (wait) {
		let lastItem = names.at(-1);
		if (Array.isArray(lastItem)) lastItem = lastItem.at(-1);
		if (!lastItem) throw new Error('No last item to wait for');

		await expect(page.getByText(addDotJpeg(lastItem), { exact: true })).toBeVisible({
			timeout: 20_000
		});
	}
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
		window.refreshDB();
		const settings = await window.DB.get('Settings', 'user').then(
			(settings) => settings ?? window.DB.get('Settings', 'defaults')
		);
		if (!settings) throw new Error('Settings not found in the database');
		return settings;
	});
}

/**
 *
 * @param {{ page: Page }  & ({ id: string } | { filename: string })} param0
 * @returns {Promise<typeof import('$lib/database').Schemas.Image.inferIn>}
 */
export async function getImage({ page, ...query }) {
	const image = await page.evaluate(async ([query]) => {
		if ('id' in query) {
			const image = await window.DB.get('Image', query.id);
			if (!image) throw new Error(`Image ${query.id} not found in the database`);
			return image;
		} else {
			const images = await window.DB.getAll('Image');
			const image = images.find((i) => i.filename === query.filename);
			if (!image)
				throw new Error(`Image with filename ${query.filename} not found in the database`);
			return image;
		}
	}, /** @type {const} */ ([query]));
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
 * @param {string | {id: string} | {filename: string}} param0.image id of the image to get metadata from
 * @returns {Promise<Record<string, import('$lib/metadata').RuntimeValue>>}
 */
export async function getMetadataValuesOfImage({ page, protocolId, image }) {
	const { metadata } = await getImage({
		page,
		...(typeof image === 'string' ? { id: image } : image)
	});
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
 * @param {string} param0.observation label
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
 * @param {{image: {id: string} | {filename: string}} | {observation: string}} query
 * @param {string} metadataKey
 * @param {string} [protocolId]
 */
export async function getMetadataValue(page, query, metadataKey, protocolId = defaultProtocol.id) {
	if ('image' in query) {
		const metadata = await getMetadataValuesOfImage({
			page,
			image: query.image,
			protocolId
		});
		await browserConsole.log(
			page,
			'Metadata of image',
			query.image,
			'for protocol',
			protocolId,
			metadata
		);
		return metadata[metadataKey];
	}

	const metadataOverrides = await getMetadataOverridesOfObservation({
		page,
		protocolId,
		observation: query.observation
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
		window.refreshDB();
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
	await expect(page.getByText(/\(.zip\)/)).toBeVisible();
	const fileInput = await page.$("input[type='file']");
	await fileInput?.setInputFiles(path.join('./tests/fixtures/exports/', filepath));
	if (waitForLoading) {
		await expect(page.getByText(/Analyse|En attente…/).first()).toBeVisible({
			timeout: 30_000
		});
		await expect(page.getByText(/Analyse|En attente…/)).toHaveCount(0, { timeout: 30_000 });
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
			const orderedTables = Object.entries(decoded).sort(([a], [b]) =>
				// Load Protocol before everything else so that the default protocol does not start importing
				a === 'Protocol' ? -1 : b === 'Protocol' ? 1 : a.localeCompare(b)
			);
			for (const [tableName, entries] of orderedTables) {
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

export const browserConsole = {
	/**
	 * Log messages to the browser console
	 * @param {import('@playwright/test').Page} page
	 * @param {...any} args
	 */
	async log(page, ...args) {
		await page.evaluate(
			(args) => console.log(...args),
			args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg))
		);
	}
};

/**
 * @param {Page} page
 * @param {import('@playwright/test').Locator} locator
 */
export async function tooltipOf(page, locator) {
	await expect(locator).toHaveAttribute('aria-describedby', /tippy-\d+/, { timeout: 1_000 });
	const tippyId = await locator.getAttribute('aria-describedby');
	return page.locator(`#${tippyId}`);
}
