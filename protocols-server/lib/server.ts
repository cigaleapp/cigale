import { Subprocess } from 'bun';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT ?? 3000);
const DATA_DIR = process.env.DATA_DIR ?? '.';

const MIME: Record<string, string> = {
	'.jsonl': 'application/x-ndjson',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.xml': 'application/xml',
	'.html': 'text/html',
	'.css': 'text/css',
	'.js': 'text/javascript',
	'.ts': 'text/typescript',
	'.txt': 'text/plain',
	'.pdf': 'application/pdf',
	'.zip': 'application/zip',
};

function mimeFor(filePath: string): string {
	const ext = path.extname(filePath).toLowerCase();
	return MIME[ext] ?? 'application/octet-stream';
}

function serveFile(filePath: string, req: Request): Response {
	const file = Bun.file(filePath);
	const stat = statSync(filePath);
	const total = stat.size;
	const mime = mimeFor(filePath);

	const rangeHeader = req.headers.get('range');
	if (rangeHeader) {
		const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
		if (!match) {
			return new Response('Invalid range', {
				status: 416,
				headers: { 'Content-Range': `bytes */${total}` },
			});
		}
		let start: number;
		let end: number;
		if (match[1] === '' && match[2] !== '') {
			// suffix range: bytes=-N means last N bytes
			const suffix = Number(match[2]);
			start = Math.max(0, total - suffix);
			end = total - 1;
		} else {
			start = Number(match[1] || 0);
			end = match[2] !== '' ? Number(match[2]) : total - 1;
		}
		if (start >= total || start > end) {
			return new Response('Range not satisfiable', {
				status: 416,
				headers: { 'Content-Range': `bytes */${total}` },
			});
		}
		end = Math.min(end, total - 1);
		const length = end - start + 1;
		const slice = file.slice(start, end + 1);
		return new Response(slice, {
			status: 206,
			headers: {
				'Content-Range': `bytes ${start}-${end}/${total}`,
				'Content-Length': String(length),
				'Content-Type': mime,
				'Accept-Ranges': 'bytes',
			},
		});
	}

	return new Response(file, {
		headers: {
			'Content-Length': String(total),
			'Content-Type': mime,
			'Accept-Ranges': 'bytes',
		},
	});
}

// Resolve a request path under DATA_DIR, preventing path traversal.
function resolveUnderDataDir(requestPath: string): string | null {
	const decoded = decodeURIComponent(requestPath);
	const resolved = path.resolve(DATA_DIR, '.' + path.posix.normalize('/' + decoded));
	const dataRoot = path.resolve(DATA_DIR);
	if (resolved !== dataRoot && !resolved.startsWith(dataRoot + path.sep)) {
		return null;
	}
	return resolved;
}

let regenProcess: Subprocess | null = null;
let regenStatus: { state: 'idle' | 'running' | 'done' | 'error'; exitCode?: number; startedAt?: string; finishedAt?: string } = { state: 'idle' };

function regenerate(): boolean {
	if (regenStatus.state === 'running') {
		return false;
	}
	regenStatus = { state: 'running', startedAt: new Date().toISOString() };
	regenProcess = Bun.spawn(['bun', 'run', path.join(import.meta.dir, '..', 'main.ts')], {
		cwd: DATA_DIR,
		stdout: 'inherit',
		stderr: 'inherit',
		env: { ...process.env },
	});
	regenProcess.exited.then((code) => {
		regenStatus = {
			state: code === 0 ? 'done' : 'error',
			exitCode: code,
			startedAt: regenStatus.startedAt,
			finishedAt: new Date().toISOString(),
		};
		regenProcess = null;
	});
	return true;
}

const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);
		const pathname = url.pathname;

		// Health check
		if (pathname === '/health') {
			return Response.json({ ok: true });
		}

		// Regeneration API
		if (pathname === '/api/regenerate' && req.method === 'POST') {
			if (!regenerate()) {
				return Response.json({ error: 'Regeneration already in progress' }, { status: 409 });
			}
			return Response.json({ started: true });
		}

		if (pathname === '/api/regenerate' && req.method === 'GET') {
			return Response.json(regenStatus);
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
			if (!existsSync(filePath) || !statSync(filePath).isFile()) {
				return new Response('Not found', { status: 404 });
			}
			return serveFile(filePath, req);
		}

		return new Response('Not found', { status: 404 });
	},
});

console.info(`protocols-server listening on port ${PORT}, data dir: ${DATA_DIR}`);

// Re-generate options on (re)start so that restarting the container app
// (e.g. via `hfctl apps restart`) triggers a fresh pipeline run.
if (process.env.AUTO_REGENERATE !== 'false') {
	if (regenerate()) {
		console.info('Auto-regeneration started on startup');
	}
}
