import type { BinaryStorageBackend } from './types.js';

import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

import { locatorToPath } from './utils.js';

export function CapacitorFilesystemBackend(): BinaryStorageBackend<'capacitor'> {
	if (!Capacitor.isNativePlatform())
		throw new Error('Capacitor filesystem binary storage backend is not supported on Web');

	const root = Directory.Data;

	return {
		name: 'capacitor',
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
		async bytes(locator) {
			const file = await Filesystem.readFile({
				directory: root,
				path: locatorToPath(locator),
			});

			const bytes = Uint8Array.fromBase64(file.data as string);

			return bytes.buffer;
		},
		async text(locator) {
			const bytes = await this.bytes(locator);

			return new TextDecoder().decode(bytes);
		},
		async read(locator, type) {
			return new File([await this.bytes(locator)], locator.name, { type });
		},
		async write(locator, content) {
			let base64: string;

			if (content instanceof Blob) {
				base64 = (await content.bytes()).toBase64();
			} else if ('text' in content) {
				base64 = btoa(content.text);
			} else if ('bytes' in content) {
				base64 = new Uint8Array(content.bytes).toBase64();
			} else {
				base64 = content.base64;
			}

			await Filesystem.writeFile({
				directory: root,
				path: locatorToPath(locator),
				data: base64,
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
		async count(locator) {
			return Filesystem.readdir({
				directory: root,
				path: locatorToPath(locator),
			})
				.then(({ files }) => files.length)
				.catch(() => 0);
		},
		async *list(locator) {
			const { files } = await Filesystem.readdir({
				directory: root,
				path: locatorToPath(locator),
			}).catch(() => ({ files: [] }));

			for (const file of files) {
				yield { ...locator, name: file.name };
			}
		},
		async clear(locator) {
			await Filesystem.rmdir({
				directory: root,
				path: locatorToPath(locator),
				recursive: true,
			});
		},
	};
}
