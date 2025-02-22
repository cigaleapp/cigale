import { openDB } from 'idb';
import { BUILTIN_METADATA, Tables } from './database';

export async function openDatabase() {
	if (_database) return _database;

	_database = await openDB('database', 1, {
		upgrade(db) {
			for (const [tableName, schema] of Object.entries(Tables)) {
				if (!schema.meta.table) continue;
				// @ts-ignore
				db.createObjectStore(tableName, {
					keyPath: schema.meta.table.keyPath
				});
			}
		}
	});

	for (const metadata of BUILTIN_METADATA) {
		await _database.put('Metadata', metadata);
	}

	await _database.put('Settings', {
		_: '_',
		gridSize: 10,
		language: 'fr',
		protocols: [],
		theme: 'auto',
		showInputHints: true
	});

	return _database;
}

/**
 * @type {import('idb').IDBPDatabase<{
 *   [Name in keyof typeof Tables]: {
 *      value: (typeof Tables[Name])['infer']
 *      key: string
 *   }
 * }> | undefined}
 */
let _database;
