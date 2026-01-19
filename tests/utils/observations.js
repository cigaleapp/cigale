/**
 * @import { Page } from '@playwright/test';
 */

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
