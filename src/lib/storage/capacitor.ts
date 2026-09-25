import type { BinaryStorageBackend, BinaryStorageLocator, BinaryStoragePath } from './types.js';

import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

import { Channel } from '$lib/utils.js';

import { locatorToPath as _locatorToPath } from './utils.js';

function locatorToPath(locator: BinaryStorageLocator) {
	return ['Cigale', _locatorToPath(locator)].join('/');
}

export async function CapacitorFilesystemBackend(): Promise<BinaryStorageBackend<'capacitor'>> {
	if (!Capacitor.isNativePlatform())
		throw new Error('Capacitor filesystem binary storage backend is not supported on Web');

	const root = Directory.Documents;

	const inww =
		'WorkerGlobalScope' in self &&
		typeof WorkerGlobalScope !== undefined &&
		self instanceof WorkerGlobalScope;

	console.debug(
		`opening (in ${inww ? 'ww' : 'ui'} context) capacitor binarystorage backend in ${root}. files:\n`,
		debugdir(root)
	);

	return {
		backend: 'capacitor',
		// TODO: figure out a way to do that?
		supportsWorkers: false,
		async resolvePath(locator) {
			return CapacitorFilepath.fromLocator(root, locator);
		},
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
			try {
				const file = await Filesystem.readFile({
					directory: root,
					path: locatorToPath(locator),
				});

				const bytes = Uint8Array.fromBase64(file.data as string);

				return bytes.buffer;
			} catch (e) {
				console.error(`Couldn't read file at ${locatorToPath(locator)}: `, e);
				console.debug(`Contents at root:`, await debugdir(root));
				console.debug(`Contents at ${locator.area}`, await debugdir(root, locator.area));
				console.debug(
					`Contents at ${locatorToPath({ ...locator, name: '' })}`,
					await debugdir(root, locatorToPath({ ...locator, name: '' }))
				);

				throw e;
			}
		},
		async *stream(locator, chunkSize) {
			const updates = new Channel<[value: ArrayBuffer | null, error: unknown]>();

			void Filesystem.readFileInChunks(
				{
					directory: root,
					path: locatorToPath(locator),
					chunkSize,
				},
				(data, err) => {
					if (data === null) {
						updates.finish([data, err]);
					} else if (!data.data) {
						updates.close();
					} else if (typeof data.data === 'string') {
						updates.push([Uint8Array.fromBase64(data.data).buffer, err]);
					} else {
						// Only happens on mobile, so no need for that here
						// updates.push([await data.data.arrayBuffer(), err]);
					}
				}
			);

			for await (const [chunk, error] of updates) {
				if (error) throw error;
				if (chunk) yield chunk;
			}
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
			}).catch(() => ({ size: 0 }));

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
	} as BinaryStorageBackend<'capacitor'>;
}

async function debugdir(dir: Directory, path = '') {
	return await Filesystem.readdir({
		directory: dir,
		path: ['Cigale', path].join('/'),
	})
		.then((r) => r.files.map((f) => `${f.size}\t${f.name}`).join('\n'))
		.catch(() => '<not found>');
}

export class CapacitorFilesystemPath implements BinaryStoragePath {
	backend = 'capacitor' as const;

	constructor(
		public uri: string,
		private locator: BinaryStorageLocator
	) {}

	static async fromLocator(root: Directory, locator: BinaryStorageLocator) {
		const result = await Filesystem.getUri({
			directory: root,
			path: locatorToPath(locator),
		});

		return new CapacitorFilesystemPath(result.uri, locator);
	}

	toLocator() {
		return this.locator;
	}

	toString() {
		return this.uri;
	}

	equals(other: BinaryStoragePath): other is CapacitorFilesystemPath {
		if (!(other instanceof CapacitorFilesystemPath)) return false;
		return this.uri === other.uri;
	}
}
