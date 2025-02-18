// https://github.com/PaulMaly/svelte-actions-mutation/blob/master/src/index.js

/**
 *
 * @param {HTMLElement} node
 * @param {MutationObserverInit & Partial<Record<`on${MutationRecordType}`, (m: MutationRecord) => void>>} options
 * @returns
 */
export function mutationobserver(node, options) {
	/** @type {MutationObserver|null}  */
	let observer = null;

	function update(options = {}) {
		destroy();
		observer = new MutationObserver((mutations) => {
			// @ts-ignore
			mutations.forEach((m) => options[`on${m.type}`]?.(m));
		});
		observer.observe(node, options);
	}

	function destroy() {
		observer && observer.disconnect();
		observer = null;
	}

	update(options);

	return { update, destroy };
}
