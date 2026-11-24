import { readdirSync } from 'node:fs';

// --- Browsing (simple HTML, no CSS) ---

function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
		.map((e) => ({ name: e.name, isDir: e.isDirectory() }))
		.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
	const rows = entries
		.map((e) => {
			const href = `${base}${encodeURIComponent(e.name)}${e.isDir ? '/' : ''}`;
			const label = e.isDir ? `${e.name}/` : e.name;
			return `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`;
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
	const body = `<h1>protocols-server</h1>
<ul>
<li><a href="/api/">API</a></li>
<li><a href="/options/">options/</a></li>
<li><a href="/assets/">assets/</a></li>
<li><a href="/process/">process/</a></li>
<li><a href="/bases/">protocols/bases/</a></li>
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
