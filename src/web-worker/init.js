/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { openDB } from 'idb';
import * as Swarp from 'swarpc';
import { PROCEDURES } from './procedures.js';

export const ww = /** @type {Worker} */ (/** @type {unknown} */ self);

/**
 * @type {import('idb').IDBPDatabase<import('../lib/idb.svelte.js').IDBDatabaseType> | undefined}
 */
let db;

/** @type {undefined | { name: string , revision: number }} */
let databaseParams;

export async function openDatabase() {
	if (!databaseParams) {
		throw new Error('Database parameters not set, call swarp.init() first');
	}
	if (db) return db;
	db = await openDB(databaseParams.name, databaseParams.revision);
	if (!db) {
		throw new Error(`Failed to open database ${databaseParams.name}`);
	}
	return db;
}

export const swarp = Swarp.Server(PROCEDURES, { worker: ww });

swarp.init(async ({ databaseName, databaseRevision }) => {
	databaseParams = { name: databaseName, revision: databaseRevision };
});
