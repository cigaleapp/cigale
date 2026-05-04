import type { WriteFileOptions } from '@capacitor/filesystem';

import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { UAParser } from 'ua-parser-js';

import { downloadAsFile } from './download.js';

/**
 * If on a platform with meaningful & habitual file management capabilities (mostly computers), trigger a download.
 * On platforms with a stronger culture of sharing files with other apps (mostly mobile), trigger a share.
 */
export async function shareOrDownloadAsFile(
	content: Blob | ArrayBuffer | string,
	filename: string,
	contentType?: string
) {
	const device = Capacitor.isNativePlatform()
		? 'mobile'
		: new UAParser(navigator.userAgent).getDevice().type;

	switch (device) {
		case 'desktop':
			return downloadAsFile(content, filename, contentType);

		default:
			return shareAsFile(content, filename, contentType);
	}
}

async function shareAsFile(
	content: Blob | ArrayBuffer | string,
	filename: string,
	contentType?: string
) {
	if (Capacitor.isNativePlatform()) {
		let input: Pick<WriteFileOptions, 'data' | 'encoding'>;

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
			path: filename,
			directory: Directory.Cache,
			...input,
		});

		await Share.share({
			title: filename,
			files: [uri],
		});
	} else {
		await navigator.share({
			title: filename,
			files: [
				new File([content], filename, {
					type:
						contentType ??
						(typeof content === 'string' ? 'text/plain' : 'application/octet-stream'),
				}),
			],
		});
	}
}

export async function shareUrl(url: string|URL, title?: string) {
	if (Capacitor.isNativePlatform()) {
		await Share.share({
			title,
			url: url.toString(),
		});
	} else if (navigator.canShare && navigator.canShare({ url })) {
		await navigator.share({
			title,
			url: url.toString(),
		});
	} else {
		// Fallback to copying the URL to clipboard if sharing is not supported
		await navigator.clipboard.writeText(url.toString());
		alert('Lien copié dans le presse-papiers : ' + url.toString());
	}
}
