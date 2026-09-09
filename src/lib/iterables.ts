import { ms } from 'convert';
import { chunk } from 'es-toolkit';

import { clamp, sleep } from './utils.js';

/**
 * A way to iterate (with a for-await loop)
 * on arbitrary data received in e.g. callbacks
 * of a async function call
 *
 * @example
 * ```ts
 *
 * async function compute(numbers: number[], onUpdate: (done: number) => void) {
 * 		let result = 0
 * 		for (const number of numbers) {
 * 			result = expensiveStuff(result, number)
 * 			onUpdate(number)
 * 		}
 * 		return result
 * }
 *
 * const numbers = [1, 2, 3, 4, 5, 6]
 * const updates = new Channel<number>()
 * const computation = compute(
 * 		numbers,
 *		done => updates.push(done)
 * ).finally(() => updates.done())
 *
 * for await (const done of updates) {
 * 		console.log(`did ${done}`)
 * }
 *
 * const result = await computation
 * console.log(`result is ${result}`)
 *
 * ```
 */
export class Channel<T> {
	#stream: TransformStream<T>;
	#closed = false;
	#pushedCount = 0;

	BUSYWAIT_INITIAL_INTERVAL = 5;

	#busywaitInterval = this.BUSYWAIT_INITIAL_INTERVAL;

	constructor(
		/** If more than 0, channel will auto-close once a certain number of items have been pushed */
		public capacity = 0
	) {
		this.#stream = new TransformStream<T>();
	}

	/**
	 * Wait for writable stream to be available, acquire its writer, do the given action and release the lock
	 */
	async withWriter(action: (writer: WritableStreamDefaultWriter<T>) => Promise<void>) {
		const writable = this.#stream.writable;

		let tries = 0;
		while (writable.locked) {
			await sleep(this.#busywaitInterval);

			this.#busywaitInterval = clamp(
				this.#busywaitInterval * Math.exp(++tries),
				this.BUSYWAIT_INITIAL_INTERVAL,
				ms('10s')
			);
		}

		const writer = writable.getWriter();
		await action(writer);
		writer.releaseLock();
	}

	async push(item: T) {
		await this.withWriter(async (writer) => {
			if (this.#closed) {
				console.warn('attempted to push', item, 'to closed stream, ignoring');
				return;
			}

			await writer.write(item);
			this.#pushedCount++;
		});

		if (this.capacity > 0 && this.#pushedCount >= this.capacity) {
			this.close();
			return;
		}
	}

	async close() {
		if (this.#closed) return;
		await this.withWriter(async (writer) => {
			await writer.close();
			this.#closed = true;
		});
	}

	async finish(item: T) {
		await this.push(item);
		await this.close();
	}

	get done() {
		return (async () => {
			for await (const _ of this) {
				// nothing
			}
		})();
	}

	/**
	 * An easier way to call an async function
	 * that accepts a "notify me" callback
	 * while the function is running
	 *
	 * @example
	 * ```ts
	 * const updates = new Channel<number>()
	 *
	 * const computation = channel.bind(async cb => expensive(data, { onUpdate: cb }))
	 *
	 * for await (const update of updates) {
	 *		console.lo(`progress: ${update*100}%`)
	 * }
	 *
	 * console.log(`result: ${await computation}`)
	 * ```
	 *
	 * with a function like this
	 *
	 * ```ts
	 * async function expensive(data: number[], { onUpdate?: (progress: number) => void } = {}) {
	 * 		let result = 0
	 * 		for (const [i, row] of data.entries()) {
	 * 			await transmogrify(result, row)
	 * 			onUpdate?.(i / row.length)
	 * 		}
	 * 		return result
	 * }
	 * ```
	 */
	async bind<R>(binder: (callback: (data: T) => unknown) => Promise<R>): Promise<R> {
		return binder((data) => this.push(data)).finally(() => this.close());
	}

	async *[Symbol.asyncIterator](): AsyncIterator<T> {
		const reader = this.#stream.readable.getReader();

		while (true) {
			const { value, done } = await reader.read();

			if (done) {
				break;
			} else {
				yield value;
			}
		}
	}
}

async function* combineIterables<T>(iterables: Iterable<AsyncIterable<T>>): AsyncIterable<T> {
	const stream = new ReadableStream<T>({
		async pull(controller) {
			await Promise.all(
				[...iterables].map(async (iterable) => {
					for await (const result of iterable) {
						controller.enqueue(result);
					}
				})
			);

			controller.close();
		},
	});

	const reader = stream.getReader();

	while (true) {
		const { value, done } = await reader.read();

		if (done) {
			break;
		} else {
			yield value;
		}
	}
}

export async function* concurrently<I, O>(
	/** Maximum number of process calls running at the same time. 0 to not limit */
	parallelism: number,
	items: I[],
	process: (item: I) => AsyncIterable<O>
): AsyncIterable<{ input: I; output: O }> {
	for (const batch of chunk(items, parallelism || items.length)) {
		yield* combineIterables(
			batch.map(async function* _(input: I) {
				for await (const output of process(input)) {
					yield { input, output };
				}
			})
		);
	}
}

export async function* poll<T>(
	/** Polling rate in milliseconds */
	interval: number,
	ping: () => Promise<T>,
	stop: (data: T) => boolean
) {
	let data: T | undefined;

	while (data === undefined || !stop(data)) {
		data = await ping();
		yield data;
		await sleep(interval);
	}

	yield data;
}
