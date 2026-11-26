import type { NetworkStreamedLinesConfig } from './schemas/network.js';
import type { Type } from 'arktype';

import { NetworkStreamedLines, NetworkStreamedLinesHeader } from './schemas/network.js';
import { switchValue } from './utils.ts';

interface StreamRequestInit extends RequestInit {
	chunkSize?: number;
	/** Fall back to a regular request that loads the entire response if range requests are not supported by the server */
	fallback?: boolean;
}

export async function* httpStreamProcessLines<Schema extends Type>(
	schema: Schema,
	config: NetworkStreamedLinesConfig<Schema>,
	init?: StreamRequestInit
): AsyncIterable<StreamedLine<Schema['infer'], { object: unknown }>> {
	const { at, postprocess, format } = NetworkStreamedLines(schema).from(config);

	let total: number | undefined;
	const csv = {
		keys: [] as string[],
		separator: switchValue(format, {
			'csv-commas': ',',
			'csv-semicolons': ';',
			txt: '',
			'json-lines': '',
		}),
	};

	for await (const line of httpStreamLines(at, init)) {
		let object: unknown;

		switch (format) {
			case 'csv-commas':
			case 'csv-semicolons': {
				if (!line.text.trim()) continue;
				const cells = line.text.trim().split(csv.separator);
				if (csv.keys.length === 0) {
					csv.keys = cells;
					continue;
				}

				object = Object.fromEntries(cells.map((cell, i) => [csv.keys[i], cell]));
				break;
			}
			case 'txt': {
				object = undefined;
				break;
			}
			case 'json-lines': {
				object = JSON.parse(line.text);
				if (NetworkStreamedLinesHeader.allows(object)) {
					total = object.count;

					continue;
				}
				break;
			}
		}

		try {
			if (postprocess) {
				const parsed = await postprocess.evaluate({
					lineIndex: line.index,
					totalCount: total,
					raw: line.text,
					line: object,
				});

				yield line.with({ parsed });
			} else {
				yield line.with({ parsed: schema.assert(object) });
			}
		} catch (error) {
			yield line.with({ error, context: { object } });
		}
	}
}

/**
 * Stream a HTTP response line by line, using successive HTTP range requests.
 *
 * Each request fetches a bounded byte window so the whole (potentially very
 * large) file is never held in memory at once. Yields the parsed JSON of every
 * line, in order, until the file is exhausted.
 *
 * @param url the URL to stream
 * @param options.chunkSize maximum bytes to fetch per range request.
 * @param options.signal an AbortSignal to cancel the stream
 * @yields unknown the parsed JSON of each line
 */
export async function* httpStreamLines(
	input: string | URL | Request,
	{ chunkSize = 1024 * 1024, fallback, ...init }: StreamRequestInit = {}
): AsyncGenerator<StreamedLine> {
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();
	let offset = 0;
	let carry = '';
	const headers = new Headers(init.headers);

	// Do a HEAD request to get the content length for progress information
	const head = await fetch(input, { ...init, method: 'HEAD' });
	let total: number | undefined;
	total = Number.parseInt(head.headers.get('Content-Length') || '');
	if (!total || Number.isNaN(total) || !Number.isFinite(total)) {
		total = undefined;
	}

	let lineIndex = -1;
	// Total bytes consumed so far, including line terminators.
	let byteOffset = 0;
	// byteOffset at the last emitted line. Empty lines' bytes are absorbed into
	// the next emitted line so the sum of all byteSize values equals the total.
	let lastEmitOffset = 0;
	let lastEmitted: StreamedLine | undefined;

	// Emit complete lines from a chunk of raw (untrimmed) lines. Each line is
	// followed by a '\n' terminator in the file unless `terminated` is false
	// (the final line of the file). Empty lines are skipped, but their bytes
	// are counted so the running byteOffset stays accurate.
	function* emit(rawLines: string[], terminated: boolean): Generator<StreamedLine> {
		for (const raw of rawLines) {
			const lineStart = byteOffset;
			byteOffset += encoder.encode(terminated ? raw + '\n' : raw).length;
			const line = raw.replace(/\r$/, '').trim();
			if (!line) continue;

			const byteSize = byteOffset - lastEmitOffset;
			lastEmitOffset = byteOffset;
			const emitted = new StreamedLine({
				line,
				lineIndex: ++lineIndex,
				byteSize,
				progress: { total, current: lineStart },
			});
			lastEmitted = emitted;
			yield emitted;
		}
	}

	while (true) {
		headers.set('Range', `bytes=${offset}-${offset + chunkSize - 1}`);

		const response = await fetch(input, { ...init, headers });
		if (response.status === 416) break; // past the end of the file
		if (response.status !== 206) {
			if (!fallback) {
				throw new Error(
					`Server does not support range requests for ${input}: ${response.status} ${response.statusText}`
				);
			}

			// The server ignored the Range header and returned the whole file.
			const text = await response.text();
			if (!response.ok) throw new Error(text);
			const lines = text.split('\n');
			carry = lines.pop() ?? '';
			yield* emit(lines, true);
			break;
		}

		const buffer =
			carry + decoder.decode(new Uint8Array(await response.arrayBuffer()), { stream: true });

		const lines = buffer.split('\n');

		// The final element is a partial line that continues in the next request.
		carry = lines.pop() ?? '';

		yield* emit(lines, true);

		offset += chunkSize;
	}

	// Flush a final line if the file didn't end with a newline.
	if (carry) {
		yield* emit([carry], false);
	}

	// Absorb any trailing bytes (e.g. a whitespace-only final line) into the
	// last emitted line so the sum of byteSize values equals the total.
	if (lastEmitted && byteOffset > lastEmitOffset) {
		lastEmitted.setByteSize(lastEmitted.byteSize! + (byteOffset - lastEmitOffset));
	}
}

class StreamedLine<Parsed = unknown, Context = unknown> {
	line: string;
	error: unknown;
	context: Context | undefined;
	parsed: Parsed | undefined;
	/** Total bytes count for the file this streamed line is a part of */
	totalBytes: number | undefined;
	offsetBytes: number | undefined;
	/** Size in bytes of this line */
	byteSize: number | undefined;
	index: number;

	constructor(private init: StreamedLineInit<Parsed, Context>) {
		this.line = init.line;
		this.index = init.lineIndex;
		this.error = init.error;
		this.context = init.context;
		this.parsed = init.parsed;
		this.totalBytes = init.progress?.total;
		this.offsetBytes = init.progress?.current;
		this.byteSize = init.byteSize;
	}

	/** Sets the byte size, keeping the stored init in sync so `.with()` inherits it. */
	setByteSize(byteSize: number) {
		this.byteSize = byteSize;
		this.init.byteSize = byteSize;
	}

	with<P extends Parsed, C extends Context>(
		init: Partial<StreamedLineInit<P, C>>
	): StreamedLine<P, C> {
		// @ts-expect-error when instance is just constructed, context and parsed could
		// still be of type Parsed or Context, but we rectify that just bellow
		// by explicitly assigning even when the new init doesnt specify parsed/context
		const instance = new StreamedLine<P, C>({ ...this.init, ...init });
		instance.context = init.context;
		instance.parsed = init.parsed;
		return instance;
	}

	get text() {
		return this.line;
	}

	toString() {
		return this.line;
	}

	get progressInFile() {
		if (this.totalBytes === undefined) return undefined;
		if (this.offsetBytes === undefined) return undefined;

		return this.offsetBytes / this.totalBytes;
	}
}

type StreamedLineInit<Parsed, Context> = {
	line: string;
	error?: unknown;
	context?: Context | undefined;
	parsed?: Parsed | undefined;
	/** Index of the line in the file */
	lineIndex: number;
	byteSize?: number | undefined;
	progress?: {
		total?: number | undefined;
		current?: number | undefined;
	};
};
