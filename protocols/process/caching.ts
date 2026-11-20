import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { isPast } from 'date-fns';
import { dequal } from 'dequal';

import { DatasourceName } from './modules';

const BASE_DIR = 'caches';

/** Contents of a datasource's cache */
export type DatasourceCache<
	Query extends string = string,
	Params extends Record<Query, unknown> = Record<Query, unknown>,
	Responses extends Record<Query, unknown> = Record<Query, unknown>,
> = {
	/** Entire cache needs to be wiped after that date */
	expiresAt: Date;
	entries: {
		[query in Query]: Array<{
			/** This entry needs to be wiped after that date */
			expiresAt: Date;
			params: Params[query];
			response: Responses[query];
		}>;
	};
};

const inmemory = new Map<DatasourceName, DatasourceCache>();

export async function tryCache<R, Q extends string>(
	datasource: DatasourceName,
	{
		selector,
		compute,
		expirations,
	}: {
		selector: {
			query: Q;
			params: unknown;
		};
		/** What to run if the cache misses */
		compute: () => Promise<R>;
		expirations: {
			/** For the entire cache file */
			file: (now: Date) => Date;
			/** For a single entry */
			entry: (now: Date, query: Q) => Date;
		};
	}
): Promise<R> {
	const filepath = path.join(BASE_DIR, `${datasource}.json`);
	if (!existsSync(filepath)) {
		mkdirSync(path.dirname(filepath), { recursive: true });
		writeFileSync(
			filepath,
			JSON.stringify(
				{
					expiresAt: expirations.file(new Date()),
					entries: {},
				} as DatasourceCache,
				null,
				2
			)
		);
	}

	const cache =
		inmemory.get(datasource) ??
		(JSON.parse(readFileSync(filepath).toString(), (key, value) =>
			key === 'expiresAt' ? new Date(value) : value
		) as DatasourceCache);

	inmemory.set(datasource, cache);

	try {
		if (isPast(cache.expiresAt)) {
			unlinkSync(filepath);
			throw new Error('cache too old');
		}

		if (!(selector.query in cache.entries)) {
			throw new Error('no entries for query');
		}

		const entries = cache.entries[selector.query];
		const index = entries.findIndex((entry) => dequal(entry.params, selector.params));

		if (index === -1) throw new Error('entry not found');

		const entry = entries[index];

		if (isPast(entry.expiresAt)) {
			delete cache.entries[index];
			throw new Error('entry too old');
		}

		return entry.response as R;
	} catch (error) {
		console.warn(
			`Cache miss for ${selector.query} ${JSON.stringify(selector.params)}: ${error}`
		);

		const result = await compute().catch((err) => {
			throw new Error(`${selector.query} ${JSON.stringify(selector.params)} failed`, {
				cause: err,
			});
		});

		cache.entries[selector.query] ??= [];
		cache.entries[selector.query].push({
			expiresAt: expirations.entry(new Date(), selector.query),
			params: selector.params,
			response: result,
		});

		writeFileSync(filepath, JSON.stringify(cache, null, 2));
		inmemory.set(datasource, cache);

		return result;
	}
}
