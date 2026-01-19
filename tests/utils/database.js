import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { FixturePaths } from '../filepaths.js';

/**
 * @import { Page } from '@playwright/test';
 * @import {IDBDatabaseType} from '$lib/idb.svelte.js';
 */

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

	await mkdir(path.dirname(dest), {
		recursive: true
	});

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
