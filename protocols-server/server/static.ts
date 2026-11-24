import { statSync } from 'node:fs';
import path from 'node:path';

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

// Resolve a request path under `root`, preventing path traversal.
// Hidden files and directories (dot-prefixed path segments, e.g. .secrets/)
// are never served or listed.
export function resolveUnder(root: string, requestPath: string): string | null {
	const decoded = decodeURIComponent(requestPath);
	if (decoded.split('/').some((seg) => seg.startsWith('.'))) {
		return null;
	}
	const resolved = path.resolve(root, '.' + path.posix.normalize('/' + decoded));
	const rootResolved = path.resolve(root);
	if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
		return null;
	}
	return resolved;
}
