import { test as base } from '@playwright/test';
import { rm, mkdir } from 'node:fs/promises';
import exampleProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };

export { exampleProtocol };

// Make exampleProtocol lightweight by cutting out 90% of metadata options

/**
 * @import { Fixtures, TestType, PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions } from '@playwright/test';
 */

/**
 * @type {TestType<{ forEachTest: void } & PlaywrightTestArgs & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions >}
 */
export const test = base.extend(
	/**
	 * @type {Fixtures<{forEachTest: void}, {}, PlaywrightTestArgs & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions>}
	 */
	({
		forEachTest: [
			async ({ page }, use) => {
				await rm('./tests/results', { recursive: true, force: true });
				await mkdir('./tests/results');
				await page.route(
					'https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.json',
					async (route) => route.fulfill({ json: exampleProtocol })
				);
				await page.goto('/');
				// @ts-expect-error
				await page.waitForFunction(() => Boolean(window.DB && window.refreshDB));
				await use();
			},
			{ auto: true }
		]
	})
);

export { expect } from '@playwright/test';
