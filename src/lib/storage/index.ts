import type { BinaryStorageBackend, BinaryStorageLocator, BinaryStorageName } from './types.js';

import { Capacitor } from '@capacitor/core';
import { dichotomid } from 'dichotomid';

import { splitFilenameOnExtension } from '$lib/utils.js';

import { LocalFilesystemBackend } from './localfs.js';
import { OPFSBackend } from './opfs.js';
import { locatorToPath } from './utils.js';

let currentBackend: undefined | BinaryStorageBackend<BinaryStorageName>;

export const binaryStorage: BinaryStorage = {
	name: currentBackend?.name ?? 'uninitialized',
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
	async write(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		return currentBackend!.write(...args);
	},
	async size(...args) {
		if (!currentBackend) await initializeBinaryStorage();
		return currentBackend!.size(...args);
	},
	async create(locator, content) {
		const [stem, ext] = splitFilenameOnExtension(locator.name);

		const name = (i: number) => ({
			...locator,
			name: i >= 2 ? `${stem}_${i}.${ext}` : `${stem}.${ext}`,
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
		currentBackend = LocalFilesystemBackend();
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
	create(locator: BinaryStorageLocator, content: ArrayBuffer): Promise<BinaryStorageLocator>;
	/**
	 * Only write if the file already exists. Otherwise, error out.
	 */
	overwrite(locator: BinaryStorageLocator, content: ArrayBuffer): Promise<void>;
}
