import { test as base } from '@playwright/test';
import { rm, mkdir } from 'node:fs/promises';
import exampleProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import defaultProtocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import { mockProtocolSourceURL, setHardwareConcurrency } from './utils';

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
			async ({ page, context }, use, { tags, annotations }) => {
				// https://playwright.dev/docs/service-workers-experimental
				process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

				await rm('./tests/results', { recursive: true, force: true });
				await mkdir('./tests/results', { recursive: true });

				if (!tags.includes('@real-protocol')) {
					await mockProtocolSourceURL(page, context, defaultProtocol.source, {
						json: exampleProtocol
					});
				}

				const concurrency = annotations.find((a) => a.type === 'concurrency')?.description;
				if (concurrency) {
					await setHardwareConcurrency(page, Number.parseInt(concurrency));
				}

				if (
					tags.includes('@webkit-no-parallelization') &&
					context.browser()?.browserType().name() === 'webkit'
				) {
					await setHardwareConcurrency(page, 1);
				}

				await page.goto('./');
				await page.waitForFunction(() => Boolean(window.devalue && window.DB && window.refreshDB));
				await use();
			},
			{ auto: true }
		]
	})
);

export { expect } from '@playwright/test';
