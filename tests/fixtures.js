import { test as base } from '@playwright/test';
import path from 'node:path';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';

/**
 * @import { TestType, PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions } from '@playwright/test';
 */

const coverageOutDir = path.join(process.cwd(), '.nyc_output');

export function uuid() {
	return crypto.randomBytes(16).toString('hex');
}

/**
 * @type {TestType<{ forEachTest: void } & PlaywrightTestArgs & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions>}
 */
export const test = base.extend({
	forEachTest: [
		async ({ page }, use) => {
			await page.goto('/');
			// @ts-expect-error
			await page.waitForFunction(() => Boolean(window.DB && window.refreshDB));
			await use();
		},
		{ auto: true }
	],
	context: async ({ context }, use) => {
		if (process.env.PLAYWRIGHT_TEST_COVERAGE === '1') {
			await context.addInitScript(() =>
				window.addEventListener('beforeunload', () =>
					// @ts-expect-error
					window.collectIstanbulCoverage(JSON.stringify(window.__coverage__))
				)
			);
			await fs.promises.mkdir(coverageOutDir, { recursive: true });
			await context.exposeFunction('collectIstanbulCoverage', (/** @type {any} */ coverageJSON) => {
				if (coverageJSON)
					fs.writeFileSync(
						path.join(coverageOutDir, `playwright_coverage_${uuid()}.json`),
						coverageJSON
					);
			});
		}
		await use(context);
		if (process.env.PLAYWRIGHT_TEST_COVERAGE === '1') {
			for (const page of context.pages()) {
				await page.evaluate(() =>
					// @ts-expect-error
					window.collectIstanbulCoverage(JSON.stringify(window.__coverage__))
				);
			}
		}
	}
});

export { expect } from '@playwright/test';
