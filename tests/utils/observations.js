/**
 * @import { Page } from '@playwright/test';
 */

import { throwError } from './core.js';

/**
 *
 * @param {Page} page
 * @returns
 */
export function firstObservationCard(page) {
	return page.getByTestId('observations-area').getByRole('article').first();
}

/**
 * @param {Page} page
 * @param {string} label
 */
export function observationCard(page, label) {
	return page
		.getByTestId('observations-area')
		.getByRole('article')
		.filter({
			has: page.getByRole('heading', {
				name: label
			})
		})
		.first();
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
			throwError('Image with-exif-gps.jpeg not found')
	};
}
