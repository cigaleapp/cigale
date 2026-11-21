/// <reference types="@types/bun" />

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { differenceInSeconds, isPast } from 'date-fns';
import { dequal } from 'dequal';

import { DatasourceName, Option } from './modules';

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

export async function tryCache<R, Q extends string>(
	datasource: DatasourceName,
	{
		selector,
		compute,
		expirations,
	}: {
		selector: {
			query: Q;
			params: Record<string, unknown>;
		};
		/** What to run if the cache misses */
		compute: () => Promise<R | ResponseWithFiles<R>>;
		expirations: {
			/** For the entire cache file */
			file: (now: Date) => Date;
			/** For a single entry */
			entry: (now: Date, query: Q) => Date;
		};
	}
): Promise<R> {
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
		const index = entries.findIndex((entry) => dequal(entry.params, selector.params));

		if (index === -1) throw new Error('entry not found');

		const entry = entries[index];

		if (isPast(entry.expiresAt)) {
			cache.entries[selector.query].splice(index, 1);
			throw new Error('entry too old');
		}

		if (entry.files) {
			const misses = entry.files.filter(
				(file) => !fileOnDiskMatches(datasource, selector.query, file)
			);

			if (misses.length > 0) {
				throw new Error(
					`some files don't match on disk: ${misses.map((f) => f.filename).join(', ')}`
				);
			}
		}

		return entry.response as R;
	} catch (error) {
		const why = String(error).replace(/^Error: /, '');
		console.info(
			`${datasource}/${selector.query}`,
			Object.entries(selector.params)
				.map(([key, value]) => `${key}=${JSON.stringify(value)}`)
				.join(' '),
			why === 'entry not found' ? '' : `  (${why})`
		);

		const result = await compute().catch((err) => {
			throw new Error(`${selector.query} ${JSON.stringify(selector.params)} failed`, {
				cause: err,
			});
		});

		let response: R;
		let files: CachedFile[] | undefined;

		if (result instanceof ResponseWithFiles) {
			response = result.response;
			files = await result.prepareForCache(datasource, selector.query);
		} else {
			response = result;
			files = undefined;
		}

		cache.entries[selector.query] ??= [];
		cache.entries[selector.query].push({
			expiresAt: expirations.entry(new Date(), selector.query),
			params: selector.params,
			response,
			files,
		});

		const lastWrite = lastWrites.get(datasource);
		if (!lastWrite || differenceInSeconds(new Date(), lastWrite) >= 30) {
			console.info(`writing cache to ${path.relative(import.meta.dirname, filepath)}`);
			writeFileSync(filepath, JSON.stringify(cache, null, 2));
			lastWrites.set(datasource, new Date());
		}

		inmemory.set(datasource, cache);

		return response;
	}
}

export function writeAllCaches() {
	for (const [datasource, cache] of inmemory) {
		writeFileSync(filepathToCache(datasource), JSON.stringify(cache, null, 2));
	}
}
