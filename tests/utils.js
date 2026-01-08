import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect } from '@playwright/test';

import { Schemas } from '../src/lib/database.js';
import { ExamplePaths, FixturePaths } from './filepaths.js';

/**
 * @import { Page, Locator } from '@playwright/test';
 * @import { Settings, MetadataValue } from '$lib/database.js';
 * @import {IDBDatabaseType} from '$lib/idb.svelte.js';
 */

/**
 *
 * @param {object} ctx
 * @param {Page} ctx.page
 * @param {boolean} [ctx.wait=true] whether to wait for the loading message to disappear
 * @param {number} [ctx.additionalWaitTime] wait additional milliseconds between each import (when names.length > 1)
 * @param {...(FixturePaths.Photos|FixturePaths.Photos[])} names paths relative to ./tests/fixtures. If no extension is provided, .jpeg is used. Pass in arrays to import multiple files at once.
 */
export async function importPhotos({ page, wait = true, additionalWaitTime = 0 }, ...names) {
	if (!names) throw new Error('No file names provided');

	/** @param {string} name */
	const nameToPath = (name) => path.join(FixturePaths.root, name);

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

		const element = page.getByText(lastItem, { exact: true }).last();
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
		window.refreshDB();
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
 * @template {import('idb').StoreNames<IDBDatabaseType>} Table
 * @template {keyof IDBDatabaseType[Table]['value']} Field
 * @param {Page} page
 * @param {Table} tableName
 * @param {Field} fieldName
 * @param {IDBDatabaseType[Table]['value'][Field]} fieldValue
 * @returns
 */
export async function getDatabaseRowByField(page, tableName, fieldName, fieldValue) {
	return page.evaluate(async ([tableName, fieldName, fieldValue]) => {
		const rows = await window.DB.getAll(tableName);
		return rows.find((r) => r[fieldName] === fieldValue);
	}, /** @type {const} */ ([tableName, fieldName, fieldValue]));
}

/**
 * @template {import('idb').StoreNames<IDBDatabaseType>} Table
 * @param {Page} page
 * @param {Table} tableName
 * @param {string} id
 */
export async function getDatabaseRowById(page, tableName, id) {
	return page.evaluate(async ([tableName, id]) => {
		return window.DB.get(tableName, id);
	}, /** @type {const} */ ([tableName, id]));
}

/**
 *
 * @template {import('idb').StoreNames<import('$lib/idb.svelte.js').IDBDatabaseType>} Table
 * @param {Page} page
 * @param {Table} tableName
 * @returns {ReturnType<typeof window.DB.getAll<Table>>}
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
			: options.getByRole('menuitemcheckbox', { name: option });

	await item.click();
	await page.keyboard.press('Escape'); // Close the dropdown
}

/**
 *
 * @param {Page} page
 * @param {object} [options]
 * @param {string} [options.protocol] name of protocol to use
 * @param {{ crop?: string, classify?: string }} [options.models] names of tasks to names of models to select. use "la détection" for the detection model, and the metadata's labels for classification model(s)
 * @param {string} [options.name] name of the session
 */
export async function newSession(page, { name, protocol, models = {} } = {}) {
	await goHome(page);
	await goToTab(page, 'sessions');
	// XXX: Wait until page is ready
	await page.waitForTimeout(500);

	await page.getByTestId('new-session').click();
	await page.waitForURL((u) => u.hash.startsWith('#/sessions/'));

	if (protocol) {
		await chooseInDropdown(page, 'protocol', protocol);
	}

	if (name) {
		const textbox = page.getByRole('textbox', { name: 'Nom de la session' });
		await textbox.fill(name);
		await textbox.blur();
	}

	await page.getByRole('button', { name: 'Ouvrir', exact: true }).click();
	await page.waitForURL((u) => u.hash === '#/import');

	if (models) {
		await setInferenceModels(page, models);
	}
}

/**
 *
 * @param {Page} page
 * @param {{ crop?: string, classify?: string }} models names of tasks to names of models to select. use "la détection" for the detection model, and the metadata's labels for classification model(s)
 */
export async function setInferenceModels(page, models) {
	for (const [task, model] of Object.entries(models)) {
		await chooseInDropdown(page, `${task}-models`, model);
	}
}

/**
 * @param {Page} page
 * @param {string} name
 */
export async function switchSession(page, name) {
	await goHome(page);
	await goToTab(page, 'sessions');
	// XXX: Wait until page is ready
	await page.waitForTimeout(500);
	await page.getByRole('heading', { name }).click();
	await page.waitForURL((u) => u.hash === '#/import');
}

/**
 * @param {Page} page
 * @param {string} name
 */
export async function deleteSession(page, name) {
	await goHome(page);
	await goToTab(page, 'sessions');
	// XXX: Wait until page is ready
	await page.waitForTimeout(500);
	const sessionCard = page.getByRole('article').filter({
		has: page.getByRole('heading', { name })
	});

	await sessionCard.getByRole('button', { name: 'Gérer' }).click();
	await page.getByRole('button', { name: 'Supprimer' }).click();
	await confirmDeletionModal(page, { type: name, modalKey: 'modal_delete_session' });
	await page.waitForURL((u) => u.hash === '#/sessions');
}

/**
 *
 * @param {Page} page
 */
export async function chooseFirstSession(page) {
	await goHome(page);
	await goToTab(page, 'sessions');

	await page.locator('main article:not([data-testid=new-session-card])').first().click();
	await page.waitForURL((u) => u.hash === '#/import');
}

/**
 *
 * @param {Page} page
 * @param {string} name
 */
export async function changeSessionProtocol(page, name) {
	await page.getByTestId('goto-current-session').click();
	await page.waitForURL((u) => u.hash.startsWith('#/sessions/'));
	await chooseInDropdown(page, 'protocol', name);
	await goToTab(page, 'import');
}

/**
 * @param {Page} page
 */
export async function goToProtocolManagement(page) {
	await goHome(page);
	await goToTab(page, 'protocols');
}

/**
 *
 * @param {Page} page
 */
async function goHome(page) {
	await page.getByTestId('goto-home').click();
	await page.waitForURL((u) => u.hash === '#/sessions');
}

/**
 *
 * @param {import('$lib/i18n').Language} lang
 */
const appNavTabs = (lang = 'fr') => ({
	import: { name: lang === 'fr' ? 'Importer' : 'Import', hash: '#/import' },
	crop: { name: lang === 'fr' ? 'Recadrer' : 'Crop', hash: '#/crop' },
	classify: { name: lang === 'fr' ? 'Classifier' : 'Classify', hash: '#/classify' },
	results: { name: lang === 'fr' ? 'Résultats' : 'Results', hash: '#/results' },
	sessions: { name: lang === 'fr' ? 'Sessions' : 'Sessions', hash: '#/sessions' },
	protocols: { name: lang === 'fr' ? 'Protocoles' : 'Protocols', hash: '#/protocols' }
});

/**
 * @typedef {keyof ReturnType<typeof appNavTabs>} NavigationTab
 */

/**
 *
 * @param {Page} page
 * @param {NavigationTab} tabName
 * @param {object} [options]
 * @param {boolean} [options.waitForModel=true] wait for the model to be loaded (only for crop and classify)
 * @param {import('$lib/i18n').Language} [options.language=fr]
 */
export async function goToTab(page, tabName, { waitForModel = true, language = 'fr' } = {}) {
	await getTab(page, tabName).click();
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
 * @param {NavigationTab} tabName
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
 * @param {ExamplePaths.Protocols} filepath relative to tests/fixtures/
 */
export async function importProtocol(page, filepath) {
	const fileChooser = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Importer' }).click();
	await fileChooser.then((chooser) => chooser.setFiles(path.join(ExamplePaths.root, filepath)));
}

/**
 *
 * @param {Page} page
 * @param {string|RegExp} message
 * @param {object} options
 * @param {undefined | import('$lib/toasts.svelte').Toast<null>['type']} [options.type]
 */
export function toast(page, message, { type = undefined } = {}) {
	let loc = page.getByTestId('toasts-area');

	if (type) {
		loc = loc.locator(`[data-type=${type}]`);
	}

	return loc.filter({ hasText: message });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {FixturePaths.Exports} filepath to the zip file, relative to tests/fixtures/exports
 * @param {object} [options]
 * @param {boolean} [options.waitForLoading] wait for loading to finish
 */
export async function importResults(page, filepath, { waitForLoading = true } = {}) {
	await setSettings({ page }, { showTechnicalMetadata: false });
	await newSession(page);
	await goToTab(page, 'import');
	// Import fixture zip
	await expect(page.getByText(/\(.zip\)/)).toBeVisible();
	const fileInput = await page.$("input[type='file']");
	await fileInput?.setInputFiles(path.join(FixturePaths.root, filepath));
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
		/** @type {Partial<Record<import('idb').StoreNames<import('$lib/idb.svelte.js').IDBDatabaseType>, any>>} */
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
 * @typedef {{[ Table in import('idb').StoreNames<IDBDatabaseType>]: Array<IDBDatabaseType[Table]['value']>}} DatabaseDump
 */

/**
 *
 * @param {import('@playwright/test').Page} page
 * @param {FixturePaths.DatabaseDumps} filepath relative to tests/fixtures/db
 */
export async function loadDatabaseDump(page, filepath = 'db/basic.devalue') {
	const location = path.join(FixturePaths.root, filepath);

	await page.evaluate(
		async (dump) => {
			/**
			 * @template {import('idb').StoreNames<IDBDatabaseType>} TableName
			 * @param {undefined | import('idb').IDBPTransaction<IDBDatabaseType, TableName[], "readwrite">} tx
			 * @param {TableName} tableName
			 * @param {DatabaseDump[TableName]} rows
			 */
			async function setTableEntries(tx, tableName, rows) {
				if (tx) {
					await tx.objectStore(tableName).clear();
				} else {
					await window.DB.clear(tableName);
				}

				for (const row of rows) {
					console.info('[loadDatabaseDump] Adding row to', tableName, row);
					if (tx) {
						await tx.objectStore(tableName).put(row);
					} else {
						await window.DB.put(tableName, row);
					}
				}
			}

			/** @type {DatabaseDump} */
			const { Protocol, ...otherTables } = window.devalue.parse(dump);

			await setTableEntries(undefined, 'Protocol', Protocol);

			/**
			 * @template {string} K
			 * @param {Record<K, unknown>} subject
			 * @returns {K[]}
			 */
			function keys(subject) {
				// @ts-expect-error
				return Object.keys(subject);
			}
			/**
			 * @template {string} K
			 * @template {any} V
			 * @param {Record<K, V>} subject
			 * @returns {Array<[K, V]>}
			 */
			function entries(subject) {
				// @ts-expect-error
				return Object.entries(subject);
			}

			const tx = window.DB.transaction(keys(otherTables), 'readwrite');

			for (const [tableName, rows] of entries(otherTables)) {
				await setTableEntries(tx, tableName, rows);
			}

			await tx.done;

			window.refreshDB();
		},
		readFileSync(location, 'utf-8')
	);

	// FIXME await finishes before all [loadDatabaseDump] logs ??
	await page.waitForTimeout(3_000);
	await page.reload();
	await page.waitForFunction(() => Boolean(window.devalue && window.DB && window.refreshDB));
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
async function tooltipOf(page, locator) {
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
 * @template Args
 * @template T
 * @typedef {T | ((args: Args) => T) | ((args: Args) => Promise<T>)} MaybeAsyncFunction
 */

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').BrowserContext} context
 * @param {string | RegExp | ((u: URL) => boolean)} url
 * @param {MaybeAsyncFunction<import('@playwright/test').Route, {json:object}|{body:string|Buffer}>} result
 */
export async function mockUrl(page, context, url, result) {
	await Promise.all(
		// Context: service workers. Page: regular fetch() requests (for browsers that don't support service worker instrumentation)
		[context, page].map(async (target) =>
			target.route(url, async (route) =>
				route.fulfill(typeof result === 'function' ? await result(route) : result)
			)
		)
	);
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
	await mockUrl(
		page,
		context,
		(u) => {
			u.searchParams.delete('v');
			return u.toString() === source;
		},
		mockedResult
	);
}

/**
 *
 * @param {Page} page
 * @param {string | {title: string} | {key: `modal_${string}`}} query providing a string is equivalent to providing {title: string}
 */
export function modal(page, query) {
	if (typeof query === 'string') {
		return modal(page, { title: query });
	}

	if ('key' in query) {
		return page.locator(`dialog[data-key='${query.key}']`);
	}

	return page.getByRole('dialog').filter({
		visible: true,
		has: page.getByRole('banner').getByRole('heading', {
			name: query.title,
			exact: true
		})
	});
}

/**
 * Expects an open deletion confirmation modal, and confirms deletion
 * @param {Page} page
 * @param {object} [opts]
 * @param {string} [opts.type] text to type before hitting confirm button
 * @param {string} [opts.title='Êtes-vous sûr·e?'] title of the modal
 * @param {`modal_${string}`} [opts.modalKey] data-key of the modal to target
 */
export async function confirmDeletionModal(
	page,
	{ type, title = 'Êtes-vous sûr·e?', modalKey } = {}
) {
	const deletionModal = modal(page, modalKey ? { key: modalKey } : { title });
	await expect(deletionModal).toBeVisible();

	if (type) {
		const textbox = deletionModal.getByRole('textbox');
		await textbox.fill(type);
	}
	await deletionModal.getByRole('button', { name: 'Oui, supprimer' }).click();
}

/**
 *
 * @param {Page} page
 * @param {Parameters<import('@playwright/test').Locator['click']>[0]} [clickOptions]
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

const loadingNotQueuedText = makeRegexpUnion('Chargement…', 'Analyse…');

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
 * @param {string} metadataLabel
 */
export function sidepanelMetadataSectionFor(page, metadataLabel) {
	return page
		.getByTestId('sidepanel')
		.locator('section')
		.filter({ hasText: metadataLabel })
		.first();
}

/**
 *
 * @param {Page} page
 * @param {string} metadataLabel
 */
export function sessionMetadataSectionFor(page, metadataLabel) {
	return page
		.getByTestId('session-metadata')
		.locator('section')
		.filter({ hasText: metadataLabel })
		.first();
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

/**
 * @param {Page} page
 * @param {string} label
 */
export function observationCard(page, label) {
	return page
		.getByTestId('observations-area')
		.getByRole('article')
		.filter({ has: page.getByRole('heading', { name: label }) })
		.first();
}

/**
 *
 * @param {import('node:stream').Readable} stream
 * @returns
 */
async function readStreamToBuffer(stream) {
	return Buffer.concat(await Array.fromAsync(stream));
}

/**
 * Only one of json, text or buffer should be provided.
 * @typedef {object} ZipFileEntryCheck
 * @property {(text: string) => void | Promise<void>} [text] function to call with the text content of the file
 * @property {(buffer: Buffer) => void | Promise<void>} [buffer] function to call with the buffer content of the file
 * @property {(json: any) => void | Promise<void>} [json] function to call with the parsed JSON content of the file
 * @property {(entry: import('yauzl-promise').Entry) => void | Promise<void>} [entry] function to call with the zip entry itself
 */

/**
 * @template {string} Files
 * Matches the files present in a zip file against an expected list of file names, without regard for order.
 * @param {import('yauzl-promise').ZipFile} zip
 * @param {Array<RegExp|Files>} expectedFiles
 * @param {Partial<Record<Files, ZipFileEntryCheck>>} [checks] additional checks to perform for specific files
 */
export async function expectZipFiles(zip, expectedFiles, checks = {}) {
	const zipFiles = [];
	for await (const file of zip) {
		zipFiles.push(file.filename);
		if (file.filename in checks) {
			// @ts-expect-error
			const { json, text, buffer, entry } = checks[file.filename];

			const buf = await file.openReadStream().then(readStreamToBuffer);

			if (buffer) {
				await buffer(buf);
			} else if (text) {
				await text(buf.toString('utf-8'));
			} else if (json) {
				await json(JSON.parse(buf.toString('utf-8')));
			}

			if (entry) {
				await entry(file);
			}
		}
	}

	expect(zipFiles).toHaveLength(expectedFiles.length);
	for (const expectedFile of expectedFiles) {
		expect(zipFiles).toContainEqual(
			expectedFile instanceof RegExp ? expect.stringMatching(expectedFile) : expectedFile
		);
	}
}

/**
 * @typedef {{ model: Buffer<ArrayBufferLike>, classmapping: Buffer<ArrayBufferLike> | undefined, filename: string }} PredownloadedModel
 */

/**
 *
 * @param {string} filename
 * @param {string} [classmappingFilename]
 * @returns {Promise<PredownloadedModel|null>}
 */
export async function getPredownloadedModel(filename, classmappingFilename) {
	const model = await readFile(filename).catch(() => {
		console.warn(
			`Warning: cannot find '${filename}' model file. Tests will use the network to fetch it.`
		);
		return null;
	});

	const classmapping = classmappingFilename
		? await readFile(classmappingFilename).catch(() => {
				console.warn(
					`Warning: cannot find '${classmappingFilename}' classmapping file. Tests will use the network to fetch the '${filename}' model.`
				);
				return undefined;
			})
		: undefined;

	return model ? { model, classmapping, filename } : null;
}

/**
 * @param {Page} page
 * @param {import('@playwright/test').BrowserContext} context
 * @param {typeof import('$lib/schemas/protocols').ExportedProtocol.infer} protocol
 * @param {{metadata: string} | 'detection'} task
 * @param {PredownloadedModel} model
 */
async function mockPredownloadedModel(
	page,
	context,
	protocol,
	task,
	{ filename, model, classmapping }
) {
	/** @param {typeof import('$lib/schemas/metadata').MetadataInferOptionsNeural.infer['neural'][number]} arg0 */
	const modelMatches = ({ model }) =>
		new URL(typeof model === 'string' ? model : model.url).pathname.endsWith(filename);

	const url =
		task === 'detection'
			? protocol.crop.infer?.find(modelMatches)?.model
			: protocol.metadata[`${protocol.id}__${task.metadata}`].infer?.neural.find(modelMatches)
					?.model;

	await mockUrl(page, context, url, { body: model });

	if (classmapping && task !== 'detection') {
		const classmappingUrl =
			protocol.metadata[`${protocol.id}__${task.metadata}`].infer?.neural.find(
				modelMatches
			)?.classmapping;

		if (!classmappingUrl) return;

		await mockUrl(page, context, classmappingUrl, { body: classmapping });
	}
}

/**
 * @param {Page} page
 * @param {import('@playwright/test').BrowserContext} context
 * @param {typeof import('$lib/schemas/protocols').ExportedProtocol.infer} protocol
 * @param {Record<'detection'|'species', Array<null | PredownloadedModel>>} models
 */
export async function mockPredownloadedModels(page, context, protocol, models) {
	for (const [task, taskModels] of Object.entries(models)) {
		for (const model of taskModels) {
			if (!model) continue;
			await mockPredownloadedModel(
				page,
				context,
				protocol,
				task === 'detection' ? 'detection' : { metadata: task },
				model
			);
		}
	}
}

/**
 * @template {string} K
 * @template {any} V
 * @param {Record<K, V>} subject
 * @returns {Array<[K, V]>}
 */
export function entries(subject) {
	// @ts-expect-error
	return Object.entries(subject);
}
