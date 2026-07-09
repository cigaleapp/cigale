import { Capacitor } from '@capacitor/core';
import { FileViewer } from '@capacitor/file-viewer';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import YAML from 'yaml';

import { keys } from './utils.js';

export async function openFileFromUrl(url: URL | string) {
	if (Capacitor.isNativePlatform()) {
		await FileViewer.openDocumentFromUrl({
			url: url.toString(),
		});
	} else {
		const a = document.createElement('a');
		a.href = url.toString();
		a.download = 'true';
		a.click();
	}
}

/**
 * **WARNING:** On native platforms, binary data is converted to base64 before writing, which can lag the UI for large files.
 * @param contentType defaults to 'text/plain' for strings and 'application/octet-stream' for blobs
 * @returns Saved file's URI on native platforms, void on web
 */
export async function downloadAsFile(
	content: Blob | ArrayBuffer | string,
	filename: string,
	contentType: string
): Promise<URL | void> {
	if (Capacitor.isNativePlatform()) {
		const permission = await Filesystem.checkPermissions();
		if (permission.publicStorage !== 'granted') {
			await Filesystem.requestPermissions();
		}

		const { path: directoryUri } = await FilePicker.pickDirectory();

		console.info('Got directory URI', directoryUri);

		// Directory URI looks like: content://com.android.externalstorage.documents/tree/primary%3ADocuments%2Fcigale%20exports
		const directory = new URL(
			decodeURIComponent(new URL(directoryUri).pathname.split('/').at(-1) || '')
		).pathname;

		console.info('Saving file to', directory);

		/** @type {Pick<import('@capacitor/filesystem').WriteFileOptions, 'data' | 'encoding'>} */
		let input: Pick<import('@capacitor/filesystem').WriteFileOptions, 'data' | 'encoding'>;

		if (typeof content === 'string') {
			input = {
				data: content,
				encoding: Encoding.UTF8,
			};
		} else {
			input = {
				data: new Uint8Array(
					content instanceof Blob ? await content.arrayBuffer() : content
				).toBase64(),
			};
		}

		const { uri } = await Filesystem.writeFile({
			path: `${directory.replace(/^content:\/\//, '')}/${filename}`,
			directory: Directory.ExternalStorage,
			...input,
		});

		console.info('File saved to', uri);

		try {
			return new URL(uri);
		} catch (_err) {
			// Some platforms return URIs that the URL constructor doesn't accept in Node/jsdom.
			// Fall back to returning the raw string so callers can handle it.
			return uri;
		}
	} else {
		const blob =
			content instanceof Blob
				? content
				: new Blob([content], {
						type:
							contentType ??
							(typeof content === 'string'
								? 'text/plain'
								: 'application/octet-stream'),
					});

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}
}

/**
 *
 * @param object the object to serialize
 * @param ordering an array of keys in target order, for the top-level object
 * @param schema the json schema URL
 */
export function stringifyWithToplevelOrdering<Keys extends string>(
	format: 'json' | 'yaml',
	schema: string,
	object: { [K in Keys]?: unknown },
	ordering: readonly Keys[]
) {
	let keysOrder = [...ordering];

	if (format === 'json') {
		// @ts-expect-error $schema is not in Keys but we add it anyways
		keysOrder = ['$schema', ...keysOrder];
	}

	const reviver = (_: unknown, value: unknown) => {
		if (value === null) return value;
		if (Array.isArray(value)) return value;
		if (typeof value !== 'object') return value;

		if (keys(value).every((key) => keysOrder.includes(key))) {
			// @ts-expect-error key in value thanks to if check above
			return Object.fromEntries(keysOrder.map((key) => [key, value[key]]));
		}
		return value;
	};

	if (format === 'yaml') {
		const yamled = YAML.stringify(object, reviver, 2);
		return `# yaml-language-server: $schema=${schema}\n\n${yamled}`;
	}

	return JSON.stringify({ $schema: schema, ...object }, reviver, 2);
}
