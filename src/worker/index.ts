import type { LocalStorage } from './procedures.js';
import type { IDBDatabaseType } from '$lib/idb.svelte.js';
import type { IDBPDatabase } from 'idb';

import { openDB } from 'idb';
import * as Swarp from 'swarpc';

import { LOCAL_STORAGE, PROCEDURES } from './procedures.js';

/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

let _db: undefined | IDBPDatabase<IDBDatabaseType>;

let databaseParams: undefined | { name: string; revision: number };

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

function getLocalStorage<K extends keyof LocalStorage>(key: K) {
	return LOCAL_STORAGE.get(key).assert(localStorage.getItem(key)) as LocalStorage[K];
}
