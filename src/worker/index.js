/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { openDB } from 'idb';
import * as Swarp from 'swarpc';

import { LOCAL_STORAGE, PROCEDURES } from './procedures.js';

/**
 * @type {import('idb').IDBPDatabase<import('../lib/idb.svelte.js').IDBDatabaseType> | undefined}
 */
let _db;

/** @type {undefined | { name: string , revision: number }} */
let databaseParams;

export async function openDatabase() {
	databaseParams = {
		name: getLocalStorage('databaseName'),
		revision: getLocalStorage('databaseRevision'),
	};

	if (_db) return _db;
	_db = await openDB(databaseParams.name, databaseParams.revision);
	return _db;
}

export const swarp = Swarp.Server(PROCEDURES);

swarp.wakeup(async () => true);

/**
 * @template {keyof import('./procedures.js').LocalStorage} K
 * @param {K} key
 * @return {import('./procedures.js').LocalStorage[K]}
 */
function getLocalStorage(key) {
	return LOCAL_STORAGE.get(key).assert(localStorage.getItem(key));
}
