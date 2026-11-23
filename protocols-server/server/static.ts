import { statSync } from 'node:fs';
import path from 'node:path';
import { DATA_DIR, PROTOCOLS_DIR } from './config.js';

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
	'.yaml': 'application/yaml',
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

export function serveFile(filePath: string, req: Request): Response {
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
export function resolveUnderDataDir(requestPath: string): string | null {
	const decoded = decodeURIComponent(requestPath);
	const resolved = path.resolve(DATA_DIR, '.' + path.posix.normalize('/' + decoded));
	const dataRoot = path.resolve(DATA_DIR);
	if (resolved !== dataRoot && !resolved.startsWith(dataRoot + path.sep)) {
		return null;
	}
	return resolved;
}

// Resolve a request path under PROTOCOLS_DIR, preventing path traversal.
export function resolveUnderProtocolsDir(requestPath: string): string | null {
	const decoded = decodeURIComponent(requestPath);
	const resolved = path.resolve(PROTOCOLS_DIR, '.' + path.posix.normalize('/' + decoded));
	const root = path.resolve(PROTOCOLS_DIR);
	if (resolved !== root && !resolved.startsWith(root + path.sep)) {
		return null;
	}
	return resolved;
}
