/**
 * @param {number} number
 */
export function pr(number) {
	return {
		annotation: {
			type: 'pullrequest',
			description: `https://github.com/cigaleapp/cigale/pull/${number}`
		}
	};
}

/**
 * @param {number} number
 */
export function issue(number) {
	return {
		annotation: {
			type: 'issue',
			description: `https://github.com/cigaleapp/cigale/issues/${number}`
		}
	};
}
