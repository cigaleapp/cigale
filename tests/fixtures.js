import { test as base } from '@playwright/test';

/**
 * @import { Fixtures, TestType, PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions } from '@playwright/test';
 */

/**
 * @type {TestType<{ forEachTest: void } & PlaywrightTestArgs, PlaywrightWorkerArgs >}
 */
export const test = base.extend(
	/**
	 * @type {Fixtures<{forEachTest: void}, {}, PlaywrightTestArgs, PlaywrightWorkerArgs>}
	 */
	({
		forEachTest: [
			async ({ page }, use) => {
				console.log(`Running `);
				await page.goto('/');
				await page.waitForFunction(() => Boolean(window.DB && window.refreshDB));
				await use();
			},
			{ auto: true }
		]
	})
);

export { expect } from '@playwright/test';
