import type { BinaryStorageLocator } from './types.js';
import type { Tables } from '$lib/database.js';
import type { DatabaseHandle, IDBDatabaseType } from '$lib/idb.svelte.js';

import { pick } from '$lib/utils.js';

import { binaryStorage } from './index.js';

type BinaryTableName = Exclude<
	BinaryStorageLocator['area'],
	`.pending_captures${'' | `/${string}`}`
>;

/**
 * Get the size in bytes of the given database object
 */
export async function byteSizeOfObject<Table extends BinaryTableName>(
	table: Table,
	object: IDBDatabaseType[Table]['value'] extends { size?: number }
		? Pick<IDBDatabaseType[Table]['value'], 'sessionId' | 'filename' | 'bytes' | 'size'>
		: Pick<IDBDatabaseType[Table]['value'], 'sessionId' | 'filename' | 'bytes'>
): Promise<number> {
	if ('size' in object && (object.size ?? 0) > 0) {
		return object.size;
	}

	if (object.bytes !== undefined && object.bytes !== 'migrated') {
		return object.bytes.byteLength;
	}

	return binaryStorage.size({
		area: table,
		sessionId: 'sessionId' in object ? object.sessionId : undefined,
		name: object.filename,
	});
}

type CreateBytesObjectFields<Table extends BinaryTableName> = Pick<
	IDBDatabaseType[Table]['value'],
	'filename' | 'sessionId'
>;

/**
 * Stores bytes in binary storage for a to-be-created database object
 *
 * ```ts
 * await tables.ImageFile.add({
 * 		dimensions: { ... },
 * 		...(await createBytes("ImageFile", {
 * 			filename,
 * 			bytes,
 *		 	sessionId
 * 		})),
 * })
 * ```
 *
 * @param table
 * @param filename
 * @param content
 */
export async function createBytes<Table extends BinaryTableName>(
	table: Table,
	input: CreateBytesObjectFields<Table> & {
		bytes: ArrayBuffer;
		type: string;
	}
): Promise<CreateBytesObjectFields<Table> & { bytes: 'migrated'; size: number }> {
	const locator = {
		area: table,
		sessionId: 'sessionId' in input ? input.sessionId : undefined,
		name: input.filename,
	};

	const size = input.bytes.byteLength;

	console.debug('createBytes', table, input, 'at:', await binaryStorage.resolvePath(locator));

	const written = await binaryStorage.create(locator, pick(input, 'type', 'bytes'));

	return {
		...input,
		filename: written.name,
		size,
		bytes: 'migrated',
	};
}

/**
 * Stores bytes for the given database object in binary storage.
 *
 * **⚠️	This function does not handle filename conflicts. Don't use it to create new database objects**
 *
 * Returns `"migrated"` for ergonomics:
 *
 * ```ts
 * await tables.ImageFile.put({
 * 		filename: ...
 * 		dimensions: { ... },
 * 		bytes: await storeBytes(...), // sets the database field to "migrated"
 * })
 * ```
 *
 * Writes the binary content of the object in binary storage.
 */
export async function storeBytes<Table extends BinaryTableName>(
	table: Table,
	object: (typeof Tables)[Table]['inferIn'],
	content: ArrayBuffer
): Promise<'migrated'> {
	await binaryStorage.write(
		{
			area: table,
			sessionId: 'sessionId' in object ? object.sessionId : undefined,
			name: object.filename,
		},
		new File([content], object.filename, {
			type: object.contentType,
		})
	);

	return 'migrated';
}

/**
 * Access bytes of a table object storing binary data in its `bytes` field.
 * Handles objects that have their binary data stored in the binary storage
 */
export async function accessBytes<Table extends BinaryTableName>(
	table: Table,
	object: Pick<(typeof Tables)[Table]['inferIn' | 'inferOut'], 'sessionId' | 'filename' | 'bytes'>
): Promise<ArrayBuffer> {
	if (object.bytes !== 'migrated' && object.bytes !== undefined) {
		return object.bytes;
	}

	const locator = {
		area: table,
		sessionId: 'sessionId' in object ? object.sessionId : undefined,
		name: object.filename,
	};

	console.debug(`accessBytes ${table}`, object, 'at:', await binaryStorage.resolvePath(locator));

	return binaryStorage.bytes(locator);
}

/**
 * Stream bytes of a table object storing binary data in its `bytes` field.
 * Handles objects that have their binary data store in the binary storage
 */
export async function* streamBytes<Table extends (typeof BINARY_CONTENT_TABLES)[number]>(
	table: Table,
	object: Pick<
		(typeof Tables)[Table]['inferIn' | 'inferOut'],
		'sessionId' | 'filename' | 'bytes'
	>,
	chunksize: number
): AsyncIterable<{ total: number; index: number; bytes: ArrayBuffer }> {
	if (object.bytes !== 'migrated') {
		// TODO: stream these too
		yield { total: 1, index: 0, bytes: object.bytes };
		return;
	}

	const locator = {
		area: table,
		sessionId: 'sessionId' in object ? object.sessionId : undefined,
		name: object.filename,
	};

	console.debug(`streamBytes ${table}`, object, 'at:', await binaryStorage.resolvePath(locator));

	yield* binaryStorage.stream(locator, chunksize);
}

export async function deleteObjectWithBytes<Table extends BinaryTableName>(
	db: DatabaseHandle,
	table: Table,
	id: string
) {
	const object = await db.get(table, id);
	if (!object) return;

	const locator = {
		area: table,
		sessionId: 'sessionId' in object ? object.sessionId : undefined,
		name: object.filename,
	};

	console.debug(`deleteBytes ${table}`, object, 'at:', await binaryStorage.resolvePath(locator));

	await binaryStorage.delete(locator);
	await db.delete(table, id);
}

/**
 * Get an object from a table and resolves its `bytes` field to an ArrayBuffer
 * by reading in the binary storage if necessary
 * @param table
 * @param id
 * @returns the object (undefined if not found), with the bytes field always a {@link ArrayBuffer}
 */
export async function resolveObjectWithBytes<Table extends BinaryTableName>(
	db: DatabaseHandle,
	table: Table,
	id: string
): Promise<
	undefined | (Omit<IDBDatabaseType[NoInfer<Table>]['value'], 'bytes'> & { bytes: ArrayBuffer })
> {
	const object = await db.get(table, id);

	if (!object) return undefined;

	return {
		...object,
		bytes: await accessBytes(table, object),
	};
}

export function locatorToPath(locator: BinaryStorageLocator): string {
	return [locator.area, locator.sessionId, locator.name].filter(Boolean).join('/');
}

/**
 * Returns the bytes of the database object,
 * but only if the current binary storage
 * doesn't support web workers
 */
export async function resolveObjectBytesIfNotWorker<Table extends BinaryTableName>(
	db: DatabaseHandle,
	table: Table,
	id: string
): Promise<undefined | ArrayBuffer> {
	if (binaryStorage.supportsWorkers) return;

	const object = await db.get(table, id);

	if (!object) throw new Error(`${table} with ID ${id} not found`);

	return await accessBytes('ImageFile', object);
}
