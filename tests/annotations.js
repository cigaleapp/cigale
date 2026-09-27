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
			description: `https://github.com/cigaleapp/cigale/pull/${number}`,
		},
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
			description: `https://github.com/cigaleapp/cigale/issues/${n}`,
		})),
	};
}

/**
 * @param {TestSettings["annotation"]} annotations
 */
export function parseNavigatorDefineAnnotations(annotations) {
	return Object.fromEntries(
		(Array.isArray(annotations) ? annotations : [annotations])
			.filter((a) => a.type.startsWith('define:navigator.'))
			.map((a) => [
				a.type.replace(/^define:navigator\./, ''),
				JSON.parse(a.description ?? 'null'),
			])
	);
}

/**
 *
 * @param {Record<string, unknown>} values
 * @returns {TestSettings}
 */
function withNavigatorProperties(values) {
	return {
		annotation: Object.entries(values).flatMap(([key, value]) => {
			if (value === undefined) return [];

			return [
				{
					type: /**@type {const} */ (`define:navigator.${key}`),
					description: JSON.stringify(value),
				},
			];
		}),
	};
}

/**
 * Sets hardware specifications
 * @param {object} values
 * @param {number} [values.threads] sets hardwareConcurrency
 * @param {`${number} GB`} [values.ram] sets deviceMemory
 * @returns {TestSettings}
 */
export function withHardware(values) {
	return withNavigatorProperties({
		hardwareConcurrency: values.threads,
		deviceMemory: values.ram ? Number.parseFloat(values.ram) : undefined,
	});
}

/**
 * Sets hardware concurrency to 3 * value
 * This is because CIGALE uses (hardwareConcurrency/3) for its parallelism
 * (number of tasks in parallel in queue, and number of sw&rpc nodes)
 * @param {number} value
 */
export function withParallelism(value) {
	return withHardware({ threads: 3 * value });
}
