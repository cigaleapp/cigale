import type { BINARY_CONTENT_TABLES } from '$lib/database.js';


export type BinaryStorageName = "opfs" | "local" | "uninitialized"

export interface BinaryStorageBackend<Name extends BinaryStorageName> {
	name: Name;
	exists(locator: BinaryStorageLocator): Promise<boolean>;
	read(locator: BinaryStorageLocator): Promise<ArrayBuffer>;
	write(locator: BinaryStorageLocator, content: ArrayBuffer): Promise<void>;
	delete(locator: BinaryStorageLocator): Promise<void>;
	/**
	 * @returns size in bytes
	 */
	size(locator: BinaryStorageLocator): Promise<number>;
}

export type BinaryStorageLocator = {
	table: (typeof BINARY_CONTENT_TABLES)[number];
	sessionId: string | undefined;
	name: string;
};
