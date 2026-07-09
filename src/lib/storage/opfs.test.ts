import 'opfs-mock';
import '@andy0130tw/es-arraybuffer-base64/auto';

import { beforeEach, describe, expect, it } from 'vitest';

import { OPFSBackend } from './opfs.js';

async function collect<T>(items: AsyncIterable<T>) {
	const result: T[] = [];
	for await (const item of items) result.push(item);
	return result;
}

describe('OPFSBackend', () => {
	beforeEach(async () => {
		const root = await navigator.storage.getDirectory();
		await root.remove({ recursive: true });
	});

	it('writes and reads files in a session directory', async () => {
		const backend = await OPFSBackend();
		const parent = { area: 'ImageFile', sessionId: 'session-a', name: '' as const };
		const first = { ...parent, name: 'first.txt' as const };
		const second = { ...parent, name: 'second.txt' as const };
		const third = { ...parent, name: 'third.txt' as const };
		const fourth = { ...parent, name: 'fourth.txt' as const };
		const fifth = { ...parent, name: 'fifth.txt' as const };

		await backend.write(first, new Blob(['hello'], { type: 'text/plain' }));
		await backend.write(second, { type: 'text/plain', text: 'world' });
		await backend.write(third, {
			type: 'text/plain',
			bytes: new Uint8Array([102, 111, 111]),
		});
		await backend.write(fourth, {
			type: 'text/plain',
			base64: 'YmFy',
		});
		await backend.write(fifth, {
			type: 'text/plain',
			text: 'baz',
		});

		expect(await backend.exists(first)).toBe(true);
		expect(await backend.text(first)).toBe('hello');
		expect(await backend.bytes(first)).toEqual(new TextEncoder().encode('hello').buffer);
		expect(await backend.size(first)).toBe(5);

		const file = await backend.read(first, 'text/plain');
		expect(file).toBeInstanceOf(File);
		expect(file.name).toBe('first.txt');
		expect(await file.text()).toBe('hello');
		expect(await backend.text(second)).toBe('world');
		expect(await backend.bytes(third)).toEqual(new TextEncoder().encode('foo').buffer);
		expect(await backend.text(third)).toBe('foo');
		expect(await backend.bytes(fourth)).toEqual(new TextEncoder().encode('bar').buffer);
		expect(await backend.text(fifth)).toBe('baz');

		expect(await backend.count(parent)).toBe(5);
		expect((await collect(backend.list(parent))).map((entry) => entry.name).sort()).toEqual(
			['fifth.txt', 'first.txt', 'fourth.txt', 'second.txt', 'third.txt'].sort()
		);

		await backend.delete(first);
		expect(await backend.exists(first)).toBe(false);
		expect(await backend.count(parent)).toBe(4);

		await backend.clear(parent);
		expect(await backend.count(parent)).toBe(0);
		expect(await collect(backend.list(parent))).toEqual([]);
		expect(await backend.exists(first)).toBe(false);
	});

	it('returns empty results for a missing directory', async () => {
		const backend = await OPFSBackend();
		const parent = { area: 'ImageFile', sessionId: 'missing-session', name: '' as const };

		expect(await backend.count(parent)).toBe(0);
		expect(await collect(backend.list(parent))).toEqual([]);
	});
});
