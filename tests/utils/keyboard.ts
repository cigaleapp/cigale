import type { Page } from '@playwright/test';

/**
 * Prepends Control+ or Meta+ to the given key presses,
 * depending on the browser's platform
 *
 * This is like ControlOrMeta, but uses the browser's platform
 * instead of the test runner's, which is kinda dumb
 * @see https://github.com/microsoft/playwright/blob/508f8ec97be3b0ced1e6266583d1bc703fe140d6/packages/playwright-core/src/server/input.ts#L182
 */
export function controlOrMeta(page: Page, presses: string) {
	if (page.context().browser()?.browserType().name() === 'webkit') {
		return `Meta+${presses}`;
	}

	return `Control+${presses}`;
}
