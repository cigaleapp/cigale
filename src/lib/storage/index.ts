import type {
	BinaryStorageBackend,
	BinaryStorageContent,
	BinaryStorageLocator,
	BinaryStorageName,
} from './types.js';

import { Capacitor } from '@capacitor/core';
import { dichotomid } from 'dichotomid';

import { splitFilenameOnExtension } from '$lib/utils.js';

import { CapacitorFilesystemBackend } from './capacitor.js';
import { OPFSBackend } from './opfs.js';
import { locatorToPath } from './utils.js';

let currentBackend: undefined | BinaryStorageBackend<BinaryStorageName>;

export const binaryStorage: BinaryStorage = {
	name: currentBackend?.name ?? 'uninitialized',
	async resolvePath(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		return currentBackend!.resolvePath(...args);
	},
	async exists(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		return currentBackend!.exists(...args);
	},
	async delete(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		return currentBackend!.delete(...args);
	},
	async read(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		return currentBackend!.read(...args);
	},
	async bytes(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		return currentBackend!.bytes(...args);
	},
	async text(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		return currentBackend!.text(...args);
	},
	async write(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		return currentBackend!.write(...args);
	},
	async size(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		return currentBackend!.size(...args);
	},
	async clear(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		return currentBackend!.clear(...args);
	},
	async *list(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		for await (const item of currentBackend!.list(...args)) {
			yield item;
		}
	},
	async count(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		return currentBackend!.count(...args);
	},
	async create(locator, content, { fixedFilenameCounter = 0 } = {}) {
		const [stem, ext] = splitFilenameOnExtension(locator.name);

		const name = (i: number) => ({
			...locator,
			name:
				i >= 2 || fixedFilenameCounter
					? `${stem}_${i.toString().padStart(fixedFilenameCounter, '0')}.${ext}`
					: `${stem}.${ext}`,
		});

		const chosen = name(await dichotomid(async (i) => !(await this.exists(name(i)))));

		await this.write(chosen, content);

		return chosen;
	},
	async overwrite(locator, content) {
		const exists = await this.exists(locator);

		if (!exists)
			throw new Error(`File ${locatorToPath(locator)} does not exist in ${this.name}`);

		return this.write(locator, content);
	},
};

async function initializeBinaryStorage() {
	if (currentBackend) return;

	if (Capacitor.isNativePlatform()) {
		currentBackend = CapacitorFilesystemBackend();
	} else {
		currentBackend = await OPFSBackend();
	}
}

interface BinaryStorage<
	Name extends BinaryStorageName = BinaryStorageName,
> extends BinaryStorageBackend<Name> {
	/**
	 * If the file exists, add a _n at the end (with n chosen so that it doesn't exist)
	 * before writing to avoid duplicates.
	 * @returns the actual name used to write the file (last segment of the locator)
	 */
	create(
		locator: BinaryStorageLocator,
		content: BinaryStorageContent,
		options?: {
			/**
			 * Always add a trailing _N before the extension part of the filename,
			 * even if there's no need for it duplicates avoidance.
			 * Ensures that N has at least the provided number of digits.
			 *
			 * This is useful to ensure a consistent file naming scheme (in PendingStorage, for example)
			 *
			 * Defaults to 0 (disabled).
			 */
			fixedFilenameCounter?: number;
		}
	): Promise<BinaryStorageLocator>;
	/**
	 * Only write if the file already exists. Otherwise, error out.
	 */
	overwrite(locator: BinaryStorageLocator, content: BinaryStorageContent): Promise<void>;
}
