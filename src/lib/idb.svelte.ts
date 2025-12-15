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

/** @type {number | null} */
export const previewingPrNumber: number | null =
	import.meta.env.previewingPrNumber === 'null' ? null : import.meta.env.previewingPrNumber;

export const databaseName = previewingPrNumber ? `previews/pr-${previewingPrNumber}` : 'database';
export const databaseRevision = 4;

export type NonReactiveTableNames =
	(typeof import('./database.js').NO_REACTIVE_STATE_TABLES)[number];

export type ReactiveTableNames = Exclude<keyof typeof Tables, NonReactiveTableNames>;

// @ts-ignore
const tableNames: Array<keyof typeof Tables> = Object.keys(Tables);

export const _tablesState: {
	[Table in ReactiveTableNames]: Array<(typeof Tables)[Table]['infer']>;
} = $state({
	Image: [],
	Metadata: [],
	Observation: [],
	Protocol: [],
	Settings: [],
	Session: []
});

// @ts-expect-error
export const tables: { [Name in ReactiveTableNames]: ReturnType<typeof wrangler<Name>> } & {
	initialize: (sessionId: string | null) => Promise<void>;
} = {
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

function wrangler<Table extends ReactiveTableNames>(table: Table) {
	return {
		get state() {
			return _tablesState[table];
		},
		/** @param {string|null} sessionId */
		async refresh(sessionId: string | null) {
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
		/** @param {string} key  */
		get: async (key: string) => get(table, key),
		/** @param {string} key  */
		getFromState: (key: string) => _tablesState[table].find((item) => item.id === key),
		/**
		 * @param {typeof Tables[Table]['inferIn']} value
		 * @returns {Promise<typeof Tables[Table]['inferOut']>}
		 */
		async set(
			value: (typeof Tables)[Table]['inferIn']
		): Promise<(typeof Tables)[Table]['inferOut']> {
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
		 * @returns {Promise<boolean>} true if the item was found and updated, false otherwise
		 */
		async update<Prop extends keyof (typeof Tables)[Table]['inferIn']>(
			key: string,
			property: Prop,
			value: (typeof Tables)[Table]['inferIn'][Prop]
		): Promise<boolean> {
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
		async add(
			value: Omit<(typeof Tables)[Table]['inferIn'], 'id'>
		): Promise<(typeof Tables)[Table]['inferOut']> {
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
		 * @param  id key of the object to remove
		 */
		async remove(id: string | IDBKeyRange) {
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
		 */
		async do(
			actions: (
				store: import('idb').IDBPObjectStore<IDBDatabaseType, [Table], Table, 'readwrite'>
			) => void | Promise<void>
		) {
			const loglabel = `do ${table} #${nanoid()}`;
			console.debug(loglabel);
			await openTransaction([table], { mode: 'readwrite' }, async (tx) => {
				await actions(tx.objectStore(table));
			});
		},
		list: async (
			index: import('idb').IndexNames<IDBDatabaseType, Table>,
			key: IDBKeyRange | string
		) => (index && key ? listByIndex(table, index, key) : list(table)),
		all: () => iterator(table),
		count: async () => {
			const db = await openDatabase();
			return await db.count(table);
		},
		/** Do not go through validation or type morphing, manipulate the underlying database values directly. Useful for performance reasons, when changing only a property inside of an object and leaving the others unchanged, for example */
		raw: {
			async set(value: (typeof Tables)[Table]['inferIn']) {
				const db = await openDatabase();
				return await db.put(table, value);
			},
			async get(key: string): Promise<(typeof Tables)[Table]['inferIn'] | undefined> {
				const db = await openDatabase();
				return await db.get(table, key);
			}
		}
	};
}

export async function set<TableName extends keyof typeof Tables>(
	tableName: TableName,
	value: (typeof Tables)[TableName]['inferIn']
) {
	const db = await openDatabase();
	const validator = Tables[tableName];
	validator.assert(value);
	return await db.put(tableName, value).then((result) => {
		return result;
	});
}

export async function clear<TableName extends keyof typeof Tables>(table: TableName) {
	const db = await openDatabase();
	await db.clear(table).then((result) => {
		return result;
	});
}

export async function get<TableName extends keyof typeof Tables>(
	tableName: TableName,
	key: string
): Promise<undefined | (typeof Tables)[TableName]['infer']> {
	const db = await openDatabase();
	const validator = Tables[tableName];
	return await db.get(tableName, key).then((value) => {
		const out = value ? validator.assert(value) : undefined;
		return out;
	});
}

export async function list<TableName extends keyof typeof Tables>(
	tableName: TableName,
	keyRange: IDBKeyRange | undefined = undefined
): Promise<Array<(typeof Tables)[TableName]['infer']>> {
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

export async function listByIndex<TableName extends keyof typeof Tables>(
	tableName: TableName,
	indexName: import('idb').IndexNames<IDBDatabaseType, TableName>,
	keyRange: IDBKeyRange | string | undefined = undefined
): Promise<Array<(typeof Tables)[TableName]['infer']>> {
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
 */
export async function drop<TableName extends keyof typeof Tables>(
	table: TableName,
	id: string | IDBKeyRange
): Promise<void> {
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

export async function* iterator<TableName extends keyof typeof Tables>(
	tableName: TableName,
	index: string | undefined = undefined
): AsyncGenerator<(typeof Tables)[TableName]['infer'], void> {
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
 */
export function dependencyURI(
	tableName: keyof typeof Tables,
	key: string,
	...additionalPath: string[]
): `idb://${string}` {
	// @ts-expect-error
	return ['idb:/', tableName, key, ...additionalPath].filter(Boolean).join('/');
}

/**
 * Create a transaction, execute `actions`. Commits the transaction and refreshes reactive tables' state for you
 * @param tableNames
 * @param param1
 * @param param1.mode
 * @param param1.session current session ID, used to refresh session-dependent reactive tables. Defaults to localStorage's currentSessionId
 * @param param1.tx already existing transaction to use instead of creating a new one. In that case, the transaction is not committed and the reactive tables' state is not refreshed, since it's assumed that a openTransactions() call higher up in the call stack will already do this
 * @param actions
 */
export async function openTransaction<
	Tables extends Array<keyof typeof Tables>,
	Mode extends IDBTransactionMode = 'readwrite'
>(
	tableNames: Tables,
	{
		mode,
		session
	}: { mode?: Mode; session?: string; tx?: IDBTransactionWithAtLeast<Tables, Mode> },
	actions: (tx: IDBTransactionWithAtLeast<Tables, Mode>) => void | Promise<void>
) {
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

	// @ts-expect-error
	const tablesByName: Array<
		{ [K in keyof typeof Tables]: [K, (typeof Tables)[K]] }[keyof typeof Tables]
	> = Object.entries(Tables);

	_database = await openDB(databaseName, databaseRevision, {
		upgrade(db, oldVersion) {
			const createTable = (
				tableName: keyof typeof Tables,
				schema: import('arktype').Type
			) => {
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

export type IDBDatabaseType = {
	[Name in keyof typeof Tables]: {
		value: (typeof Tables)[Name]['inferIn'];
		key: string;
		indexes: {
			[IndexName in string]: string;
		};
	};
};

/**
 * @template  Stores Required stores
 */
export type IDBTransactionWithAtLeast<
	Stores extends Array<keyof typeof Tables>,
	Mode extends IDBTransactionMode = 'readwrite'
> = import('idb').IDBPTransaction<
	IDBDatabaseType,
	[...Stores, ...Array<keyof typeof Tables>],
	Mode
>;

export type DatabaseHandle = import('idb').IDBPDatabase<IDBDatabaseType>;

let _database: DatabaseHandle | undefined;
