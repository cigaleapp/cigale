import { describe, expect, it, test, vi } from 'vitest';

import { Channel, concurrently, poll } from './iterables.js';
import { sleep } from './utils.js';

describe('Channel', () => {
	test('can push items and close', async () => {
		const channel = new Channel<string>();
		channel.push('a');
		channel.push('b');
		channel.push('c');
		channel.close();

		expect(await collect(channel)).toStrictEqual(['a', 'b', 'c']);
	});

	test('can push items and finish', async () => {
		const channel = new Channel<string>();
		channel.push('a');
		channel.push('b');
		channel.finish('c');

		expect(await collect(channel)).toStrictEqual(['a', 'b', 'c']);
	});

	test('can push items to fixed-size channel', async () => {
		const channel = new Channel<number>(3);
		channel.push(1);
		channel.push(2);
		channel.push(3);

		expect(await collect(channel)).toStrictEqual([1, 2, 3]);
	});

	test('.bind', async () => {
		const channel = new Channel<number>();

		const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

		const computation = channel.bind(async (cb) => expensive(data, { onUpdate: cb }));

		expect(await collect(channel)).toStrictEqual([
			0,
			1 / 10,
			2 / 10,
			3 / 10,
			4 / 10,
			5 / 10,
			6 / 10,
			7 / 10,
			8 / 10,
			9 / 10,
		]);

		expect(await computation).toStrictEqual(55);

		async function expensive(
			data: number[],
			{ onUpdate }: { onUpdate?: (progress: number) => void } = {}
		) {
			let result = 0;
			for (const [i, row] of data.entries()) {
				result += row;
				onUpdate?.(i / data.length);
			}
			return result;
		}
	});

	test('auto-closes once capacity is reached, ignoring further pushes', async () => {
		const channel = new Channel<number>(2);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		// Pushes are fire-and-forget: each write only resolves once the
		// consumer below actually reads it, so we don't await them here.
		channel.push(1);
		channel.push(2);
		const stragglerPush = channel.push(3); // beyond capacity; must be dropped once the channel auto-closes

		expect(await collect(channel)).toStrictEqual([1, 2]);
		// Wait for the fire-and-forget straggler push to fully settle (and warn)
		// before the test ends, so it can't leak into the next test's spy.
		await stragglerPush;
		expect(warn).toHaveBeenCalledWith('attempted to push', 3, 'to closed stream, ignoring');

		warn.mockRestore();
	});

	test('pushing to an explicitly closed channel warns and is ignored', async () => {
		const channel = new Channel<string>();
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		channel.push('a');
		channel.close();
		const stragglerPush = channel.push('b');

		expect(await collect(channel)).toStrictEqual(['a']);
		// The straggler push only settles (and warns) once it manages to
		// re-acquire the writer lock after close(); wait for it explicitly.
		await stragglerPush;
		expect(warn).toHaveBeenCalledWith('attempted to push', 'b', 'to closed stream, ignoring');

		warn.mockRestore();
	});

	test('close() is idempotent and safe to call multiple times', async () => {
		const channel = new Channel<number>();
		channel.push(1);

		// Draining concurrently is what lets the fire-and-forget close() settle.
		const [items] = await Promise.all([collect(channel), channel.close()]);
		expect(items).toStrictEqual([1]);

		// The channel is now fully closed; closing it again must be a safe no-op.
		await expect(channel.close()).resolves.toBeUndefined();
	});

	test('done resolves once all pushed items have been drained and the channel closed', async () => {
		const channel = new Channel<number>();

		channel.push(1);
		channel.push(2);
		channel.close();

		await expect(channel.done).resolves.toBeUndefined();
	});
});

describe('concurrently', () => {
	it('processes every item and returns the input/output pairs', async () => {
		const process = vi.fn(async function* (item: number) {
			yield item * 2;
		});

		const result = await collect(concurrently(2, [1, 2, 3], process));

		expect(result).toEqual([
			{ input: 1, output: 2 },
			{ input: 2, output: 4 },
			{ input: 3, output: 6 },
		]);

		expect(process).toHaveBeenCalledTimes(3);
		expect(process).toHaveBeenNthCalledWith(1, 1);
		expect(process).toHaveBeenNthCalledWith(2, 2);
		expect(process).toHaveBeenNthCalledWith(3, 3);
	});

	it('emits multiple outputs from the same input', async () => {
		const process = vi.fn(async function* (item: number) {
			yield item;
			yield item * 10;
			yield item * 100;
		});

		const result = await collect(concurrently(1, [2], process));

		expect(result).toEqual([
			{ input: 2, output: 2 },
			{ input: 2, output: 20 },
			{ input: 2, output: 200 },
		]);
	});

	it('does not start more than parallelism processes at once', async () => {
		let running = 0;
		let maxRunning = 0;

		const process = vi.fn(async function* (item: number) {
			running++;
			maxRunning = Math.max(maxRunning, running);

			await sleep(10);

			yield item;

			running--;
		});

		const result = await collect(concurrently(2, [1, 2, 3, 4, 5], process));

		expect(result).toHaveLength(5);
		expect(maxRunning).toBe(2);
	});

	it('starts the next batch only after the previous batch completes', async () => {
		const started: number[] = [];
		const finished: number[] = [];

		const process = vi.fn(async function* (item: number) {
			started.push(item);

			await sleep(5);

			yield item;
			finished.push(item);
		});

		await collect(concurrently(2, [1, 2, 3, 4], process));

		expect(started).toEqual([1, 2, 3, 4]);

		// Items 3 and 4 must not start before both items 1 and 2 finish.
		expect(started.indexOf(3)).toBeGreaterThan(finished.indexOf(1));
		expect(started.indexOf(3)).toBeGreaterThan(finished.indexOf(2));
		expect(started.indexOf(4)).toBeGreaterThan(finished.indexOf(1));
		expect(started.indexOf(4)).toBeGreaterThan(finished.indexOf(2));
	});

	it('runs all items concurrently when parallelism is 0', async () => {
		let running = 0;
		let maxRunning = 0;

		const process = vi.fn(async function* (item: number) {
			running++;
			maxRunning = Math.max(maxRunning, running);

			await sleep(10);

			yield item;
			running--;
		});

		await collect(concurrently(0, [1, 2, 3, 4], process));

		expect(maxRunning).toBe(4);
	});

	it('handles an empty input', async () => {
		const process = vi.fn(async function* (item: number) {
			yield item;
		});

		const result = await collect(concurrently(2, [], process));

		expect(result).toEqual([]);
		expect(process).not.toHaveBeenCalled();
	});

	it('handles an input containing a single item', async () => {
		const process = vi.fn(async function* (item: string) {
			yield item.toUpperCase();
		});

		const result = await collect(concurrently(2, ['foo'], process));

		expect(result).toEqual([{ input: 'foo', output: 'FOO' }]);
	});

	it('preserves the input for every emitted output', async () => {
		const process = vi.fn(async function* (item: string) {
			yield `${item}-a`;
			yield `${item}-b`;
		});

		const result = await collect(concurrently(2, ['foo', 'bar'], process));

		expect(result).toEqual(
			expect.arrayContaining([
				{ input: 'foo', output: 'foo-a' },
				{ input: 'foo', output: 'foo-b' },
				{ input: 'bar', output: 'bar-a' },
				{ input: 'bar', output: 'bar-b' },
			])
		);
		expect(result).toHaveLength(4);
	});

	it('propagates errors from process', async () => {
		const error = new Error('boom');

		const process = vi.fn(async function* (item: number) {
			if (item === 2) {
				throw error;
			}

			yield item;
		});

		await expect(collect(concurrently(2, [1, 2, 3], process))).rejects.toThrow(error);
	});

	it('does not call process for items in later batches after an earlier batch fails', async () => {
		const process = vi.fn(async function* (item: number) {
			if (item === 2) {
				throw new Error('boom');
			}

			yield item;
		});

		await expect(collect(concurrently(2, [1, 2, 3, 4], process))).rejects.toThrow('boom');

		expect(process).not.toHaveBeenCalledWith(3);
		expect(process).not.toHaveBeenCalledWith(4);
	});
});

describe('poll', () => {
	it('pings until stop returns true, yielding every value (final value is yielded twice)', async () => {
		let calls = 0;
		const ping = vi.fn(async () => {
			calls++;
			return calls;
		});
		const stop = (data: number) => data >= 3;

		const result = await collect(poll(0, ping, stop));

		// The loop yields on every ping, then yields the last value once more
		// after the loop exits — so the value that satisfies `stop` appears twice.
		expect(result).toStrictEqual([1, 2, 3, 3]);
		expect(ping).toHaveBeenCalledTimes(3);
	});

	it('calls ping at least once even if the first result already satisfies stop', async () => {
		const ping = vi.fn(async () => 'done');
		const stop = vi.fn((data: string) => data === 'done');

		const result = await collect(poll(0, ping, stop));

		expect(result).toStrictEqual(['done', 'done']);
		expect(ping).toHaveBeenCalledTimes(1);
	});

	it('waits the given interval between polls', async () => {
		vi.useFakeTimers();
		try {
			let calls = 0;
			const timestamps: number[] = [];
			const ping = vi.fn(async () => {
				timestamps.push(Date.now());
				calls++;
				return calls;
			});
			const stop = (data: number) => data >= 3;

			const iterator = poll(100, ping, stop)[Symbol.asyncIterator]();

			const results: number[] = [];
			let pending = iterator.next();

			for (let i = 0; i < 3; i++) {
				await vi.advanceTimersByTimeAsync(0);
				const { value, done } = await pending;
				if (done) break;
				results.push(value as number);
				pending = iterator.next();
				await vi.advanceTimersByTimeAsync(100);
			}

			expect(results).toStrictEqual([1, 2, 3]);
			expect(timestamps[1] - timestamps[0]).toBeGreaterThanOrEqual(100);
			expect(timestamps[2] - timestamps[1]).toBeGreaterThanOrEqual(100);
		} finally {
			vi.useRealTimers();
		}
	});

	it('treats a truthy non-boolean stop condition as satisfied', async () => {
		let calls = 0;
		const ping = vi.fn(async () => {
			calls++;
			return { value: calls };
		});

		const result = await collect(poll(0, ping, (data) => data.value === 2));

		expect(result).toStrictEqual([{ value: 1 }, { value: 2 }, { value: 2 }]);
	});
});

async function collect<T>(it: AsyncIterable<T>) {
	const collected = [] as T[];
	for await (const item of it) {
		collected.push(item);
	}

	return collected;
}
