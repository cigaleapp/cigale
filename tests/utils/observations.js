/**
 * @import { Page, Locator } from '@playwright/test';
 */

import { throwError } from './core.js';

/**
 * number: target n-th card (0-based);
 * string: target by title. Equivalent to title#0;
 * string#number: target n-th card within those that have the specified title
 * @typedef {number | `${string}#${number}` | string } GalleryCardSpecifier
 */

/**
 * @param {Page} page
 * @param {GalleryCardSpecifier | null} specifier if null is given, matches all cards and ignores {@link otherSpecifiers}
 * @param {...GalleryCardSpecifier} otherSpecifiers an .or() is put between Locators.
 * @returns {Locator}
 */
export function galleryCard(page, specifier, ...otherSpecifiers) {
	let cards = page.getByTestId('observations-area').getByRole('article');

	if (specifier === null) {
		return cards;
	}

	if (otherSpecifiers.length > 0) {
		return galleryCard(page, specifier).or(galleryCard(page, ...otherSpecifiers));
	}

	if (typeof specifier === 'number') {
		return cards.nth(specifier);
	}

	if (typeof specifier === 'string' && specifier.match(/^.+#\d+$/)) {
		const [title, nth] = specifier.split('#');
		return cards.filter({ has: page.getByRole('heading', { name: title }) }).nth(Number(nth));
	}

	return galleryCard(page, `${specifier}#0`);
}

/**
 * @param {import('../fixtures').AppFixture} app
 */
export async function imagesByName(app) {
	return {
		leaf:
			(await app.db.image.byFilename('leaf.jpeg')) ?? throwError('Image leaf.jpeg not found'),
		lilFella:
			(await app.db.image.byFilename('lil-fella.jpeg')) ??
			throwError('Image lil-fella.jpeg not found'),
		cyan:
			(await app.db.image.byFilename('cyan.jpeg')) ?? throwError('Image cyan.jpeg not found'),
		withExifGps:
			(await app.db.image.byFilename('with-exif-gps.jpeg')) ??
			throwError('Image with-exif-gps.jpeg not found'),
	};
}

/**
 * @param {import('../fixtures').AppFixture} app
 */
export async function observationsByLabel(app) {
	return {
		leaf:
			(await app.db.observation.byLabel('leaf')) ?? throwError('Observation leaf not found'),
		lilFella:
			(await app.db.observation.byLabel('lil-fella')) ??
			throwError('Observation lil-fella not found'),
		cyan:
			(await app.db.observation.byLabel('cyan')) ?? throwError('Observation cyan not found'),
		withExifGps:
			(await app.db.observation.byLabel('with-exif-gps')) ??
			throwError('Observation with-exif-gps not found'),
	};
}
