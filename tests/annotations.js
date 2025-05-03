/**
 * @param {number} number
 */
export function pr(number) {
	return {
		tag: `@issue-${number}`,
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
		tag: `@pr-${number}`,
		annotation: {
			type: 'issue',
			description: `https://github.com/cigaleapp/cigale/issues/${number}`
		}
	};
}
