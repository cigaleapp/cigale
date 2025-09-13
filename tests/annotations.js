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
 * @param {number} number
 * @param {...number} otherNumbers
 * @returns	{TestSettings}
 */
export function issue(number, ...otherNumbers) {
	return {
		tag: '@issue',
		annotation: [number, ...otherNumbers].map((n) => ({
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

/**
 * @param {...TestSettings} values
 * @returns {TestSettings}
 */
export function annotations(...values) {
	return {
		tag: values
			.map((v) => v.tag)
			.filter(Boolean)
			.join(' '),
		annotation: values.flatMap((v) => v.annotation)
	};
}
