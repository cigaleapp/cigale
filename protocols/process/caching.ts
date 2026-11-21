/// <reference types="@types/bun" />

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { differenceInSeconds, isPast } from 'date-fns';
import { dequal } from 'dequal';
import { zip } from 'es-toolkit';

import { DataRequestParams, DatasourceName, MultipleResponses, Option } from './modules';
import { logger } from './progress';

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

export class ResponseWithFiles<R> {
	response: R;
	files: File[];
	/** Map filenames to sha1 base64 hashes */
	hashes?: Map<string, string>;

	constructor({ response, files = [] }: { response: R; files?: File[] }) {
		this.response = response;
		this.files = files;
	}

	async writeAssets(datasource: string, query: string) {
		this.hashes ??= new Map();
		const sha1 = new Uint8Array(20);

		for (const file of this.files) {
			const bytes = new Uint8Array(await file.arrayBuffer());

			mkdirSync(path.dirname(pathToAsset(datasource, query, file.name)), { recursive: true });
			writeFileSync(pathToAsset(datasource, query, file.name), bytes);

			Bun.SHA1.hash(bytes, sha1);
			this.hashes.set(file.name, sha1.toBase64());
		}
	}

	async prepareForCache(datasource: string, query: string) {
		await this.writeAssets(datasource, query);

		return this.files.map((file) => ({
			filename: file.name,
			sha1: this.hashes!.get(file.name)!,
		}));
	}
}

function pathToAsset(datasource: string, query: string, filename: string) {
	return path.join('assets', datasource, query, filename);
}

function fileOnDiskMatches(datasource: string, query: string, { filename, sha1 }: CachedFile) {
	const filepath = pathToAsset(datasource, query, filename);
	if (!existsSync(filepath)) return false;
	const hash = new Uint8Array(20);
	Bun.SHA1.hash(readFileSync(filepath), hash);

	return hash.toBase64() === sha1;
}

function filepathToCache(datasource: string) {
	return path.join(BASE_DIR, `${datasource}.json`);
}

class CacheMiss extends Error {
	constructor(public readonly misses: Array<{ i: number; why: string }> = []) {
		super();
	}
}

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
		/** What to run if the cache misses */
		compute: () => Promise<R | MultipleResponses<R, P> | ResponseWithFiles<R>>;
		expirations: {
			/** For the entire cache file */
			file: (now: Date) => Date;
			/** For a single entry */
			entry: (now: Date, query: Q) => Date;
		};
	}
): Promise<R[]> {
	const filepath = filepathToCache(datasource);
	if (!existsSync(filepath)) {
		mkdirSync(path.dirname(filepath), { recursive: true });
		writeFileSync(
			filepath,
			JSON.stringify(
				{
					expiresAt: expirations.file(new Date()),
					datasource,
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
		const matches: typeof entries = [];
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
					(file) => !fileOnDiskMatches(datasource, selector.query, file)
				);

				if (fileMisses.length > 0) {
					misses.push({
						i,
						why: `some files don't match on disk: ${fileMisses.map((f) => f.filename).join(', ')}`,
					});
					continue;
				}
			}

			matches.push(entry);
		}

		if (misses.length > 0) {
			throw new CacheMiss(misses);
		}

		return matches.map((m) => m.response as R);
	} catch (error) {
		const msg = String(error).replace(/^Error: /, '');

		const reasons =
			error instanceof CacheMiss
				? error.misses
				: selector.paramslist.map((_, i) => ({ i, why: msg }));

		for (const [i, p] of selector.paramslist.entries()) {
			const { why } = reasons.find((r) => r.i === i) ?? { why: msg };

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
				why === 'entry not found' ? '' : `  (${why})`
			);
		}

		const result = await compute().catch((err) => {
			throw new Error(`${selector.query} ${JSON.stringify(selector.paramslist)} failed`, {
				cause: err,
			});
		});

		/** In the same order as selector.paramslist. Undefined means no result was returned for that param */
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

		cache.entries[selector.query] ??= [];
		for (const [params, response] of zip(selector.paramslist, responses)) {
			if (!response) continue;
			cache.entries[selector.query].push({
				expiresAt: expirations.entry(new Date(), selector.query),
				params,
				response,
				files,
			});
		}

		const lastWrite = lastWrites.get(datasource);
		if (!lastWrite || differenceInSeconds(new Date(), lastWrite) >= 30) {
			logger.info(`writing cache to ${path.relative(import.meta.dirname, filepath)}`);
			writeFileSync(filepath, JSON.stringify(cache, null, 2));
			lastWrites.set(datasource, new Date());
		}

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
