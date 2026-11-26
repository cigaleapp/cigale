import { existsSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { dequal } from 'dequal';

import { DatasourceCache } from '../lib/caching.ts';
import config from './config.ts';

type CacheStats = {
	updatedAt: string;
	files: Record<string, CacheFileStat>;
};

type CacheFileStat = {
	datasource: string;
	expiresAt: string | Date;
	sizeBytes: number | null;
	totalEntries: CacheEntryCounts;
	queries: Record<string, CacheEntryCounts>;
};

type CacheEntryCounts = { total: number; stale: number; fresh: number };

// Recompute this datasource's entry in cache-stats.json after a mutation.
function updateCacheStats(datasource: string, filepath: string | null) {
	try {
		const stats: CacheStats = (() => {
			try {
				return JSON.parse(readFileSync(config.CACHE_STATS_FILE, 'utf8'));
			} catch {
				return { updatedAt: new Date().toISOString(), datasources: [] };
			}
		})();

		if (filepath) {
			const cache = readCacheFile(filepath);
			const now = new Date();
			const queries: Record<string, CacheEntryCounts> = {};
			const totalEntries = { total: 0, stale: 0, fresh: 0 };

			for (const [query, entries] of Object.entries(cache.entries)) {
				const counts = { total: entries.length, stale: 0, fresh: 0 };
				for (const entry of entries) {
					if (new Date(entry.expiresAt) < now) counts.stale++;
					else counts.fresh++;
				}
				queries[query] = counts;
				totalEntries.total += counts.total;
				totalEntries.stale += counts.stale;
				totalEntries.fresh += counts.fresh;
			}

			stats.files[filepath] = {
				datasource: cache.datasource,
				expiresAt: cache.expiresAt,
				sizeBytes: existsSync(filepath) ? statSync(filepath).size : null,
				totalEntries,
				queries,
			};
		} else {
			const found = Object.entries(stats.files).find(
				([, entry]) => entry.datasource === datasource
			);

			if (found) delete stats.files[found[0]];
		}

		stats.updatedAt = new Date().toISOString();
		const tmp = `${config.CACHE_STATS_FILE}.tmp`;
		writeFileSync(tmp, JSON.stringify(stats, null, 2));
		renameSync(tmp, config.CACHE_STATS_FILE);
	} catch (err) {
		console.error('Failed to update cache stats file:', err);
	}
}

// The regeneration process writes cache stats (per-query entry counts) to
// this file whenever a cache is written.
export function readCacheStats(): unknown {
	try {
		return JSON.parse(readFileSync(config.CACHE_STATS_FILE, 'utf8'));
	} catch {
		return null;
	}
}

// Handle DELETE /api/caches/... . Returns null when the path does not match.
//   DELETE /api/caches/:datasource            -> entire datasource
//   DELETE /api/caches/:datasource/:query     -> entire query
//   DELETE /api/caches/:datasource/:query?k=v -> entries whose params match
//     the given params (each value JSON-decoded when possible, otherwise kept
//     as a string)
export function handleCacheDelete(
	pathname: string,
	url: URL,
	isRegenRunning: boolean
): Response | null {
	if (!pathname.startsWith('/api/caches/')) {
		return null;
	}
	if (isRegenRunning) {
		return Response.json(
			{ error: 'Regeneration is running; its in-memory cache would overwrite the change' },
			{ status: 409 }
		);
	}
	const rest = pathname.slice('/api/caches/'.length);
	const slash = rest.indexOf('/');
	const datasource = decodeURIComponent(slash === -1 ? rest : rest.slice(0, slash));
	const query = slash === -1 ? null : decodeURIComponent(rest.slice(slash + 1));
	const filepath = cacheFilePath(datasource);
	if (!filepath) {
		return new Response('Forbidden', { status: 403 });
	}
	if (!existsSync(filepath)) {
		return Response.json({ error: `No cache for datasource '${datasource}'` }, { status: 404 });
	}

	if (query === null) {
		unlinkSync(filepath);
		updateCacheStats(datasource, null);
		return Response.json({ removed: datasource });
	}

	const cache = readCacheFile(filepath);
	if (!(query in cache.entries)) {
		return Response.json({ error: `No entries for query '${query}'` }, { status: 404 });
	}

	if (url.search === '') {
		delete cache.entries[query];
		writeCacheFile(filepath, cache);
		updateCacheStats(datasource, filepath);
		return Response.json({ removed: `${datasource}/${query}` });
	}

	const params: Record<string, unknown> = {};
	for (const [key, value] of url.searchParams) {
		try {
			params[key] = JSON.parse(value);
		} catch {
			params[key] = value;
		}
	}
	// Partial match: an entry is removed when every given key
	// deep-equals the corresponding key in its params.
	const matches = (entryParams: unknown): boolean => {
		if (typeof entryParams !== 'object' || entryParams === null || Array.isArray(entryParams)) {
			return dequal(entryParams, params);
		}
		return Object.entries(params).every(([k, v]) =>
			dequal((entryParams as Record<string, unknown>)[k], v)
		);
	};
	const before = cache.entries[query].length;
	cache.entries[query] = cache.entries[query].filter((entry) => !matches(entry.params));
	const removed = before - cache.entries[query].length;
	if (removed === 0) {
		return Response.json(
			{ error: `No entries matching ${JSON.stringify(params)}` },
			{ status: 404 }
		);
	}
	writeCacheFile(filepath, cache);
	updateCacheStats(datasource, filepath);
	return Response.json({ removed: `${datasource}/${query}`, count: removed, params });
}

function cacheFilePath(datasource: string): string | null {
	const resolved = path.resolve(
		config.DATA_DIR,
		'caches',
		'.' + path.posix.normalize('/' + datasource) + '.json'
	);
	const root = path.resolve(config.DATA_DIR, 'caches');
	if (resolved !== root && !resolved.startsWith(root + path.sep)) {
		return null;
	}
	return resolved;
}

function readCacheFile(filepath: string): DatasourceCache {
	return JSON.parse(readFileSync(filepath, 'utf8'));
}

function writeCacheFile(filepath: string, cache: unknown) {
	const tmp = `${filepath}.tmp`;
	writeFileSync(tmp, JSON.stringify(cache, null, 2));
	renameSync(tmp, filepath);
}
