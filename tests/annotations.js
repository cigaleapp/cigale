/**
 * @param {number} number
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
