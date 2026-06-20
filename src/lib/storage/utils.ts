import type { BinaryStorageLocator } from './types.js';
import type { Tables } from '$lib/database.js';
import type { DatabaseHandle, IDBDatabaseType } from '$lib/idb.svelte.js';

import { binaryStorage } from './index.js';

/**
 * Get the size in bytes of the given database object
 */
export async function byteSizeOfObject<Table extends BinaryStorageLocator['table']>(
	table: Table,
	object: Pick<IDBDatabaseType[Table]['value'], 'sessionId' | 'filename' | 'bytes'>
): Promise<number> {
	if (object.bytes !== 'migrated') {
		return object.bytes.byteLength;
	}

	return binaryStorage.size({
		table,
		sessionId: 'sessionId' in object ? object.sessionId : undefined,
		name: object.filename,
	});
}

type CreateBytesObjectFields<Table extends BinaryStorageLocator['table']> = Pick<
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
export async function createBytes<Table extends BinaryStorageLocator['table']>(
	table: Table,
	input: CreateBytesObjectFields<Table> & { bytes: ArrayBuffer }
): Promise<CreateBytesObjectFields<Table> & { bytes: 'migrated' }> {
	const written = await binaryStorage.create(
		{
			table,
			sessionId: 'sessionId' in input ? input.sessionId : undefined,
			name: input.filename,
		},
		input.bytes
	);

	return {
		...input,
		filename: written.name,
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
export async function storeBytes<Table extends BinaryStorageLocator['table']>(
	table: Table,
	object: (typeof Tables)[Table]['inferIn'],
	content: ArrayBuffer
): Promise<'migrated'> {
	await binaryStorage.write(
		{
			table,
			sessionId: 'sessionId' in object ? object.sessionId : undefined,
			name: object.filename,
		},
		content
	);

	return 'migrated';
}

/**
 * Access bytes of a table object storing binary data in its `bytes` field.
 * Handles objects that have their binary data stored in the binary storage
 * @param object the table
 */
export async function accessBytes<Table extends BinaryStorageLocator['table']>(
	table: Table,
	object: Pick<(typeof Tables)[Table]['inferIn' | 'inferOut'], 'sessionId' | 'filename' | 'bytes'>
): Promise<ArrayBuffer> {
	if (object.bytes !== 'migrated') {
		return object.bytes;
	}

	console.debug(`accessBytes ${table}`, object);

	return binaryStorage.read({
		table,
		sessionId: 'sessionId' in object ? object.sessionId : undefined,
		name: object.filename,
	});
}

/**
 * Get an object from a table and resolves its `bytes` field to an ArrayBuffer
 * by reading in the binary storage if necessary
 * @param table
 * @param id
 * @returns the object (undefined if not found), with the bytes field always a {@link ArrayBuffer}
 */
export async function resolveObjectWithBytes<Table extends BinaryStorageLocator['table']>(
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
	return [locator.table, locator.sessionId, locator.name].filter(Boolean).join('/');
}
