/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { openDB } from 'idb';
import * as Swarp from 'swarpc';

import { PROCEDURES } from './procedures.js';

/**
 * @type {import('idb').IDBPDatabase<import('../lib/idb.svelte.js').IDBDatabaseType> | undefined}
 */
let _db;

/** @type {undefined | { name: string , revision: number }} */
let databaseParams;

export async function openDatabase() {
	if (!databaseParams) {
		throw new Error('Database parameters not set, call swarp.init() first');
	}
	if (_db) return _db;
	_db = await openDB(databaseParams.name, databaseParams.revision);
	return _db;
}

export const swarp = Swarp.Server(PROCEDURES);

swarp.init(async ({ databaseName, databaseRevision }) => {
	databaseParams = { name: databaseName, revision: databaseRevision };
});
