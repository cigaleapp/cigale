import { existsSync } from 'node:fs';
import path from 'node:path';

export const PORT = Number(process.env.PORT ?? 3000);
export const DATA_DIR = process.env.DATA_DIR ?? '.';
// Origin of the public web app. Used at startup to rewrite the hardcoded
// `http://localhost:3000` references in the protocol manifests and to build
// the protocol registry URLs.
export const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

// Protocol manifests (yaml) + generated .json live here. In the container this
// resolves to /protocols (server code is at /app/server); locally to <repo>/protocols.
export const PROTOCOLS_DIR =
	process.env.PROTOCOLS_DIR ?? path.join(import.meta.dir, '..', '..', 'protocols');

// JSON schemas (protocol/registry/results). Locally this resolves to
// <repo>/static; in the container the server code is at /app and the schemas
// are copied to /app/static, so try both layouts.
export const STATIC_DIR =
	[
		path.join(import.meta.dir, '..', 'static'),
		path.join(import.meta.dir, '..', '..', 'static'),
	].find((p) => existsSync(p)) ?? path.join(import.meta.dir, '..', '..', 'static');

// The regeneration process (spawned with cwd: DATA_DIR) writes a progress
// snapshot to this file when PROGRESS_FILE=true.
export const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');

// The regeneration process writes cache stats (per-query entry counts) to
// this file whenever a cache is written.
export const CACHE_STATS_FILE = path.join(DATA_DIR, 'cache-stats.json');

// Simple accountless password auth: the password is set via the API_PASSWORD
// env var. API clients send it as `Authorization: Bearer <password>`.
// Browsers use a cookie: GET /api/login?password=... verifies the password
// and sets an HttpOnly cookie holding its sha256 (not the password itself).
export const API_PASSWORD = process.env.API_PASSWORD;
export const AUTH_COOKIE = 'api_password';

export const LOG_MAX_LINES = Number.parseInt(process.env.LOG_MAX_LINES ?? '100');

export const PROGRESS_FILE_REFRESH_MS = Number(process.env.PROGRESS_FILE_REFRESH_MS ?? 10_000);

export const PROGRESS_FILE_ENABLED = process.env.PROGRESS_FILE === 'true';
