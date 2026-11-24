import { existsSync } from 'node:fs';
import path from 'node:path';

import arkenv, { type } from '@arkenv/core';

const env = arkenv({
	PORT: 'number.port = 3000',
	DATA_DIR: 'string = "."',
	LOCAL_DEV_ORIGIN: 'string.url = "http://localhost:3000"',

	/**
	 * Origin of the public web app. Used at startup to rewrite the hardcoded
	 * `http://localhost:3000` references in the protocol manifests and to build
	 * the protocol registry URLs.
	 */
	'WEB_ORIGIN?': 'string.url',

	/**
	 * Protocol manifests (yaml) + generated .json live here. In the container this
	 * resolves to /protocols (server code is at /app/server); locally to <repo>/protocols.
	 */
	PROTOCOLS_DIR: type.string.default(() => findAtRoot('protocols')!),

	/**
	 * JSON schemas (protocol/registry/results). Locally this resolves to
	 * <repo>/static; in the container the server code is at /app and the schemas
	 * are copied to /app/static, so try both layouts.
	 */
	STATIC_DIR: type.string.default(() => findAtRoot('static')!),

	/**
	 * The regeneration process (spawned with cwd: DATA_DIR) writes a progress
	 * snapshot to this file when PROGRESS_FILE=true.
	 */
	'PROGRESS_FILE?': 'string',

	/**
	 * The regeneration process writes cache stats (per-query entry counts) to
	 * this file whenever a cache is written.
	 */
	'CACHE_STATS_FILE?': 'string',

	/**
	 * Simple accountless password auth: the password is set via the API_PASSWORD
	 * env var. API clients send it as `Authorization: Bearer <password>`.
	 * Browsers use a cookie: GET /api/login?password=... verifies the password
	 * and sets an HttpOnly cookie holding its sha256 (not the password itself).
	 */
	'API_PASSWORD?': 'string > 0',

	AUTH_COOKIE: 'string = "api_password"',
	LOG_MAX_LINES: 'number.integer >= 0 = 100',
	PROGRESS_FILE_REFRESH_MS: 'number.integer > 500 = 10000',
	PROGRESS_FILE_ENABLED: 'boolean = false',
	'ASSETS_URL_BASE?': 'string.url',
	JJ_RATELIMIT_MAX_WAIT_SECONDS: 'number.integer > 0 = 60',
});

if (!env.WEB_ORIGIN) {
	console.warn(
		`WEB_ORIGIN env var not set, falling back to ${env.LOCAL_DEV_ORIGIN}. THIS WILL NOT WORK IN PROD!`
	);
}

const WEB_ORIGIN = env.WEB_ORIGIN ?? env.LOCAL_DEV_ORIGIN;

export default {
	...env,
	WEB_ORIGIN,
	PROGRESS_FILE: env.CACHE_STATS_FILE ?? path.join(env.DATA_DIR, 'progress.json'),
	CACHE_STATS_FILE: env.PROGRESS_FILE ?? path.join(env.DATA_DIR, 'cache-stats.json'),
	ASSETS_URL_BASE: env.ASSETS_URL_BASE ?? `${WEB_ORIGIN}/assets`,
};

function findAtRoot(filepath: string) {
	return [
		// Local dev
		path.join(import.meta.dir, '..', '..', filepath),
		// Server container
		path.join(import.meta.dir, '..', filepath),
	].find((p) => existsSync(p));
}
