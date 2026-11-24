import { existsSync, statSync } from 'node:fs';

import { Server } from 'bun';

import { amendManifests, writeRegistry } from '../scripts/generate-protocol-registry.js';
import { handleLogin, isAuthorized, isPublicRoute, unauthorized } from './auth.js';
import { handleCacheDelete, readCacheStats } from './caches.js';
import { DATA_DIR, PORT, PROTOCOLS_DIR, WEB_ORIGIN } from './config.js';
import { apiIndexPage, dirListing, indexPage } from './html.js';
import { getRegenStatus, readProgress, readRegenLog, regenerate } from './regeneration.js';
import {
	resolveUnderDataDir,
	resolveUnderProtocolsDir,
	resolveUnderStaticDir,
	serveFile,
} from './static.js';

export function startServer(): Server {
	if (!process.env.WEB_ORIGIN) {
		console.warn(
			`WEB_ORIGIN env var not set, falling back to http://localhost:3000. THIS WILL NOT WORK IN PROD!`
		);
	}
	const server = Bun.serve({
		port: PORT,
		async fetch(req) {
			const url = new URL(req.url);
			const pathname = url.pathname;

			// Auth gate: everything except protocols, /options/, /assets/,
			// GET /api/regenerate and GET /api/caches requires the password.
			if (!isPublicRoute(pathname, req.method) && !isAuthorized(req)) {
				return unauthorized();
			}

			// Browsable index
			if (pathname === '/') {
				return indexPage();
			}

			// Health check
			if (pathname === '/health') {
				return Response.json({ ok: true });
			}

			// API index (GET only; POST/GET /api/regenerate handled below)
			if (pathname === '/api/' && req.method === 'GET') {
				return apiIndexPage();
			}

			// Login for browsers: verifies the password and sets an HttpOnly
			// cookie (holding its sha256, not the password itself).
			if (pathname === '/api/login' && req.method === 'GET') {
				return handleLogin(url.searchParams.get('password') ?? '');
			}

			// Regeneration API
			if (pathname === '/api/regenerate' && req.method === 'POST') {
				if (!regenerate()) {
					return Response.json(
						{ error: 'Regeneration already in progress' },
						{ status: 409 }
					);
				}
				return Response.json({ started: true });
			}

			// Regeneration status + progress, with a link to the log.
			if (pathname === '/api/regenerate' && req.method === 'GET') {
				return Response.json({
					...getRegenStatus(),
					progress: readProgress(),
					logs_url: new URL('/api/regeneration/log.txt', WEB_ORIGIN),
				});
			}

			// Last 100 lines of the regeneration process's stdout+stderr
			// (auth required; the log may contain sensitive output).
			if (pathname === '/api/regeneration/log.txt' && req.method === 'GET') {
				const log = readRegenLog();
				if (log === null) {
					return Response.json({ error: 'No regeneration has run yet' }, { status: 404 });
				}
				return new Response(log, {
					headers: { 'Content-Type': 'text/plain; charset=utf-8' },
				});
			}

			// Cache stats (per-query entry counts per datasource)
			if (pathname === '/api/caches' && req.method === 'GET') {
				return Response.json(readCacheStats());
			}

			// Cache removal (auth already enforced by the gate above)
			if (pathname.startsWith('/api/caches/') && req.method === 'DELETE') {
				const response = handleCacheDelete(
					pathname,
					url,
					getRegenStatus().state === 'running'
				);
				if (response) {
					return response;
				}
			}

			// Static file serving: /process/options/... and /process/assets/...
			// (the canonical URLs used by the protocol YAMLs), plus /options/...
			// and /assets/... as shorter aliases. All resolve under DATA_DIR.
			let relative: string | null = null;
			if (pathname.startsWith('/process/')) {
				relative = pathname.slice('/process/'.length);
			} else if (pathname.startsWith('/options/') || pathname.startsWith('/assets/')) {
				relative = pathname.slice(1);
			}
			if (relative !== null) {
				const filePath = resolveUnderDataDir(relative);
				if (!filePath) {
					return new Response('Forbidden', { status: 403 });
				}
				if (!existsSync(filePath)) {
					return new Response('Not found', { status: 404 });
				}
				if (statSync(filePath).isDirectory()) {
					return dirListing(filePath, pathname, pathname);
				}
				return serveFile(filePath, req);
			}

			// JSON schemas (protocol/registry/results), served at the root
			// level (e.g. /protocol.schema.json) from the repo's static/ dir.
			if (pathname.endsWith('.schema.json')) {
				const filePath = resolveUnderStaticDir(pathname.slice(1));
				if (!filePath) {
					return new Response('Forbidden', { status: 403 });
				}
				if (!existsSync(filePath)) {
					return new Response('Not found', { status: 404 });
				}
				if (statSync(filePath).isDirectory()) {
					return dirListing(filePath, pathname, pathname);
				}
				return serveFile(filePath, req);
			}

			// Protocol manifests: served at the root level (e.g.
			// /entomoscope.cigaleprotocol.yaml, /bases/bees.cigaleprotocol.json)
			// to match the `source:` URLs in the protocol YAMLs and registry.json.
			// Includes the .json manifests generated by the metadatabuilders.
			const protocolPath = resolveUnderProtocolsDir(pathname);
			if (protocolPath) {
				if (existsSync(protocolPath)) {
					if (statSync(protocolPath).isDirectory()) {
						return dirListing(protocolPath, pathname, pathname);
					}
					return serveFile(protocolPath, req);
				}
			}

			return new Response('Not found', { status: 404 });
		},
	});

	console.info(`protocols-server listening on port ${PORT}, data dir: ${DATA_DIR}`);

	// At startup, rewrite the hardcoded http://localhost:3000 references in
	// the protocol manifests to WEB_ORIGIN, then regenerate the protocol
	// registry. Done before the auto-regenerate so the regenerated .json
	// manifests inherit the amended URLs.
	try {
		const amended = amendManifests(PROTOCOLS_DIR, WEB_ORIGIN);
		if (amended.length > 0) {
			console.log(`Amended ${amended.length} protocol manifest(s) to use ${WEB_ORIGIN}:`);
			for (const file of amended) console.log(`  - ${file}`);
		}
		const registryPath = writeRegistry({
			directory: PROTOCOLS_DIR,
			transformSource: (url) => WEB_ORIGIN.replace(/\/+$/, '') + url.pathname + url.search,
			filter: () => true,
		});
		console.log(`Generated protocol registry at ${registryPath}`);
	} catch (err) {
		console.error('Failed to amend manifests / generate protocol registry:', err);
	}

	// Re-generate options on (re)start so that restarting the container app
	// (e.g. via `hfctl apps restart`) triggers a fresh pipeline run.
	if (process.env.AUTO_REGENERATE !== 'false') {
		if (regenerate()) {
			console.info('Auto-regeneration started on startup');
		}
	}

	return server;
}
