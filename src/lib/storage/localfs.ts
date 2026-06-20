import type { BinaryStorageBackend } from './types.js';

import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

import { locatorToPath } from './utils.js';

export function LocalFilesystemBackend(): BinaryStorageBackend<'local'> {
	if (!Capacitor.isNativePlatform())
		throw new Error('Local filesystem binary storage backend is not supported on Web');

	const root = Directory.Data;

	return {
		name: 'local',
		async exists(locator) {
			try {
				const stat = await Filesystem.stat({
					directory: root,
					path: locatorToPath(locator),
				});
				console.debug('[local fs] exists? yes: ', locatorToPath(locator), stat);
			} catch (error) {
				console.debug('[local fs] exists? no: ', locatorToPath(locator), error);
				return false;
			}

			return true;
		},
		async delete(locator) {
			await Filesystem.deleteFile({
				directory: root,
				path: locatorToPath(locator),
			});
		},
		async read(locator) {
			const file = await Filesystem.readFile({
				directory: root,
				path: locatorToPath(locator),
			});

			const bytes = Uint8Array.fromBase64(file.data as string);

			return bytes.buffer;
		},
		async write(locator, content) {
			await Filesystem.writeFile({
				directory: root,
				path: locatorToPath(locator),
				data: new Uint8Array(content).toBase64(),
				recursive: true,
			});
		},
		async size(locator) {
			const stat = await Filesystem.stat({
				directory: root,
				path: locatorToPath(locator),
			});

			return stat.size;
		},
	};
}
