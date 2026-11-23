/**
 * Stream a HTTP response line by line, using successive HTTP range requests.
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
export async function* httpStreamLines(
	input: string | URL | Request,
	init: RequestInit = {},
	options?: {
		chunkSize?: number;
		signal?: AbortSignal;
		/** Fall back to a regular request that loads the entire response if range requests are not supported by the server */
		fallback?: boolean;
	}
): AsyncGenerator<string> {
	const chunkSize = options?.chunkSize ?? 256 * 1024;
	const decoder = new TextDecoder();
	let offset = 0;
	let carry = '';
	const headers = new Headers(init.headers);

	while (true) {
		headers.set('Range', `bytes=${offset}-${offset + chunkSize - 1}`);

		if (options?.signal) init.signal = options.signal;

		const response = await fetch(input, { ...init, headers });
		if (response.status === 416) break; // past the end of the file
		if (response.status !== 206) {
			if (!options?.fallback) {
				throw new Error(
					`Server does not support range requests for ${input}: ${response.status} ${response.statusText}`
				);
			}

			const full = await fetch(input, init);
			const text = await full.text();
			if (!full.ok) throw new Error(text);

			for (const line of text.split(/\r?\n/)) {
				yield line;
			}
		}

		const buffer =
			carry + decoder.decode(new Uint8Array(await response.arrayBuffer()), { stream: true });
		carry = '';

		const lines = buffer.split('\n');
		// The final element is a partial line that continues in the next request.
		carry = lines.pop() ?? '';
		for (const raw of lines) {
			const line = raw.replace(/\r$/, '').trim();
			if (line) yield line;
		}

		offset += chunkSize;
	}

	// Flush a final line if the file didn't end with a newline.
	const final = carry.replace(/\r$/, '').trim();
	if (final) yield final;
}
