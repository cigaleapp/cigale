import { openDB } from 'idb';
import { nanoid } from 'nanoid';
import { NO_REACTIVE_STATE_TABLES, Tables } from './database.js';

/**
 * @typedef {typeof NO_REACTIVE_STATE_TABLES[number]} NonReactiveTableNames
 */

/**
 * @typedef {Exclude<keyof typeof Tables, NonReactiveTableNames>} ReactiveTableNames
 */

/** @type {Array<keyof typeof Tables>} */
// @ts-ignore
const tableNames = Object.keys(Tables);

/** @type {{[Table in ReactiveTableNames]: Array<typeof Tables[Table]['infer']>}} */
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
 *  [Name in ReactiveTableNames]: ReturnType<typeof wrangler<Name>>
 * } & {
 * 	initialize: () => Promise<void>
 * }}
 */
// @ts-ignore
export const tables = {
	...Object.fromEntries(
		tableNames
			.filter((name) => !NO_REACTIVE_STATE_TABLES.includes(name))
			.map((name) => [name, wrangler(name)])
	),
	async initialize() {
		await Promise.allSettled(
			tableNames.map(async (name) => {
				// @ts-expect-error
				tableValues[name] = await tables[name].list();
			})
		);
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
			return tableValues[table];
		},
		/** @param {string} key  */
		get: async (key) => get(table, key),
		/** @param {typeof Tables[Table]['inferIn']} value */
		async set(value) {
			await set(table, value);
			const output = Tables[table].assert(value);
			const index = tableValues[table].findIndex((item) => item.id === value.id);
			console.log(`indexof ${table} ${value.id} = ${index}`);
			if (index !== -1) tableValues[table][index] = output;
			else {
				tableValues[table].push(output);
				tableValues[table].sort(idComparator);
			}
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
			const index = tableValues[table].findIndex((item) => item.id === key);
			if (index === -1) {
				console.log(`${logLabel}: item not found in reactive state, refetching entire list`);
				tableValues[table] = await this.list();
			} else {
				console.log(`${logLabel}: updating state @ ${table}[${index}]`);
				tableValues[table][index] = Tables[table].assert(item);
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
	return await db
		.getAll(tableName)
		.then((values) => values.map(validator.assert).sort(idComparator));
}

/**
 * Returns a comparator to sort objects by their id property
 * If both IDs are numeric, they are compared numerically even if they are strings
 * @type {(a: {id: string|number}, b: {id: string|number}) => number}
 */
const idComparator = (a, b) => {
	if (typeof a.id === 'number' && typeof b.id === 'number') return a.id - b.id;

	if (typeof a.id === 'number') return -1;
	if (typeof b.id === 'number') return 1;

	if (/^\d+$/.test(a.id) && /^\d+$/.test(b.id)) return Number(a.id) - Number(b.id);
	return a.id.localeCompare(b.id);
};

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
