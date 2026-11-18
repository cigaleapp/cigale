import type { BinaryStorageBackend, BinaryStorageLocator } from './types.js';

import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import * as mediabunny from 'mediabunny';

import { locatorToPath } from './utils.js';

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

	function at(locator: BinaryStorageLocator) {
		return {
			directory: root,
			path: ['Cigale', locatorToPath(locator)].join('/'),
		};
	}

	return {
		name: 'capacitor',
		async resolvePath(locator) {
			const result = await Filesystem.getUri(at(locator));
			return result.uri;
		},
		async exists(locator) {
			try {
				// TODO: does getUri also fail if the file doesnt exist? it could be a slightly more performant check than stat maybe
				const stat = await Filesystem.stat(at(locator));
				console.debug('[local fs] exists? yes: ', at(locator).path, stat);
			} catch (error) {
				console.debug('[local fs] exists? no: ', at(locator).path, error);
				return false;
			}

			return true;
		},
		async delete(locator) {
			await Filesystem.deleteFile(at(locator));
		},
		async bytes(locator) {
			try {
				return await Filesystem.readFile(at(locator))
					.then((result) => result.data as string)
					.then((base64) => Uint8Array.fromBase64(base64))
					.then((bytes) => bytes.buffer);
			} catch (e) {
				console.error(`Couldn't read file at ${at(locator).path}: `, e);
				console.debug(`Contents at root:`, await debugdir(root));
				console.debug(`Contents at ${locator.area}`, await debugdir(root, locator.area));
				console.debug(
					`Contents at ${at({ ...locator, name: '' }).path}`,
					await debugdir(root, at({ ...locator, name: '' }).path)
				);

				throw e;
			}
		},
		async *stream(locator, _chunksize) {
			// TODO: see if it's possible?
			yield this.bytes(locator);
		},
		async text(locator) {
			const bytes = await this.bytes(locator);

			return new TextDecoder().decode(bytes);
		},
		async read(locator, type) {
			const info = await Filesystem.stat(at(locator)).catch(() => undefined);

			const attrs: FilePropertyBag = { type };

			if (info) attrs.lastModified = info.mtime;

			return new File([await this.bytes(locator)], locator.name, attrs);
		},
		async readChunk(locator, start, end) {
			// TODO: see if its possible,
			const all = await this.bytes(locator);
			return all.slice(start, end);
		},
		async mediabunnySource(locator) {
			// TODO: see if we can do random access instead of RAM full load
			return new mediabunny.BufferSource(await this.bytes(locator));
		},
		async mediabunnyTarget(locator) {
			// TODO: see if we can do random access instead of RAM full load
			return new mediabunny.BufferTarget({
				onFinalize: async (buffer) => {
					await this.write(locator, {
						bytes: buffer,
						type: 'application/octet-stream',
					});
				},
			});
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
				...at(locator),
				data: base64,
				recursive: true,
			});
		},
		async size(locator) {
			const stat = await Filesystem.stat(at(locator)).catch(() => ({ size: 0 }));

			return stat.size;
		},
		async count(locator) {
			return Filesystem.readdir(at(locator))
				.then(({ files }) => files.length)
				.catch(() => 0);
		},
		async *list(...locators) {
			for (const locator of locators) {
				const { files } = await Filesystem.readdir(at(locator)).catch((error) => {
					console.error('could not read ', at(locator).path, error);
					return { files: [] };
				});

				for (const file of files) {
					yield { ...locator, name: file.name };
				}
			}
		},
		async clear(locator) {
			await Filesystem.rmdir({
				...at(locator),
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
