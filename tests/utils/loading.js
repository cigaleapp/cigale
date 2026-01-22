import { expect } from '@playwright/test';

import { makeRegexpUnion } from './core.js';

/**
 * @import { Page, Locator } from '@playwright/test';
 */

export const loadingText = makeRegexpUnion('Chargement…', 'Analyse…', 'En attente');

const loadingNotQueuedText = makeRegexpUnion('Chargement…', 'Analyse…');

/**
 *
 * @param {Locator | Page} area
 * @param {{ begin?: number, finish?: number, concurrency?: number } | number} [timeout]
 */
export async function waitForLoadingEnd(area, timeout = 30_000) {
	const concurrency = typeof timeout === 'number' ? 1 : (timeout.concurrency ?? 1);

	const timeouts =
		typeof timeout === 'number'
			? {
					begin: timeout,
					finish: timeout
				}
			: {
					begin: 30_000,
					finish: 120_000,
					...timeout
				};

	await expect(area.getByText(loadingText).first()).toBeVisible({
		timeout: timeouts.begin
	});

	if (concurrency > 1) {
		// Ensure we have multiple (concurrency amount) loading items occurring at once (really loading, not just queued)
		await expect(area.getByText(loadingNotQueuedText)).toHaveCount(concurrency, {
			timeout: timeouts.begin
		});
	}

	await expect(area.getByText(loadingText)).toHaveCount(0, {
		timeout: timeouts.finish
	});
}
