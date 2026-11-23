/// <reference types="@types/bun" />

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { differenceInSeconds, isPast } from 'date-fns';
import { dequal } from 'dequal';
import { at, zip } from 'es-toolkit';

import {
	DataRequestParams,
	DatasourceName,
	MultipleResponses,
	pathToAsset,
	ResponseWithFiles,
} from './datasource.js';
import { logger } from './progress.js';

const BASE_DIR = 'caches';

type CachedFile = {
	filename: string;
	sha1: string;
};

/** Contents of a datasource's cache */
export type DatasourceCache<
	Query extends string = string,
	Params extends Record<Query, unknown> = Record<Query, unknown>,
	Responses extends Record<Query, unknown> = Record<Query, unknown>,
> = {
	/** Entire cache needs to be wiped after that date */
	expiresAt: Date;
	/** Name of the data source */
	datasource: string;
	entries: {
		[query in Query]: Array<{
			/** This entry needs to be wiped after that date */
			expiresAt: Date;
			params: Params[query];
			response: Responses[query];
			files?: Array<CachedFile>; // WIP
		}>;
	};
};

const inmemory = new Map<DatasourceName, DatasourceCache>();

let lastWrites = new Map<DatasourceName, Date>();

export async function tryCache<R, Q extends string, P extends DataRequestParams<Q>[Q]>(
	datasource: DatasourceName,
	{
		selector,
		compute,
		expirations,
	}: {
		selector: {
			query: Q;
			paramslist: P[];
		};
		/** What to run if the cache misses. Paramslist could be a subset of selector.paramslist if there was a partial cache match  */
		compute: (
			paramslist: P[]
		) => Promise<R | MultipleResponses<R, P> | ResponseWithFiles<R> | undefined>;
		expirations: {
			/** For the entire cache file */
			file: (now: Date) => Date;
			/** For a single entry */
			entry: (now: Date, query: Q) => Date;
		};
	}
): Promise<R[]> {
	const filepath = await ensureCacheFile({ datasource, fileExpiration: expirations.file });
	const cache = await loadCacheFromDisk({ datasource, filepath });

	try {
		if (isPast(cache.expiresAt)) {
			unlinkSync(filepath);
			throw CacheMiss.entireBatch(selector.paramslist.length, 'cache too old');
		}

		return await lookupCache<R, Q, P>({ cache, datasource, selector });
	} catch (error) {
		if (!(error instanceof CacheMiss)) {
			throw new Error(`Error while retrieving cached value`, {
				cause: error,
			});
		}

		logMisses({ datasource, selector, error });

		const paramssubset = at(
			selector.paramslist,
			error.misses.map((m) => m.i)
		);

		const result = await compute(paramssubset).catch((err) => {
			throw new Error(
				`${datasource}/${selector.query} ${JSON.stringify(selector.paramslist)} failed`,
				{
					cause: err,
				}
			);
		});

		const { responses, files } = await normalizeComputeResult<R, Q, P>({
			result,
			datasource,
			selector,
		});

		await storeResponses({
			cache,
			selector,
			paramssubset,
			responses,
			files,
			entryExpiration: expirations.entry,
		});

		await writeCacheThrottled({ datasource, filepath, cache });

		inmemory.set(datasource, cache);

		return responses.filter((r) => r !== undefined);
	}
}

export function writeAllCaches() {
	for (const [datasource, cache] of inmemory) {
		const filepath = filepathToCache(datasource);
		logger.info(`writing cache to ${path.relative(import.meta.dirname, filepath)}`);
		writeFileSync(filepath, JSON.stringify(cache, null, 2));
	}
}

function fileOnDiskMatches({
	datasource,
	query,
	file: { filename, sha1 },
}: {
	datasource: string;
	query: string;
	file: CachedFile;
}) {
	const filepath = pathToAsset(datasource, query, filename);
	if (!existsSync(filepath)) return false;
	const hash = new Uint8Array(20);
	Bun.SHA1.hash(readFileSync(filepath), hash);

	return hash.toBase64() === sha1;
}

function filepathToCache(datasource: string) {
	return path.join(BASE_DIR, `${datasource}.json`);
}

class CacheMiss<D> extends Error {
	constructor(
		public readonly misses: Array<{ i: number; why: string }> = [],
		public readonly matches: Array<{ i: number; data: D }> = []
	) {
		super();
	}

	static entireBatch(batchsize: number, why: string) {
		return new CacheMiss(Array.from({ length: batchsize }).map((_, i) => ({ i, why })));
	}

	miss(i: number) {
		return this.misses.find((m) => m.i === i);
	}

	has(i: number): boolean {
		return this.misses.some((m) => m.i === i);
	}

	get(i: number): { status: 'miss'; why: string } | { status: 'match'; data: D } {
		const match = this.matches.find((m) => m.i === i);
		if (match) return { status: 'match', data: match.data };

		const miss = this.misses.find((m) => m.i === i);
		if (miss) return { status: 'miss', why: miss.why };

		return { status: 'miss', why: 'no cache miss reason given' };
	}
}

async function ensureCacheFile({
	datasource,
	fileExpiration,
}: {
	datasource: DatasourceName;
	fileExpiration: (now: Date) => Date;
}) {
	const filepath = filepathToCache(datasource);
	if (!existsSync(filepath)) {
		mkdirSync(path.dirname(filepath), { recursive: true });
		writeFileSync(
			filepath,
			JSON.stringify(
				{
					expiresAt: fileExpiration(new Date()),
					datasource,
					entries: {},
				} as DatasourceCache,
				null,
				2
			)
		);
	}
	return filepath;
}

async function loadCacheFromDisk({
	datasource,
	filepath,
}: {
	datasource: DatasourceName;
	filepath: string;
}): Promise<DatasourceCache> {
	const cache =
		inmemory.get(datasource) ??
		(JSON.parse(readFileSync(filepath).toString(), (key, value) =>
			key === 'expiresAt' ? new Date(value) : value
		) as DatasourceCache);

	inmemory.set(datasource, cache);
	return cache;
}

async function findMatchesAndMisses<R, Q extends string, P extends DataRequestParams<Q>[Q]>({
	cache,
	datasource,
	selector,
}: {
	cache: DatasourceCache;
	datasource: DatasourceName;
	selector: { query: Q; paramslist: P[] };
}): Promise<{
	matches: Array<{ i: number; data: R }>;
	misses: Array<{ i: number; why: 'entry not found' | (string & {}) }>;
}> {
	const entries = cache.entries[selector.query];
	const matches: Array<{ i: number; data: R }> = [];
	const misses: Array<{ i: number; why: 'entry not found' | (string & {}) }> = [];
	for (const [i, params] of selector.paramslist.entries()) {
		const index = entries.findIndex((entry) => dequal(entry.params, params));

		if (index === -1) {
			misses.push({ i, why: 'entry not found' });
			continue;
		}

		const entry = entries[index];

		if (isPast(entry.expiresAt)) {
			cache.entries[selector.query].splice(index, 1);
			misses.push({ i, why: 'entry too old' });
			continue;
		}

		if (entry.files) {
			const fileMisses = entry.files.filter(
				(file) =>
					!fileOnDiskMatches({
						datasource,
						query: selector.query,
						file,
					})
			);

			if (fileMisses.length > 0) {
				misses.push({
					i,
					why: `some files don't match on disk: ${fileMisses.map((f) => f.filename).join(', ')}`,
				});
				continue;
			}
		}

		matches.push({ i, data: entry.response as R });
	}

	return { matches, misses };
}

async function lookupCache<R, Q extends string, P extends DataRequestParams<Q>[Q]>({
	cache,
	datasource,
	selector,
}: {
	cache: DatasourceCache;
	datasource: DatasourceName;
	selector: { query: Q; paramslist: P[] };
}): Promise<R[]> {
	if (!(selector.query in cache.entries)) {
		throw CacheMiss.entireBatch(selector.paramslist.length, 'no entries for query');
	}

	const { matches, misses } = await findMatchesAndMisses<R, Q, P>({
		cache,
		datasource,
		selector,
	});

	if (misses.length > 0) {
		throw new CacheMiss(misses, matches);
	}

	return matches.map((m) => m.data);
}

function logMisses<Q extends string, P extends DataRequestParams<Q>[Q]>({
	datasource,
	selector,
	error,
}: {
	datasource: DatasourceName;
	selector: { query: Q; paramslist: P[] };
	error: CacheMiss<unknown>;
}): void {
	for (const [i, p] of selector.paramslist.entries()) {
		const miss = error.miss(i);
		if (!miss) continue;

		let paramsDisplay = JSON.stringify(p);

		if (typeof p === 'object' && p !== null) {
			paramsDisplay = Object.entries(p)
				.map(([key, value]) => `${key}=${JSON.stringify(value)}`)
				.join(' ');
		}

		const bulkMarker =
			selector.paramslist.length > 1 ? `(${i}/${selector.paramslist.length - 1})` : '';

		logger.info(
			`${datasource}/${selector.query}` + bulkMarker,
			paramsDisplay,
			miss.why === 'entry not found' ? '' : `  (${miss.why})`
		);
	}
}

async function normalizeComputeResult<R, Q extends string, P extends DataRequestParams<Q>[Q]>({
	result,
	datasource,
	selector,
}: {
	result: R | MultipleResponses<R, P> | ResponseWithFiles<R> | undefined;
	datasource: DatasourceName;
	selector: { query: Q; paramslist: P[] };
}): Promise<{ responses: Array<R | undefined>; files: CachedFile[] | undefined }> {
	let responses: Array<R | undefined>;
	let files: CachedFile[] | undefined;

	if (result instanceof ResponseWithFiles) {
		responses = [result.response];
		files = await result.prepareForCache(datasource, selector.query);
	} else if (result instanceof MultipleResponses) {
		responses = result.ordered(selector.paramslist);
		files = undefined;
	} else {
		responses = [result];
		files = undefined;
	}

	return { responses, files };
}

async function storeResponses<R, Q extends string, P extends DataRequestParams<Q>[Q]>({
	cache,
	selector,
	paramssubset,
	responses,
	files,
	entryExpiration,
}: {
	cache: DatasourceCache;
	selector: { query: Q; paramslist: P[] };
	paramssubset: P[];
	responses: Array<R | undefined>;
	files: CachedFile[] | undefined;
	entryExpiration: (now: Date, query: Q) => Date;
}): Promise<void> {
	cache.entries[selector.query] ??= [];
	for (const [params, response] of zip(paramssubset, responses)) {
		if (!response) continue;
		cache.entries[selector.query].push({
			expiresAt: entryExpiration(new Date(), selector.query),
			params,
			response,
			files,
		});
	}
}

async function writeCacheThrottled({
	datasource,
	filepath,
	cache,
}: {
	datasource: DatasourceName;
	filepath: string;
	cache: DatasourceCache;
}): Promise<void> {
	const lastWrite = lastWrites.get(datasource);
	if (!lastWrite || differenceInSeconds(new Date(), lastWrite) >= 30) {
		logger.info(`writing cache to ${path.relative(import.meta.dirname, filepath)}`);
		writeFileSync(filepath, JSON.stringify(cache, null, 2));
		lastWrites.set(datasource, new Date());
	}
}
