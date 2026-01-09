/**
 * @import { TestAnnotation } from '@playwright/test'
 */

/**
 * @typedef {{ tag?: string; annotation: TestAnnotation | TestAnnotation[] }} TestSettings
 */

/**
 * @param {number} number
 * @returns {TestSettings}
 */
export function pr(number) {
	return {
		tag: `@pr`,
		annotation: {
			type: 'pullrequest',
			description: `https://github.com/cigaleapp/cigale/pull/${number}`
		}
	};
}

/**
 * @param {[number, ...number[]]} numbers
 * @returns	{TestSettings}
 */
export function issue(...numbers) {
	return {
		tag: '@issue',
		annotation: numbers.map((n) => ({
			type: 'issue',
			description: `https://github.com/cigaleapp/cigale/issues/${n}`
		}))
	};
}

/**
 * Sets hardware concurrency to 3 * value
 * This is because CIGALE uses (hardwareConcurrency/3) for its parallelism
 * (number of tasks in parallel in queue, and number of sw&rpc nodes)
 * @param {number} value
 * @returns {TestSettings}
 */
export function withParallelism(value) {
	return {
		annotation: {
			type: 'concurrency',
			description: (value * 3).toString()
		}
	};
}
