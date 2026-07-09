import type { BINARY_CONTENT_TABLES } from '$lib/database.js';
import type { PENDING_PHOTOS_ROOT_FOLDER } from '$routes/(app)/capture/pendingstorage.svelte.js';

export type BinaryStorageName = 'opfs' | 'capacitor' | 'uninitialized';

export interface BinaryStorageBackend<Name extends BinaryStorageName = BinaryStorageName> {
	name: Name;
	exists(locator: BinaryStorageLocator): Promise<boolean>;
	bytes(locator: BinaryStorageLocator): Promise<ArrayBuffer>;
	text(locator: BinaryStorageLocator): Promise<string>;
	/**
	 *
	 * @param locator
	 * @param fallbackContentType some backends don't store content types. for these backends, the returned File will use this value
	 */
	read(locator: BinaryStorageLocator, fallbackContentType: ContentType): Promise<File>;
	list(locator: BinaryStorageLocator<''>): AsyncIterable<BinaryStorageLocator>;
	/**
	 *
	 * @param locator where to write the file
	 * @param content can be an ArrayBuffer or a base64-encoded Uint8Array. Avoid converting to either of these in a callsite, since some backends prefer one and some prefer the other. This avoids unnecessary double-conversions. You can also store text, which is of course given as a string then.
	 */
	write(
		locator: BinaryStorageLocator,
		content: File | Blob | BinaryStorageContent
	): Promise<void>;
	/**
	 * Delete a file
	 * @param locator what file to delete
	 */
	delete(locator: BinaryStorageLocator): Promise<void>;
	/**
	 * Delete a directory
	 */
	clear(locator: BinaryStorageLocator<''>): Promise<void>;
	/**
	 * @returns size in bytes
	 */
	size(locator: BinaryStorageLocator): Promise<number>;
	/**
	 * @returns number of files in the given directory
	 */
	count(locator: BinaryStorageLocator<"">): Promise<number>;
}

export type BinaryStorageLocator<Filename extends string = string> = {
	area: (typeof BINARY_CONTENT_TABLES)[number] | typeof PENDING_PHOTOS_ROOT_FOLDER;
	sessionId: string | undefined;
	/** Use an empty string to denote an entire folder */
	name: Filename;
};

type ContentTypeCategory =
	| 'application'
	| 'audio'
	| 'font'
	| 'example'
	| 'image'
	| 'message'
	| 'model'
	| 'multipart'
	| 'text'
	| 'video'
	| `x-${string}`;

type ContentType<Category extends ContentTypeCategory = ContentTypeCategory> =
	`${Category}/${string}`;

export type BinaryStorageContent =
	| { type: ContentType<'text'>; text: string }
	| ({ type: ContentType<Exclude<ContentTypeCategory, 'text'>> } & (
			{ base64: string } | { bytes: Uint8Array<ArrayBuffer> | ArrayBuffer }
	  ));
