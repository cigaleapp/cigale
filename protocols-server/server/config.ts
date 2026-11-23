import path from 'node:path';

export const PORT = Number(process.env.PORT ?? 3000);
export const DATA_DIR = process.env.DATA_DIR ?? '.';
// Protocol manifests (yaml) + generated .json live here. In the container this
// resolves to /protocols (server code is at /app/server); locally to <repo>/protocols.
export const PROTOCOLS_DIR =
	process.env.PROTOCOLS_DIR ?? path.join(import.meta.dir, '..', '..', 'protocols');

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
