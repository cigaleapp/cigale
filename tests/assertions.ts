import type { Locator } from '@playwright/test';

import { expect as baseExpect } from '@playwright/test';

import { expectTooltipContent } from './utils/index.js';

export const assert = baseExpect.extend({
	async toHaveTooltip(
		locator: Locator,
		/** null to expect no tooltip on the element */
		expected: string | RegExp | null,
		options?: { timeout?: number }
	) {
		const assertionName = 'toHaveTooltip';

		/**
		 * Used when expected=null and we failed (we got a tooltip)
		 * since in that case, expectTooltipContent() does not throw
		 *
		 * We do it like this instead of handling it in expectTooltipContent,
		 * so that we still get the timeout behavior (ie checking that there's really no tooltip,
		 * even if it takes a little while to show up)
		 */
		let tooltipTextActual = '';

		let pass: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let matcherResult: any;
		try {
			tooltipTextActual = await expectTooltipContent(
				locator.page(),
				locator,
				expected === null ? /.*/ : expected,
				options
			);
			pass = true;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			matcherResult = e.matcherResult;
			pass = false;
		}

		if (expected === null) pass = !pass;
		if (this.isNot) pass = !pass;

		const message = () =>
			this.utils.matcherHint(assertionName, undefined, undefined, {
				isNot: this.isNot,
			}) +
			'\n\n' +
			`Locator: ${locator}\n` +
			`Expected: ${this.isNot ? 'not' : ''} ${expected === null ? 'no tooltip' : `tooltip with ${this.utils.printExpected(expected)}`}\n` +
			(matcherResult || tooltipTextActual
				? `Received: ${this.utils.printReceived(tooltipTextActual || matcherResult.actual)}`
				: '');

		return {
			message,
			pass,
			name: assertionName,
			expected,
			actual: matcherResult?.actual,
		};
	},

	async toBeOnSlide(locator: Locator, slideName: string, options?: { timeout?: number }) {
		const assertionName = 'toBeOnSlide';

		let pass: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let matcherResult: any;

		try {
			const currentSlide = locator.locator("[data-current-slide='true']");
			await assert(currentSlide).toHaveAccessibleName(slideName, options);
			pass = true;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			matcherResult = e.matcherResult;
			pass = false;
		}

		if (this.isNot) pass = !pass;

		const message = () =>
			this.utils.matcherHint(assertionName, undefined, undefined, {
				isNot: this.isNot,
			}) +
			'\n\n' +
			`Locator: ${locator}\n` +
			`Expected: ${this.isNot ? 'not' : ''} to be on slide ${this.utils.printExpected(slideName)}\n` +
			(matcherResult
				? `Received: is on slide ${this.utils.printReceived(matcherResult.actual)}`
				: '');

		return {
			message,
			pass,
			name: assertionName,
			expected: slideName,
			actual: matcherResult?.actual,
		};
	},
});

// Encourage using soft expects in tests, and only use hard expects (assert in our case) when it's necessary for the rest of the test to continue
export const expect = assert.soft;
