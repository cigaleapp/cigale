import { openDB } from 'idb';
import { BUILTIN_METADATA, Tables } from './database';

export async function fillBuiltinData() {
	await Promise.allSettled([
		...BUILTIN_METADATA.map(async (m) => set('Metadata', m)),
		set('Settings', {
			layer: 'defaults',
			protocols: [],
			theme: 'auto',
			gridSize: 10,
			language: 'fr',
			showInputHints: true
		})
	]);
}

/**
 *
 * @param {TableName} tableName
 * @param {typeof Tables[TableName]['inferIn']} value
 * @template {keyof typeof Tables} TableName
 */
export async function set(tableName, value) {
	const db = await openDatabase();
	const validator = Tables[tableName];
	return await db.put(tableName, validator.assert(value));
}

/**
 *
 * @param {TableName} tableName
 * @param {string} key
 * @template {keyof typeof Tables} TableName
 */
export async function get(tableName, key) {
	const db = await openDatabase();
	return await db.get(tableName, key);
}

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

	return _database;
}

// Magie vodou Typescript, pas besoin de comprendre
// Si t'es curieuxse, demande à Gwenn qui sera ravie
// de t'expliquer :3
/**
 * @type {import('idb').IDBPDatabase<{
 *   [Name in keyof typeof Tables]: {
 *      value: (typeof Tables[Name])['infer']
 *      key: string
 *   }
 * }> | undefined}
 */
let _database;
