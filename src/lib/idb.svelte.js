import { openDB } from 'idb';
import { nanoid } from 'nanoid';
import { Tables } from './database';

/** @type {Array<keyof typeof Tables>} */
// @ts-ignore
const tableNames = Object.keys(Tables);

/** @type {{[Table in keyof typeof Tables]: Array<typeof Tables[Table]['infer']>}} */
const tableValues = $state({
	Image: [],
	Metadata: [],
	Observation: [],
	Protocol: [],
	Settings: []
});

/**
 *
 * @type {{
 *  [Name in keyof typeof Tables]: ReturnType<typeof wrangler<Name>>
 * } & {
 * 	initialize: () => Promise<void>
 * }}
 */
// @ts-ignore
export const tables = {
	...Object.fromEntries(tableNames.map((name) => [name, wrangler(name)])),
	async initialize() {
		await Promise.allSettled(
			tableNames.map(async (name) => {
				tableValues[name] = await tables[name].list();
			})
		);
	}
};

/**
 *
 * @param {Table} table
 * @template {keyof typeof Tables} Table
 */
function wrangler(table) {
	return {
		get state() {
			return tableValues[table];
		},
		/** @param {string} key  */
		get: async (key) => get(table, key),
		/** @param {typeof Tables[Table]['inferIn']} value */
		async set(value) {
			await set(table, value);
			const output = Tables[table].assert(value);
			const index = tableValues[table].findIndex((item) => item.id === value.id);
			if (index !== -1) tableValues[table][index] = output;
			else tableValues[table].push(output);
		},
		/** @param {Omit<typeof Tables[Table]['inferIn'], 'id'>} value */
		async add(value) {
			return this.set(
				// @ts-ignore
				{ ...value, id: `${table}_${nanoid()}` }
			);
		},
		list: async () => list(table),
		all: () => iterator(table),
		/** @param {string} index  */
		by: (index) => iterator(table, index),
		/** Do not go through validation or type morphing, manipulate the underlying database values directly. Useful for performance reasons, when changing only a property inside of an object and leaving the others unchanged, for example */
		raw: {
			/** @param {typeof Tables[Table]['inferIn']} value */
			async set(value) {
				const db = await openDatabase();
				return await db.put(table, value);
			},
			/** @param {string} key */
			async get(key) {
				const db = await openDatabase();
				return await db.get(table, key);
			}
		}
	};
}

/**
 *
 * @param {TableName} tableName
 * @param {typeof Tables[TableName]['inferIn']} value
 * @template {keyof typeof Tables} TableName
 */
export async function set(tableName, value) {
	console.time(`set ${tableName} ${value.id}`);
	const db = await openDatabase();
	const validator = Tables[tableName];
	validator.assert(value);
	return await db.put(tableName, value).then((result) => {
		console.timeEnd(`set ${tableName} ${value.id}`);
		return result;
	});
}

/**
 *
 * @param {TableName} tableName
 * @param {string} key
 * @returns {Promise<undefined | typeof Tables[TableName]['infer']>}
 * @template {keyof typeof Tables} TableName
 */
export async function get(tableName, key) {
	console.time(`get ${tableName} ${key}`);
	const db = await openDatabase();
	const validator = Tables[tableName];
	return await db.get(tableName, key).then((value) => {
		const out = value ? validator.assert(value) : undefined;
		console.timeEnd(`get ${tableName} ${key}`);
		return out;
	});
}

/**
 *
 * @param {TableName} tableName
 * @returns {Promise<Array<typeof Tables[TableName]['infer']>>}
 * @template {keyof typeof Tables} TableName
 */
export async function list(tableName) {
	const db = await openDatabase();
	const validator = Tables[tableName];
	// @ts-ignore
	return await db.getAll(tableName).then((values) => values.map(validator.assert));
}

/**
 *
 * @param {TableName} tableName
 * @param {string} [index]
 * @returns {AsyncGenerator<typeof Tables[TableName]['infer'], void, unknown>}
 * @template {keyof typeof Tables} TableName
 */
export async function* iterator(tableName, index = undefined) {
	const db = await openDatabase();
	const validator = Tables[tableName];
	const store = db.transaction(tableName).store;
	const iter = index ? store.index(index).iterate() : store.iterate();
	for await (const cursor of iter) {
		yield validator.assert(cursor.value);
	}
}

export async function openDatabase() {
	if (_database) return _database;

	/** @type {Array<{[K in keyof typeof Tables]: [K, typeof Tables[K]]}[keyof typeof Tables]>} */
	// @ts-ignore
	const tablesByName = Object.entries(Tables);

	_database = await openDB('database', 1, {
		upgrade(db) {
			for (const [tableName, schema] of tablesByName) {
				if (!schema.meta.table) continue;
				const keyPath = schema.meta.table.indexes[0];
				const store = db.createObjectStore(tableName, { keyPath });
				for (const index of schema.meta.table.indexes.slice(1)) {
					store.createIndex(index, index);
				}
			}
		}
	});

	return _database;
}

// Magie vodoo Typescript, pas besoin de comprendre
// Si t'es curieuxse, demande à Gwenn qui sera ravie
// de t'expliquer :3
/**
 * @type {import('idb').IDBPDatabase<{
 *   [Name in keyof typeof Tables]: {
 *      value: (typeof Tables[Name])['inferIn']
 *      key: string,
 *     indexes: {
 *        [IndexName in string]: string;
 *     }
 *   }
 * }> | undefined}
 */
let _database;
