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
