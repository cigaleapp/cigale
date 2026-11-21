import { createServer } from 'node:http';
import type { Server } from 'node:http';

import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import { streamJsonl } from './jsonl.js';

// A deterministic in-memory JSONL payload mimicking the real files: a
// `{"count": N}` header, then N lines of ~2.4 KiB each with multi-byte
// UTF-8 text, no trailing newline.
const SAMPLE_LINES: unknown[] = Array.from({ length: 100 }, (_, i) => ({
	id: i,
	name: `Espèce n°${i} — éèàçü`,
	description: `Description détaillée de l'espèce ${i}. `.repeat(60),
}));
const SAMPLE_FILE = new TextEncoder().encode(
	[
		JSON.stringify({ count: SAMPLE_LINES.length }),
		...SAMPLE_LINES.map((line) => JSON.stringify(line)),
	].join('\n')
);

// A real HTTP server that serves the sample JSONL and honours
// `Range: bytes=start-end` requests, so the full fetch -> range -> decode
// chain is exercised end to end.
let server: Server;
let url: string;

beforeAll(async () => {
	server = createServer((req, res) => {
		if (req.url === '/sample.jsonl') {
			const range = req.headers.range ?? '';
			const match = range.match(/^bytes=(\d+)-(\d+)$/);
			if (!match) {
				res.writeHead(200, { 'Content-Length': SAMPLE_FILE.length });
				res.end(SAMPLE_FILE);
				return;
			}
			const start = parseInt(match[1], 10);
			const end = Math.min(parseInt(match[2], 10), SAMPLE_FILE.length - 1);
			if (start >= SAMPLE_FILE.length) {
				res.writeHead(416, {
					'Content-Range': `bytes */${SAMPLE_FILE.length}`,
				});
				res.end();
				return;
			}
			res.writeHead(206, {
				'Content-Range': `bytes ${start}-${end}/${SAMPLE_FILE.length}`,
				'Content-Length': end - start + 1,
			});
			res.end(SAMPLE_FILE.subarray(start, end + 1));
			return;
		}
		if (req.url === '/no-range.jsonl') {
			res.writeHead(200);
			res.end('{"count":0}\n');
			return;
		}
		res.writeHead(404);
		res.end('not found');
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	if (typeof address === 'object' && address) url = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
	await new Promise<void>((resolve, reject) =>
		server.close((err) => (err ? reject(err) : resolve()))
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

async function collect(iter: AsyncIterable<unknown>): Promise<unknown[]> {
	const out: unknown[] = [];
	for await (const item of iter) out.push(item);
	return out;
}

// Serves `file` by honouring the `Range: bytes=start-end` header, for the
// small synthetic payloads in the edge-case tests.
function mockFetch(file: string) {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (_url: string, init?: RequestInit) => {
			const range = new Headers(init?.headers).get('Range') ?? '';
			const match = range.match(/bytes=(\d+)-(\d+)/);
			if (!match) return new Response(file, { status: 200 });
			const start = parseInt(match[1], 10);
			const end = parseInt(match[2], 10);
			if (start >= file.length) return new Response(null, { status: 416 });
			return new Response(file.slice(start, end + 1), { status: 206 });
		})
	);
}

describe('streamJsonl', () => {
	// The sample payload is ~240 KiB of ~2.4 KiB lines. 16 KiB chunks force
	// ~15 successive range requests, with lines split across chunk boundaries.
	const CHUNK_SIZE = 16 * 1024;

	test('streams the whole file over successive range requests', async () => {
		const fetchMock = vi.fn<typeof fetch>(fetch);
		vi.stubGlobal('fetch', fetchMock);
		const collected = await collect(
			streamJsonl(`${url}/sample.jsonl`, { chunkSize: CHUNK_SIZE })
		);
		expect(collected).toEqual([{ count: SAMPLE_LINES.length }, ...SAMPLE_LINES]);
		expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
	});

	test('handles a file without a trailing newline', async () => {
		mockFetch('{"count":1}\n{"key":"a"}');
		expect(await collect(streamJsonl('https://example.com/test.jsonl'))).toEqual([
			{ count: 1 },
			{ key: 'a' },
		]);
	});

	test('handles a line split across chunk boundaries', async () => {
		mockFetch('{"key":"a"}\n{"key":"b"}\n');
		const collected = await collect(
			streamJsonl('https://example.com/test.jsonl', { chunkSize: 5 })
		);
		expect(collected).toEqual([{ key: 'a' }, { key: 'b' }]);
	});

	test('handles CRLF line endings', async () => {
		mockFetch('{"count":1}\r\n{"key":"a"}\r\n');
		expect(await collect(streamJsonl('https://example.com/test.jsonl'))).toEqual([
			{ count: 1 },
			{ key: 'a' },
		]);
	});

	test('throws when the server does not support range requests', async () => {
		await expect(collect(streamJsonl(`${url}/no-range.jsonl`))).rejects.toThrow(
			/range requests/
		);
	});

	test('throws on non-2xx responses', async () => {
		await expect(collect(streamJsonl(`${url}/missing.jsonl`))).rejects.toThrow(/404/);
	});
});
