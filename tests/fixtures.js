import { test as base } from '@playwright/test';
import { rm, mkdir } from 'node:fs/promises';
import exampleProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import defaultProtocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };

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
			async ({ page, context }, use) => {
				// https://playwright.dev/docs/service-workers-experimental
				process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

				await rm('./tests/results', { recursive: true, force: true });
				await mkdir('./tests/results');

				// Context: service workers. Page: regular fetch() requests (for browsers that don't support service worker instrumentation)
				await Promise.all(
					[context, page].map(async (target) =>
						target.route(
							(u) => {
								u.searchParams.delete('v');
								return u.toString() === defaultProtocol.source;
							},
							async (route) => route.fulfill({ json: exampleProtocol })
						)
					)
				);

				await page.goto('/');
				// @ts-expect-error
				await page.waitForFunction(() => Boolean(window.devalue && window.DB && window.refreshDB));
				await use();
			},
			{ auto: true }
		]
	})
);

export { expect } from '@playwright/test';
