import { test as base } from '@playwright/test';

/**
 * @import { TestType, PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions } from '@playwright/test';
 */

/**
 * @type {TestType<{ forEachTest: void } & PlaywrightTestArgs & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions>}
 */
export const test = base.extend({
	forEachTest: [
		async ({ page }, use) => {
			await page.goto('/');
			await page.waitForFunction(() => Boolean(window.DB));
			await use();
		},
		{ auto: true }
	]
});

export { expect } from '@playwright/test';
