import { test as base } from '@playwright/test';

/**
 * @import { TestType, PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions } from '@playwright/test';
 */

/**
 * @type {TestType<PlaywrightTestArgs & PlaywrightTestOptions & { db: {name: string; version: number} }, PlaywrightWorkerArgs & PlaywrightWorkerOptions>}
 */
export const test = base.extend({
	db: async (_, use) => {
		use({ name: 'database', version: 3 });
	}
});

export { expect } from '@playwright/test';
