import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { PROTOCOLS_DIR, STATIC_DIR } from './config.js';

// --- Browsing (simple HTML, no CSS) ---

function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Human-readable byte size: 512B, 12.3KB, 4.5MB, 1.2GB */
function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes}B`;
	const units = ['KB', 'MB', 'GB', 'TB'];
	let value = bytes;
	let unit = 'B';
	for (const u of units) {
		if (value < 1024) break;
		value /= 1024;
		unit = u;
	}
	return `${value >= 100 ? Math.round(value) : value.toFixed(1)}${unit}`;
}

function htmlPage(title: string, body: string): Response {
	const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body>
${body}
</body>
</html>`;
	return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// Directory listing for a filesystem dir, with links relative to `linkBase`
// (the URL prefix that maps to `dir`).
export function dirListing(dir: string, linkBase: string, title: string): Response {
	const base = linkBase.endsWith('/') ? linkBase : linkBase + '/';
	const entries = readdirSync(dir, { withFileTypes: true })
		.filter((e) => !e.name.startsWith('.'))
		.map((e) => ({
			name: e.name,
			isDir: e.isDirectory(),
			size: e.isDirectory() ? null : statSync(path.join(dir, e.name)).size,
		}))
		.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
	const rows = entries
		.map((e) => {
			const href = `${base}${encodeURIComponent(e.name)}${e.isDir ? '/' : ''}`;
			const label = e.isDir ? `${e.name}/` : e.name;
			const size = e.size === null ? '' : ` <span class="size">(${formatBytes(e.size)})</span>`;
			return `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a>${size}</li>`;
		})
		.join('\n');
	// Parent link: strip the last path segment (e.g. /options/ -> /, /assets/img/ -> /assets/).
	const parent = base.slice(0, -1);
	const lastSlash = parent.lastIndexOf('/');
	const parentHref = lastSlash <= 0 ? '/' : parent.slice(0, lastSlash + 1);
	const body = `<h1>${escapeHtml(title)}</h1>
<ul>
<li><a href="${escapeHtml(parentHref)}">..</a></li>
${rows}
</ul>`;
	return htmlPage(title, body);
}

// Index of the browsable areas.
export function indexPage(): Response {
	// Protocol manifests are served at the root level (e.g.
	// /entomoscope.cigaleprotocol.yaml, /bases/bees.cigaleprotocol.json).
	const protocolFiles = existsSync(PROTOCOLS_DIR)
		? [...new Bun.Glob('**/*.cigaleprotocol.{json,yaml}').scanSync({ cwd: PROTOCOLS_DIR })]
				.map((f) => f.replaceAll('\\', '/'))
				.sort()
		: [];
	const sizeOf = (f: string) => {
		try {
			return statSync(path.join(PROTOCOLS_DIR, f)).size;
		} catch {
			return null;
		}
	};
	const registrySize = existsSync(path.join(PROTOCOLS_DIR, 'registry.json'))
		? statSync(path.join(PROTOCOLS_DIR, 'registry.json')).size
		: null;
	const protocolRows = protocolFiles
		.map((f) => {
			const size = sizeOf(f);
			const sizeLabel = size === null ? '' : ` <span class="size">(${formatBytes(size)})</span>`;
			return `<li><a href="/${f}">${escapeHtml(f)}</a>${sizeLabel}</li>`;
		})
		.join('\n');
	const registrySizeLabel =
		registrySize === null ? '' : ` <span class="size">(${formatBytes(registrySize)})</span>`;
	const schemaFiles = existsSync(STATIC_DIR)
		? readdirSync(STATIC_DIR)
				.filter((f) => f.endsWith('.schema.json'))
				.sort()
		: [];
	const schemaRows = schemaFiles
		.map((f) => {
			const size = statSync(path.join(STATIC_DIR, f)).size;
			return `<li><a href="/${f}">${escapeHtml(f)}</a> <span class="size">(${formatBytes(size)})</span></li>`;
		})
		.join('\n');
	const body = `<h1>protocols-server</h1>
<ul>
<li><a href="/api/">API</a></li>
<li><a href="/options/">options/</a></li>
<li><a href="/assets/">assets/</a></li>
<li><a href="/process/">process/</a></li>
<li><a href="/bases/">protocols/bases/</a></li>
</ul>
<h2>Protocols</h2>
<ul>
<li><a href="/registry.json">registry.json</a>${registrySizeLabel}</li>
${protocolRows}
</ul>
<h2>Schemas</h2>
<ul>
${schemaRows}
</ul>`;
	return htmlPage('protocols-server', body);
}

// Index of the API routes.
export function apiIndexPage(): Response {
	const body = `<h1>API</h1>
<ul>
<li><a href="/health">GET /health</a></li>
<li><a href="/api/regenerate">GET /api/regenerate</a> (status + progress + log link)</li>
<li>POST /api/regenerate (start regeneration) <em>[auth]</em></li>
<li><a href="/api/regeneration/log.txt">GET /api/regeneration/log.txt</a> (last 100 lines of the regeneration process's stdout+stderr) <em>[auth]</em></li>
<li><a href="/api/caches">GET /api/caches</a> (cache stats)</li>
<li>DELETE /api/caches/:datasource (entire datasource) <em>[auth]</em></li>
<li>DELETE /api/caches/:datasource/:query (entire query) <em>[auth]</em></li>
<li>DELETE /api/caches/:datasource/:query?k=v&amp;... (entries matching the given params; each value JSON-decoded when possible) <em>[auth]</em></li>
<li><a href="/api/login">GET /api/login?password=...</a> (browser login, sets a cookie)</li>
</ul>
<p><em>[auth]</em> = requires the API password (API_PASSWORD env var).
API clients: <code>Authorization: Bearer &lt;password&gt;</code>.
Browsers: <a href="/api/login">log in</a> (sets a session cookie).</p>`;
	return htmlPage('API', body);
}
