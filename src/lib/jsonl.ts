/**
 * Stream a JSONL HTTP response using successive HTTP range requests.
 *
 * Each request fetches a bounded byte window so the whole (potentially very
 * large) file is never held in memory at once. Yields the parsed JSON of every
 * line, in order, until the file is exhausted.
 *
 * @param url the URL to stream
 * @param options.chunkSize maximum bytes to fetch per range request. Defaults to 256 KiB (256 * 1024)
 * @param options.signal an AbortSignal to cancel the stream
 * @yields unknown the parsed JSON of each line
 */
export async function* streamJsonl(
	url: string,
	options?: { chunkSize?: number; signal?: AbortSignal }
): AsyncGenerator<unknown> {
	const chunkSize = options?.chunkSize ?? 256 * 1024;
	const decoder = new TextDecoder();
	let offset = 0;
	let carry = '';

	while (true) {
		const init: RequestInit = {
			headers: { Range: `bytes=${offset}-${offset + chunkSize - 1}` },
		};
		if (options?.signal) init.signal = options.signal;

		const response = await fetch(url, init);
		if (response.status === 416) break; // past the end of the file
		if (response.status !== 206) {
			throw new Error(
				`Server does not support range requests for ${url}: ${response.status} ${response.statusText}`
			);
		}

		const buffer =
			carry + decoder.decode(new Uint8Array(await response.arrayBuffer()), { stream: true });
		carry = '';

		const lines = buffer.split('\n');
		// The final element is a partial line that continues in the next request.
		carry = lines.pop() ?? '';
		for (const raw of lines) {
			const line = raw.replace(/\r$/, '').trim();
			if (line) yield JSON.parse(line);
		}

		offset += chunkSize;
	}

	// Flush a final line if the file didn't end with a newline.
	const final = carry.replace(/\r$/, '').trim();
	if (final) yield JSON.parse(final);
}
