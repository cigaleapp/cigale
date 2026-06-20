import 'fake-indexeddb/auto';
import 'opfs-mock';

import { beforeEach, describe, expect, test } from 'vitest';

import { nukeDatabase } from '$lib/idb.svelte.js';
import { imageFileId } from '$lib/images.js';
import { arrayBufferContents } from '$lib/utils.js';

import { binaryStorage } from './index.js';
import { byteSizeOfObject, createBytes, locatorToPath } from './utils.js';

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
				table: 'ImageFile',
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

		const actual = await binaryStorage.read({
			table: 'ImageFile',
			sessionId: imagefile.sessionId,
			name: imagefile.filename,
		});

		expect(actual).toBeInstanceOf(ArrayBuffer);
		// expect(actual.byteLength).toBe(8);

		expect([...arrayBufferContents(actual)]).toStrictEqual([...arrayBufferContents(actual)]);
	});

	// TODO: once we have a non-session-dependent table lol
});

describe('accessBytes', () => {
	test('with bytes in legacy in-db storage', async () => {});
});
