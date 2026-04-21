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
 * Capture a dump of the database
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>} the encoded dump
 */
export async function dumpDatabase(page) {
	const encodedDump = await page.evaluate(async () => {
		const tableNames = window.DB.objectStoreNames;

		/** @type {Partial<Record<import('idb').StoreNames<import('$lib/idb.svelte.js').IDBDatabaseType>, any>>} */
		const dump = {};

		for (const tableName of tableNames) {
			dump[tableName] = await window.DB.getAll(tableName);
		}

		return window.devalue.stringify(dump);
	});

	return encodedDump;
}
