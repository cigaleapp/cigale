/**
 * @module
 * send message with { type: "__args", args: { key: string, handle: FilesystemFileHandle, chunksize: number } }
 * to start reading from a handle in chunks of size chunksize
 *
 * receive data of the form
 * { done: false, key: string } | { done: true, key: string, item: { total: number, index: number, bytes: ArrayBuffer } }
 */

async function* readInChunks({
	handle,
	chunksize,
}: {
	handle: FileSystemFileHandle;
	chunksize: number;
}) {
	const syncHandle = await handle.createSyncAccessHandle();
	const size = syncHandle.getSize();
	const total = Math.ceil(size / chunksize);
	const lastChunkSize = size % chunksize;

	let index = 0;
	if (!total) {
		syncHandle.close();
		yield {
			total,
			index,
			bytes: new ArrayBuffer(0),
		};
		return;
	}

	while (index < total) {
		const bytes = new ArrayBuffer(index === total - 1 ? lastChunkSize : chunksize);

		syncHandle.read(bytes, { at: index * chunksize });

		yield { total, index, bytes };

		index++;
	}

	syncHandle.close();
}

onmessage = function (e) {
	if (e.data.type === '__args') {
		void (async () => {
			for await (const item of readInChunks(e.data.args)) {
				postMessage({ done: false, key: e.data.args.key, item }, [item.bytes]);
			}
			postMessage({ done: true, key: e.data.args.key });
		})();
	}
};
