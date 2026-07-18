import type { Tables } from './database.js';
import type { DatabaseHandle, IDBTransactionWithAtLeast } from './idb.svelte.js';

import { prefixIDBKeyRange } from './utils.js';

/**
 * Normalize a search index string or a search query
 * - Lowercase it
 * - Normalize unicode characters
 * - Remove accents
 */
export function normalizeSearchStrings(s: string) {
	return s
		.normalize('NFKD')
		.replaceAll(/\p{Diacritic}/gu, '')
		.toLowerCase();
}

type SearchableTableName = {
	[K in keyof typeof Tables]: (typeof Tables)[K]['inferOut'] extends {
		_search: string[];
		id: string;
	}
		? K
		: never;
}[keyof typeof Tables];

/**
 * Loads all indices and returns a function that can be used to search
 */
export function makeSearcher<TableName extends SearchableTableName>({
	db,
	tables,
	table,
	filter = () => true,
	max: maxCount = Infinity,
}: {
	db: DatabaseHandle;
	tables: typeof Tables;
	table: TableName;
	/** Only keep results with this primary key (id) */
	filter?: (id: string) => boolean;
	max?: number;
}) {
	console.time(`make ${table} searcher`);

	async function* search(query: string) {
		const seen = new Set<string>();
		let yielded = 0;

		const index = db.transaction(table).store.index('_search');
		const range = prefixIDBKeyRange(normalizeSearchStrings(query));

		for await (const { primaryKey, value: object } of index.iterate(range)) {
			if (yielded >= maxCount) break;
			if (seen.has(primaryKey)) continue;

			// This instead of early return so it gets added to seen
			// even if skipped, which is better perf
			if (filter(primaryKey)) {
				yield tables[table].assert(object);
				yielded++;
			}

			seen.add(primaryKey);
		}
	}

	console.timeEnd(`make ${table} searcher`);

	return search;
}

export async function recomputeSearchIndex<TableName extends SearchableTableName>(
	tx: IDBTransactionWithAtLeast<[TableName], 'readwrite' | 'versionchange'>,
	// we need to pass it cuz importing it in $lib/search would create a circular dep
	tables: typeof Tables,
	table: TableName,
	/** null to recompute all objects of the table */
	id: string | null
) {
	const store = tx.objectStore(table);

	if (!id) {
		const ids = await store.getAllKeys();
		for (const id of ids) {
			await recomputeSearchIndex(tx, tables, table, id);
		}

		return;
	}

	const current = await store.get(id);
	if (!current) {
		console.warn(
			`Could not recompute search index for ${table} object with id ${id} (not found)`
		);
		return;
	}

	try {
		await store.put({
			...current,
			_search: tables[table].meta.table?.searchIndex?.(current) ?? [],
		});
	} catch (error) {
		console.error(`Couldn't recompute search index for ${table} object with id ${id}:`, error);
	}
}
