import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'path';
import * as JPEG from 'jpeg-js';
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
	const diffPhoto = new PNG({
		width: oldDecodedPhoto.width,
		height: oldDecodedPhoto.height
	});
	const changed =
		pixelmatch(
			oldDecodedPhoto.data,
			newPhoto.data,
			diffPhoto.data,
			oldDecodedPhoto.width,
			oldDecodedPhoto.height,
			{ threshold: 0.1 }
		) > 0;

	if (changed) {
		writeFileSync(
			filepath.replace(/\.(jpeg|png)$/, '.diff.png'),
			PNG.sync.write(diffPhoto, {
				colorType: 6
			})
		);
	}

	return changed;
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

/**
 * Semi-open range [start=0, end)
 * @param {number} startOrEnd
 * @param {number|undefined} [end]
 * @returns {number[]}
 */
export function range(startOrEnd, end = undefined) {
	if (end === undefined) {
		return Array.from({ length: startOrEnd }, (_, i) => i);
	}
	return Array.from({ length: end - startOrEnd }, (_, i) => i + startOrEnd);
}
