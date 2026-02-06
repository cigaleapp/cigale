import * as devalue from 'devalue';
import { openDB } from 'idb';
import { nanoid } from 'nanoid';

import {
	generateId,
	idComparator,
	isReactiveTable,
	isSessionDependentReactiveTable,
	Tables
} from './database.js';
import { nonnull } from './utils.js';

/** @type {number | null} */
export const previewingPrNumber =
	import.meta.env.previewingPrNumber === 'null' ? null : import.meta.env.previewingPrNumber;

export const databaseName = previewingPrNumber ? `previews/pr-${previewingPrNumber}` : 'database';
export const databaseRevision = 5;

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
	Settings: [],
	Session: []
});

/**
 *
 * @type {{
 *  [Name in ReactiveTableNames]: ReturnType<typeof wrangler<Name>>
 * } & {
 * 	initialize: (sessionId: string|null) => Promise<void>
 * }}
 */
// @ts-ignore
export const tables = {
	...Object.fromEntries(tableNames.filter(isReactiveTable).map((name) => [name, wrangler(name)])),
	/**
	 * Initialize reactive tables for the current session
	 */
	async initialize(sessionId) {
		for (const name of tableNames) {
			if (!isReactiveTable(name)) continue;
			await tables[name].refresh(sessionId);
		}
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
		/** @param {string|null} sessionId */
		async refresh(sessionId) {
			if (!sessionId && isSessionDependentReactiveTable(table)) {
				console.debug(`refresh ${table} without session: clearing state`);
				_tablesState[table] = [];
			} else if (sessionId && isSessionDependentReactiveTable(table)) {
				console.debug(`refresh ${table} for session ${sessionId}`);
				// @ts-ignore
				_tablesState[table] = await this.list('sessionId', sessionId);
			} else {
				console.debug(`refresh ${table}`);
				// @ts-ignore
				_tablesState[table] = await this.list();
			}
		},
		/** @param {string[]} keys */
		getMany: async (keys) =>
			Promise.all(keys.map((key) => get(table, key))).then((results) =>
				results.filter(nonnull)
			),
		/** @param {string} key  */
		get: async (key) => get(table, key),
		/** @param {string} key */
		getOrThrow: async (key) => {
			const item = await get(table, key);
			if (!item) throw new Error(`Item not found in ${table} with key ${key}`);
			return item;
		},
		/** @param {string} key  */
		getFromState: (key) => _tablesState[table].find((item) => item.id === key),
		/**
		 * @param {typeof Tables[Table]['inferIn']} value
		 * @returns {Promise<typeof Tables[Table]['inferOut']>}
		 */
		async set(value) {
			await set(table, value);
			const output = Tables[table].assert(value);
			const index = _tablesState[table].findIndex((item) => item.id === value.id);
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

			// Get item from DB
			const item = await this.raw.get(key);

			// Handle not found
			if (!item) {
				console.error(`${logLabel}: item not found`);
				return false;
			}

			// Update property in DB object
			item[property] = value;
			await set(table, item);

			// Update reactive state
			const index = _tablesState[table].findIndex((item) => item.id === key);
			if (index === -1) {
				console.debug(
					`${logLabel}: item not found in reactive state, refetching entire list`
				);
				// @ts-ignore
				_tablesState[table] = await this.list();
			} else {
				console.debug(`${logLabel}: updating state @ ${table}[${index}]`);
				_tablesState[table][index] = Tables[table].assert(item);
			}

			return true;
		},
		/**
		 * @param {Omit<typeof Tables[Table]['inferIn'], 'id'>} value
		 * @returns {Promise<typeof Tables[Table]['inferOut']>}
		 */
		async add(value) {
			return this.set(
				// @ts-ignore
				{ ...value, id: generateId(table) }
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
		/**
		 * Create a read-write transaction, execute `actions` given the transaction's object store for that table, and commit the transaction
		 * @param {(store: import('idb').IDBPObjectStore<IDBDatabaseType, [Table], Table, "readwrite">) => void | Promise<void>} actions
		 * @returns
		 */
		async do(actions) {
			const loglabel = `do ${table} #${nanoid()}`;
			console.debug(loglabel);
			await openTransaction([table], { mode: 'readwrite' }, async (tx) => {
				await actions(tx.objectStore(table));
			});
		},
		/**
		 * @param {import('idb').IndexNames<IDBDatabaseType, Table>} [index]
		 * @param {IDBKeyRange|string} [key]
		 */
		list: async (index, key) => (index && key ? listByIndex(table, index, key) : list(table)),
		all: () => iterator(table),
		count: async () => {
			const db = await openDatabase();
			return await db.count(table);
		},
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
			},
			async list() {
				const db = await openDatabase();
				return await db.getAll(table);
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
	const db = await openDatabase();
	const validator = Tables[tableName];
	validator.assert(value);
	return await db.put(tableName, value).then((result) => {
		return result;
	});
}

/**
 * @param {TableName} table
 * @template {keyof typeof Tables} TableName
 */
export async function clear(table) {
	const db = await openDatabase();
	await db.clear(table).then((result) => {
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
	const db = await openDatabase();
	const validator = Tables[tableName];
	return await db.get(tableName, key).then((value) => {
		const out = value ? validator.assert(value) : undefined;
		return out;
	});
}

/**
 *
 * @param {TableName} tableName
 * @param {IDBKeyRange} [keyRange]
 * @returns {Promise<Array<typeof Tables[TableName]['infer']>>}
 * @template {keyof typeof Tables} TableName
 */
export async function list(tableName, keyRange = undefined) {
	const db = await openDatabase();
	const validator = Tables[tableName];
	// @ts-ignore
	return await db
		.getAll(tableName, keyRange)
		.then((values) => values.map((v) => validator.assert(v)).sort(idComparator))
		.then((result) => {
			return result;
		});
}

/**
 * @template {keyof typeof Tables} TableName
 * @param {TableName} tableName
 * @param {import('idb').IndexNames<IDBDatabaseType, TableName>} indexName
 * @param {IDBKeyRange | string} [keyRange]
 * @returns {Promise<Array<typeof Tables[TableName]['infer']>>}
 */
export async function listByIndex(tableName, indexName, keyRange = undefined) {
	const db = await openDatabase();
	const validator = Tables[tableName];
	// @ts-ignore
	return await db
		.getAllFromIndex(
			tableName,
			indexName,
			typeof keyRange === 'string' ? IDBKeyRange.only(keyRange) : keyRange
		)
		.then((values) => values.map((v) => validator.assert(v)).sort(idComparator))
		.then((result) => {
			return result;
		});
}

/**
 * Delete an entry from a table by key
 * @param {TableName} table
 * @param {string | IDBKeyRange} id
 * @returns {Promise<void>}
 * @template {keyof typeof Tables} TableName
 */
export async function drop(table, id) {
	const db = await openDatabase();
	return await db
		.delete(table, id)
		.then(() => {
			return list(table);
		})
		.then((list) => {
			console.debug(
				`delete ${table} ${id}: objects are now ${list.map((o) => o.id).join(', ')}`
			);
		});
}

/**
 *
 * @param {TableName} tableName
 * @param {string} [index]
 * @template {keyof typeof Tables} TableName
 * @yields {typeof Tables[TableName]['infer']}
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

/**
 * Useful to declare and invalidate SvelteKit load functions
 * @see https://svelte.dev/docs/kit/load#Rerunning-load-functions-Manual-invalidation
 * @param {keyof typeof Tables} tableName
 * @param {string} key
 * @param {...string} additionalPath
 * @returns {`idb://${string}`}
 */
export function dependencyURI(tableName, key, ...additionalPath) {
	// @ts-expect-error
	return ['idb:/', tableName, key, ...additionalPath].filter(Boolean).join('/');
}

/**
 * Create a transaction, execute `actions`. Commits the transaction and refreshes reactive tables' state for you
 * @template {Array<keyof typeof Tables>} Tables
 * @template {IDBTransactionMode} [Mode="readwrite"]
 * @param {Tables} tableNames
 * @param {object} param1
 * @param {Mode} [param1.mode="readwrite"]
 * @param {string} [param1.session] current session ID, used to refresh session-dependent reactive tables. Defaults to localStorage's currentSessionId
 * @param {IDBTransactionWithAtLeast<Tables, Mode>} [param1.tx] already existing transaction to use instead of creating a new one. In that case, the transaction is not committed and the reactive tables' state is not refreshed, since it's assumed that a openTransactions() call higher up in the call stack will already do this
 * @param {(tx: IDBTransactionWithAtLeast<Tables, Mode>) => void | Promise<void>} actions
 */
export async function openTransaction(tableNames, { mode, session }, actions) {
	// @ts-ignore
	mode ??= 'readwrite';

	session ??= localStorage.getItem('currentSessionId') || '';

	// IndexedDB transactions are auto-comitted, so we can't reuse them reliably. will maybe find a fix for this.
	// if (tx) {
	// 	// @ts-ignore
	// 	console.debug(`txn reuse ${tx.id}`);
	// 	await actions(tx);
	// 	return
	// }

	const txid = nanoid(8);

	console.debug(`txn open ${txid} tables ${tableNames} mode ${mode}`);

	const db = await openDatabase();
	const newTx = db.transaction(tableNames, mode);

	// @ts-ignore
	newTx.id = txid;

	// @ts-ignore
	await actions(newTx);

	// @ts-ignore
	console.debug(`txn commit ${txid} `);

	await newTx.done;

	for (const table of tableNames.filter(isReactiveTable)) {
		await tables[table].refresh(session);
	}
}

export function databaseHandle() {
	if (!_database) {
		throw new Error('Database not initialized. Call openDatabase() first.');
	}

	return _database;
}

export async function openDatabase() {
	if (_database) return _database;

	/** @type {Array<{[K in keyof typeof Tables]: [K, typeof Tables[K]]}[keyof typeof Tables]>} */
	// @ts-ignore
	const tablesByName = Object.entries(Tables);

	_database = await openDB(databaseName, databaseRevision, {
		upgrade(db, oldVersion, _newVersion, tx) {
			/**
			 * @param {keyof typeof Tables} tableName
			 * @param {import('arktype').Type} schema
			 */
			const createTable = (tableName, schema) => {
				if (!schema.meta.table) return;
				const keyPath = schema.meta.table.indexes[0];
				if (db.objectStoreNames.contains(tableName)) {
					console.warn(`Table ${tableName} already exists, skipping creation`);
					return;
				}
				const store = db.createObjectStore(tableName, { keyPath });
				for (const index of schema.meta.table.indexes.slice(1)) {
					store.createIndex(index, index);
				}
			};

			/**
			 * @param {keyof typeof Tables} tableName
			 */
			const rebuildIndexes = async (tableName) => {
				const schema = Tables[tableName];
				if (!schema.meta.table) return;
				const store = tx.objectStore(tableName);
				// Delete all indexes
				for (const indexName of store.indexNames) {
					store.deleteIndex(indexName);
				}
				// Recreate indexes
				for (const index of schema.meta.table.indexes.slice(1)) {
					store.createIndex(index, index);
				}
			};

			// No clean migration path for 1 -> 2, just drop everything
			if (oldVersion === 1) {
				for (const tableName of db.objectStoreNames) {
					db.deleteObjectStore(tableName);
				}
			}
			if (oldVersion === 2) {
				createTable(/* @wc-ignore */ 'ImagePreviewFile', Tables.ImagePreviewFile);
				return;
			}

			if (oldVersion === 3) {
				createTable('Session', Tables.Session);
			}

			if (oldVersion === 4) {
				rebuildIndexes('ImageFile');
				rebuildIndexes('ImagePreviewFile');
			}

			for (const [tableName, schema] of tablesByName) {
				createTable(tableName, schema);
			}
		}
	});

	// Needed for E2E tests, to send non-[Serializable] values between browser and test runner
	window.devalue = {
		stringify: devalue.stringify,
		parse: devalue.parse
	};
	window.DB = _database;
	window.refreshDB = () => {
		const session = localStorage.getItem('currentSessionId') || undefined;
		if (!session) {
			console.warn('No current session ID set, cannot refresh reactive tables');
			return;
		}
		for (const table of tableNames) {
			if (!isReactiveTable(table)) continue;
			tables[table].refresh(session ?? '');
		}
	};

	return _database;
}

export function nukeDatabase() {
	if (_database) {
		_database.close();
		_database = undefined;
	}
	indexedDB.deleteDatabase(databaseName);
}

/**
 * @typedef {{
 *   [Name in keyof typeof Tables]: {
 *      value: (typeof Tables[Name])['inferIn']
 *      key: string,
 *     indexes: {
 *        [IndexName in string]: string;
 *     }
 *   }
 * }} IDBDatabaseType
 */

/**
 * @template {Array<keyof typeof Tables>} Stores Required stores
 * @template {IDBTransactionMode} [Mode="readwrite"]
 * @typedef {import('idb').IDBPTransaction<IDBDatabaseType, [...Stores, ...Array<keyof typeof Tables>], Mode>} IDBTransactionWithAtLeast
 */

/**
 * @typedef {import('idb').IDBPDatabase<IDBDatabaseType>} DatabaseHandle
 */

// Magie vodoo Typescript, pas besoin de comprendre
// Si t'es curieuxse, demande à Gwenn qui sera ravie
// de t'expliquer :3
/**
 * @type {DatabaseHandle | undefined}
 */
let _database;
