import { expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import defaultProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { Schemas } from '../src/lib/database.js';

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
 * @import { Page, Locator } from '@playwright/test';
 * @import { Settings, MetadataValue } from '$lib/database.js';
 */

/**
 *
 * @param {object} ctx
 * @param {Page} ctx.page
 * @param {boolean} [ctx.wait=true] whether to wait for the loading message to disappear
 * @param {number} [ctx.additionalWaitTime] wait additional milliseconds between each import (when names.length > 1)
 * @param {...(string|string[])} names paths relative to ./tests/fixtures. If no extension is provided, .jpeg is used. Pass in arrays to import multiple files at once.
 */
export async function importPhotos({ page, wait = true, additionalWaitTime = 0 }, ...names) {
	if (!names) throw new Error('No file names provided');

	/** @param {string} name */
	const addDotJpeg = (name) => (path.extname(name) ? name : `${name}.jpeg`);

	/** @param {string} name */
	const nameToPath = (name) => path.join('./tests/fixtures', addDotJpeg(name));

	await expect(page.getByText('(.zip)')).toBeVisible();

	// In case import order matters
	let i = -1;
	for (const name of names) {
		i++;

		const batch = Array.isArray(name) ? name.map(nameToPath) : nameToPath(name);

		// Once we have at least a card, the file input from the dropzone disappears
		if (i === 0) {
			const fileInput = await page.$("input[type='file']");
			await fileInput?.setInputFiles(batch);
		} else {
			const filePicker = page.waitForEvent('filechooser');
			await page.getByRole('button', { name: "Importer d'autres images" }).click();
			await filePicker.then((picker) => {
				picker.setFiles(batch);
			});
		}

		if (wait) await waitUntilLastAppears(name);
	}

	/**
	 *
	 * @param {string | Array<string | string[]>} names
	 */
	async function waitUntilLastAppears(names) {
		let lastItem = names;
		while (Array.isArray(lastItem)) {
			// @ts-expect-error
			lastItem = lastItem.at(-1);
			if (!lastItem) throw new Error('No last item to wait for');
		}

		const element = page.getByText(addDotJpeg(lastItem), { exact: true }).last();
		await expect(element).toBeVisible({
			timeout: 20_000
		});
		await expect(element).not.toHaveText(loadingText, {
			timeout: 20_000
		});

		if (additionalWaitTime) {
			await page.waitForTimeout(additionalWaitTime);
		}
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
		let maxAttempts = 100;
		let settings = await window.DB.get('Settings', 'user').then(
			(settings) => settings ?? window.DB.get('Settings', 'defaults')
		);

		while (!settings && maxAttempts-- > 0) {
			await new Promise((r) => setTimeout(r, 100));
			settings = await window.DB.get('Settings', 'user').then(
				(settings) => settings ?? window.DB.get('Settings', 'defaults')
			);
		}

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
	const raw = await page.evaluate(async () => {
		window.refreshDB();
		const settings = await window.DB.get('Settings', 'user').then(
			(settings) => settings ?? window.DB.get('Settings', 'defaults')
		);
		if (!settings) throw new Error('Settings not found in the database');
		return settings;
	});

	return Schemas.Settings.assert(raw);
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
		console.info('Image updated, refreshing DB', { id, metadata });
		if (refreshDB) await window.refreshDB();
	}, /** @type {const} */ ([id, metadata, refreshDB]));
}

/**
 * Opens a dropdown and chooses an item by its name
 * @param {Page} page
 * @param {string} dropdownTestId
 * @param {string | RegExp | ((options: Locator) => Locator)} option
 */
export async function chooseInDropdown(page, dropdownTestId, option) {
	const trigger = page.getByTestId(`${dropdownTestId}-open`);
	const options = page.getByTestId(`${dropdownTestId}-options`);

	await trigger.click();

	const item =
		typeof option === 'function'
			? option(options)
			: options.getByRole('menuitem', { name: option });

	await item.click();
	await page.keyboard.press('Escape'); // Close the dropdown
}

/**
 *
 * @param {Page} page
 * @param {string} [name]
 * @param {{ crop?: string, classify?: string }} [models] names of tasks to names of models to select. use "la détection" for the detection model, and the metadata's labels for classification model(s)
 */
export async function chooseProtocol(page, name, models = {}) {
	// Choose default protocol
	await chooseInDropdown(page, 'protocol-switcher', name ?? ((opts) => opts.first()));

	if (models) {
		for (const [task, model] of Object.entries(models)) {
			await chooseInDropdown(page, `${task}-models`, model);
		}
	}
}

/**
 *
 * @param {import('$lib/i18n').Language} lang
 */
const appNavTabs = (lang = 'fr') => ({
	import: { name: lang === 'fr' ? 'Importer' : 'Import', hash: '#/import' },
	crop: { name: lang === 'fr' ? 'Recadrer' : 'Crop', hash: '#/crop' },
	classify: { name: lang === 'fr' ? 'Classifier' : 'Classify', hash: '#/classify' }
});

/**
 *
 * @param {Page} page
 * @param {'import'|'crop'|'classify'} tabName
 * @param {object} [options]
 * @param {boolean} [options.waitForModel=true] wait for the model to be loaded (only for crop and classify)
 * @param {import('$lib/i18n').Language} [options.language=fr]
 */
export async function goToTab(page, tabName, { waitForModel = true, language = 'fr' } = {}) {
	getTab(page, tabName).click();
	const tab = appNavTabs(language)[tabName];
	await page.waitForURL((u) => u.hash.replace(/\/$/, '') === tab.hash.replace(/\/$/, ''));

	if (waitForModel && (tabName === 'crop' || tabName === 'classify')) {
		await expect(page.getByTestId('app-main')).not.toHaveText(
			makeRegexpUnion(
				tabName === 'crop'
					? 'Chargement du modèle de recadrage…'
					: 'Chargement du modèle de classification'
			),
			{
				timeout: 20_000
			}
		);
	}
}

/**
 *
 * @param {Page} page
 * @param {'import'|'crop'|'classify'} tabName
 * @param {'fr'|'en'} [language=fr]
 */
export function getTab(page, tabName, language = 'fr') {
	const tab = appNavTabs(language)[tabName];
	if (!tab) throw new Error(`Unknown tab: ${tabName}`);

	return page.getByTestId('app-nav').getByRole('link', { name: tab.name });
}

/**
 * Must already be on the /protocols management page
 * @param {Page} page
 * @param {string} filepath relative to tests/fixtures/
 */
export async function importProtocol(page, filepath) {
	const fileChooser = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Importer' }).click();
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
	await chooseProtocol(page);
	await goToTab(page, 'import');
	// Import fixture zip
	await expect(page.getByText(/\(.zip\)/)).toBeVisible();
	const fileInput = await page.$("input[type='file']");
	await fileInput?.setInputFiles(path.join('./tests/fixtures/exports/', filepath));
	if (waitForLoading) await waitForLoadingEnd(page);
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
					console.info('[loadDatabaseDump] Adding entry to', tableName, entry);
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
			// oxlint-disable-next-line no-console
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

/**
 * Hovers the locator, then asserts that it has a tooltip with content matching `content`.
 * Falls back to the element's data-tooltip-content attribute if the tooltip is not found.
 * @param {Page} page
 * @param {import('@playwright/test').Locator} locator
 * @param {string|RegExp} content
 */
export async function expectTooltipContent(page, locator, content) {
	await locator.hover({ force: true });
	try {
		const tooltip = await tooltipOf(page, locator);
		await expect(tooltip).toHaveText(content);
	} catch {
		await expect(locator).toHaveAttribute('data-tooltip-content', content);
	}
}

/**
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').BrowserContext} context
 * @param {string} source
 * @param {{json: object} | {body: string | Buffer}} mockedResult
 */
export async function mockProtocolSourceURL(page, context, source, mockedResult) {
	await Promise.all(
		// Context: service workers. Page: regular fetch() requests (for browsers that don't support service worker instrumentation)
		[context, page].map(async (target) =>
			target.route(
				(u) => {
					u.searchParams.delete('v');
					return u.toString() === source;
				},
				async (route) => route.fulfill(mockedResult)
			)
		)
	);
}

/**
 *
 * @param {Page} page
 * @param {string} modalTitle
 */
export function modal(page, modalTitle) {
	return page.getByRole('dialog').filter({
		has: page.getByRole('banner').getByRole('heading', {
			name: modalTitle,
			exact: true
		})
	});
}

/**
 *
 * @param {Page} page
 * @param {Parameters<import('playwright').Locator['click']>[0]} [clickOptions]
 */
export function openSettings(page, clickOptions) {
	return page.getByTestId('settings-button').click(clickOptions);
}

/**
 * @param {...string} parts
 */
export function makeRegexpUnion(...parts) {
	return new RegExp(
		parts
			.filter((t) => {
				if (!/^[\p{Letter} …]+$/u.test(t)) {
					throw new Error(
						`The loading text "${t}" contains special characters and cannot be used in a RegExp`
					);
				}

				return true;
			})
			.join('|')
	);
}

export const loadingText = makeRegexpUnion('Chargement…', 'Analyse…', 'En attente');

export const loadingNotQueuedText = makeRegexpUnion('Chargement…', 'Analyse…');

/**
 *
 * @param {Locator | Page} area
 * @param {{ begin?: number, finish?: number, concurrency?: number } | number} [timeout]
 */
export async function waitForLoadingEnd(area, timeout = 30_000) {
	const concurrency = typeof timeout === 'number' ? 1 : (timeout.concurrency ?? 1);
	const timeouts =
		typeof timeout === 'number'
			? { begin: timeout, finish: timeout }
			: { begin: 30_000, finish: 120_000, ...timeout };

	await expect(area.getByText(loadingText).first()).toBeVisible({ timeout: timeouts.begin });

	if (concurrency > 1) {
		// Ensure we have multiple (concurrency amount) loading items occurring at once (really loading, not just queued)
		await expect(area.getByText(loadingNotQueuedText)).toHaveCount(concurrency, {
			timeout: timeouts.begin
		});
	}

	await expect(area.getByText(loadingText)).toHaveCount(0, { timeout: timeouts.finish });
}

/**
 * @param {Page} page
 * @param {string} nameOrDescription
 */
export function sidepanelMetadataSectionFor(page, nameOrDescription) {
	return page
		.getByTestId('sidepanel')
		.locator('section')
		.filter({ hasText: nameOrDescription })
		.first();
}

/**
 * @param {Page} page
 * @param {string} key
 * @param {string} [observationLabel='leaf']
 */
export async function metadataValueInDatabase(page, key, observationLabel = 'leaf') {
	return await getMetadataOverridesOfObservation({
		page,
		protocolId: 'io.github.cigaleapp.kitchensink',
		observation: observationLabel
	}).then((values) => values[key]);
}

/**
 * ⚠️ **Needs a navigation before taking effect**
 * @param {Page} page
 * @param {number} value
 */
export async function setHardwareConcurrency(page, value) {
	await page.addInitScript((value) => {
		const proto = Object.getPrototypeOf(navigator);
		Object.defineProperty(proto, 'hardwareConcurrency', {
			value,
			writable: false
		});
	}, value);
}

/**
 *
 * @param {Page} page
 * @returns
 */
export function firstObservationCard(page) {
	return page.getByTestId('observations-area').getByRole('article').first();
}
