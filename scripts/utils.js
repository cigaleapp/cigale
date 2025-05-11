import * as JPEG from 'jpeg-js';
import { existsSync, readFileSync } from 'node:fs';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/**
 *
 * @param {string} filepath
 * @param {ReturnType<typeof decodePhoto>} oldDecodedPhoto
 * @returns
 */
export function photoChanged(filepath, oldDecodedPhoto) {
	if (!oldDecodedPhoto) return true;
	const newPhoto = decodePhoto(filepath);
	return (
		pixelmatch(
			oldDecodedPhoto.data,
			newPhoto.data,
			null,
			oldDecodedPhoto.width,
			oldDecodedPhoto.height,
			{ threshold: 0.1 }
		) > 0
	);
}

/**
 * @param {string} filepath
 */
export function decodePhoto(filepath) {
	if (!existsSync(filepath)) return undefined;

	switch (path.extname(filepath)) {
		case '.jpeg':
			return JPEG.decode(readFileSync(filepath));

		case '.png':
			return PNG.sync.read(readFileSync(filepath));
	}
}
