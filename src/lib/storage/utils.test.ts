import 'fake-indexeddb/auto';
import 'opfs-mock';

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { nukeDatabase } from '$lib/idb.svelte.js';
import { imageFileId } from '$lib/images.js';

import { binaryStorage } from './index.js';
import {
	accessBytes,
	byteSizeOfObject,
	createBytes,
	locatorToPath,
	resolveObjectWithBytes,
	storeBytes,
} from './utils.js';

beforeEach(async () => {
	nukeDatabase();
	// FIXME: doesnt work...
	// resetMockOPFS();

	await navigator.storage.getDirectory().then((root) => root.remove({ recursive: true }));
});

const imagefile = {
	contentType: 'image/png',
	dimensions: { width: 24, height: 24 },
	filename: 'feur.png',
	sessionId: 'tung',
	id: imageFileId(),
	bytes: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer,
};

describe('locatorToPath', () => {
	test('with session id', () => {
		expect(
			locatorToPath({
				area: 'ImageFile',
				sessionId: 'tung',
				name: 'feur.png',
			})
		).toBe('ImageFile/tung/feur.png');
	});
});

describe('byteSizeOfObject', () => {
	test('with a legacy in-db object', async () => {
		expect(await byteSizeOfObject('ImageFile', imagefile)).toBe(8);
	});

	test('with bytes in binary storage', async () => {
		const object = await createBytes('ImageFile', imagefile);

		expect(await byteSizeOfObject('ImageFile', object)).toBe(8);
	});
});

describe('createBytes', () => {
	test('with a session-dependent table', async () => {
		const written = await createBytes('ImageFile', imagefile);

		expect(written).toMatchObject({
			filename: imagefile.filename,
			sessionId: imagefile.sessionId,
			bytes: 'migrated',
		});

		const actual = await binaryStorage.bytes({
			area: 'ImageFile',
			sessionId: imagefile.sessionId,
			name: imagefile.filename,
		});

		expect(actual).toBeInstanceOf(ArrayBuffer);
		// expect(actual.byteLength).toBe(8);

		expect([...new Uint8Array(actual)]).toStrictEqual([
			...new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
		]);
	});

	// TODO: once we have a non-session-dependent table lol
});

describe('accessBytes', () => {
	test('with bytes in legacy in-db storage', async () => {
		expect(
			await accessBytes('ImageFile', {
				sessionId: 'tung',
				filename: 'feur.png',
				bytes: new Uint8Array([9, 8, 7]).buffer,
			})
		).toEqual(new Uint8Array([9, 8, 7]).buffer);
	});

	test('with bytes migrated in binary storage', async () => {
		const bytes = new Uint8Array([5, 4, 3]).buffer;
		const spy = vi.spyOn(binaryStorage, 'bytes').mockResolvedValueOnce(bytes);

		expect(
			await accessBytes('ImageFile', {
				sessionId: 'tung',
				filename: 'feur.png',
				bytes: 'migrated',
			})
		).toBe(bytes);
		expect(spy).toHaveBeenCalledWith({
			area: 'ImageFile',
			sessionId: 'tung',
			name: 'feur.png',
		});
	});
});

describe('storeBytes', () => {
	test('writes bytes to binary storage and returns migrated', async () => {
		const spy = vi.spyOn(binaryStorage, 'write').mockResolvedValueOnce(undefined);
		const content = new Uint8Array([1, 2, 3]).buffer;

		expect(
			await storeBytes(
				'ImageFile',
				{
					filename: 'feur.png',
					sessionId: 'tung',
					bytes: content,
					contentType: 'image/png',
					dimensions: { width: 24, height: 24 },
					id: 'img-1',
				},
				content
			)
		).toBe('migrated');
		expect(spy).toHaveBeenCalledWith(
			{
				area: 'ImageFile',
				sessionId: 'tung',
				name: 'feur.png',
			},
			content
		);
	});
});

describe('resolveObjectWithBytes', () => {
	test('returns undefined when the database has no object', async () => {
		const db = { get: vi.fn().mockResolvedValueOnce(undefined) } as const;

		expect(await resolveObjectWithBytes(db, 'ImageFile', 'missing')).toBeUndefined();
	});

	test('resolves migrated bytes through binary storage', async () => {
		const bytes = new Uint8Array([4, 5, 6]).buffer;
		const db = {
			get: vi.fn().mockResolvedValueOnce({
				id: 'abc',
				filename: 'feur.png',
				sessionId: 'tung',
				bytes: 'migrated',
			}),
		} as const;
		const spy = vi.spyOn(binaryStorage, 'bytes').mockResolvedValueOnce(bytes);

		expect(await resolveObjectWithBytes(db, 'ImageFile', 'abc')).toMatchObject({
			id: 'abc',
			filename: 'feur.png',
			sessionId: 'tung',
			bytes,
		});
		expect(spy).toHaveBeenCalledWith({
			area: 'ImageFile',
			sessionId: 'tung',
			name: 'feur.png',
		});
	});
});
