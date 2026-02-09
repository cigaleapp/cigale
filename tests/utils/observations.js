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
			throwError('Observation with-exif-gps not found')
	};
}
