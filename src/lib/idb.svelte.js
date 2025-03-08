import { openDB } from 'idb';
import { nanoid } from 'nanoid';
import { isReactiveTable, Tables } from './database.js';

/**
 * @typedef {typeof import('./database.js').NO_REACTIVE_STATE_TABLES[number]} NonReactiveTableNames
 */

/**
 * @typedef {Exclude<keyof typeof Tables, NonReactiveTableNames>} ReactiveTableNames
 */

/** @type {Array<keyof typeof Tables>} */
// @ts-ignore
const tableNames = Object.keys(Tables);

/** @type {{[Table in ReactiveTableNames]: Array<typeof Tables[Table]['infer']>}} */
export const _tablesState = $state({
	Image: [],
	Metadata: [],
	Observation: [],
	Protocol: [],
	Settings: []
});

/**
 *
 * @type {{
 *  [Name in ReactiveTableNames]: ReturnType<typeof wrangler<Name>>
 * } & {
 * 	initialize: () => Promise<void>
 * }}
 */
// @ts-ignore
export const tables = {
	...Object.fromEntries(tableNames.filter(isReactiveTable).map((name) => [name, wrangler(name)])),
	async initialize() {
		console.time('*db initialize');
		for (const name of tableNames) {
			if (!isReactiveTable(name)) continue;
			// @ts-expect-error
			_tablesState[name] = await tables[name].list();
		}
		console.timeEnd('*db initialize');
	}
};

/**
 *
 * @param {Table} table
 * @template {ReactiveTableNames} Table
 */
function wrangler(table) {
	return {
		get state() {
			return _tablesState[table];
		},
		/** @param {string} key  */
		get: async (key) => get(table, key),
		/** @param {typeof Tables[Table]['inferIn']} value */
		async set(value) {
			await set(table, value);
			const output = Tables[table].assert(value);
			const index = _tablesState[table].findIndex((item) => item.id === value.id);
			console.log(`indexof ${table} ${value.id} = ${index}`);
			if (index !== -1) _tablesState[table][index] = output;
			else {
				_tablesState[table].push(output);
				_tablesState[table].sort(idComparator);
			}
			return output;
		},
		/**
		 *
		 * @param {string} key
		 * @param {Prop} property
		 * @param {typeof Tables[Table]['inferIn'][Prop]} value
		 * @template {keyof typeof Tables[Table]['inferIn']} Prop
		 * @returns {Promise<boolean>} true if the item was found and updated, false otherwise
		 */
		async update(key, property, value) {
			const logLabel = `upd ${table} ${key} ${typeof property === 'string' ? property : '<Symbol>'} = ${value}`;
			console.time(logLabel);

			// Get item from DB
			const item = await this.raw.get(key);

			// Handle not found
			if (!item) {
				console.timeEnd(logLabel);
				console.error(`${logLabel}: item not found`);
				return false;
			}

			// Update property in DB object
			item[property] = value;
			await set(table, item);

			// Update reactive state
			const index = _tablesState[table].findIndex((item) => item.id === key);
			if (index === -1) {
				console.log(`${logLabel}: item not found in reactive state, refetching entire list`);
				// @ts-ignore
				_tablesState[table] = await this.list();
			} else {
				console.log(`${logLabel}: updating state @ ${table}[${index}]`);
				_tablesState[table][index] = Tables[table].assert(item);
			}

			console.timeEnd(logLabel);
			return true;
		},
		/** @param {Omit<typeof Tables[Table]['inferIn'], 'id'>} value */
		async add(value) {
			return this.set(
				// @ts-ignore
				{ ...value, id: `${table}_${nanoid()}` }
			);
		},
		async clear() {
			await clear(table);
			_tablesState[table] = [];
		},
		/**
		 * @param {string | IDBKeyRange} id key of the object to remove
		 */
		async remove(id) {
			await drop(table, id);
			const index = _tablesState[table].findIndex((item) => item.id === id);
			if (index !== -1) {
				console.warn(`del ${table} ${id}: not found in reactive state, re-fetching`);
				// @ts-ignore
				_tablesState[table] = await this.list();
			} else {
				delete _tablesState[table][index];
			}
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
			/**
			 * @param {string} key
			 * @returns {Promise<typeof Tables[Table]['inferIn'] | undefined>}
			 */
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
 * @param {TableName} table
 * @template {keyof typeof Tables} TableName
 */
export async function clear(table) {
	console.time(`clr ${table}`);
	const db = await openDatabase();
	await db.clear(table).then((result) => {
		console.timeEnd(`clr ${table}`);
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
	console.time(`ls ${tableName}`);
	const db = await openDatabase();
	const validator = Tables[tableName];
	// @ts-ignore
	return await db
		.getAll(tableName)
		.then((values) => values.map((v) => validator.assert(v)).sort(idComparator))
		.then((result) => {
			console.timeEnd(`ls ${tableName}`);
			return result;
		});
}

/**
 * Returns a comparator to sort objects by their id property
 * If both IDs are numeric, they are compared numerically even if they are strings
 * @template {{id: string|number} | string | number} IdOrObject
 * @param {IdOrObject} a
 * @param {IdOrObject} b
 * @returns {number}
 */
export const idComparator = (a, b) => {
	// @ts-ignore
	if (typeof a === 'object' && 'id' in a) return idComparator(a.id, b.id);
	// @ts-ignore
	if (typeof b === 'object' && 'id' in b) return idComparator(a.id, b.id);

	if (typeof a === 'number' && typeof b === 'number') return a - b;

	if (typeof a === 'number') return -1;
	if (typeof b === 'number') return 1;

	if (/^\d+$/.test(a) && /^\d+$/.test(b)) return Number(a) - Number(b);
	return a.localeCompare(b);
};

/**
 * Delete an entry from a table by key
 * @param {TableName} table
 * @param {string | IDBKeyRange} id
 * @returns {Promise<void>}
 * @template {keyof typeof Tables} TableName
 */
export async function drop(table, id) {
	console.time(`delete ${table} ${id}`);
	const db = await openDatabase();
	return await db
		.delete(table, id)
		.then(() => {
			console.timeEnd(`delete ${table} ${id}`);
			return list(table);
		})
		.then((list) => {
			console.log(`delete ${table} ${id}: objects are now ${list.map((o) => o.id).join(', ')}`);
		});
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

	_database = await openDB('database', 2, {
		upgrade(db, oldVersion) {
			// No clean migration path for 1 -> 2, just drop everything
			if (oldVersion === 1) {
				for (const tableName of db.objectStoreNames) {
					db.deleteObjectStore(tableName);
				}
			}
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

export function nukeDatabase() {
	if (_database) {
		_database.close();
		_database = undefined;
	}
	indexedDB.deleteDatabase('database');
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
