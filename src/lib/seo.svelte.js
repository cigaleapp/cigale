/**
 *
 * @param {object} options
 * @param {string} options.title
 */
export function seo({ title }) {
	effectIfNeeded(() => {
		document.title = title ? `${title} · Cigale` : 'Cigale';
	});
}

/**
 *
 * @param {() => unknown} fn
 * @returns
 */
function effectIfNeeded(fn) {
	if ($effect.tracking()) {
		fn();
		return;
	}

	$effect(() => {
		fn();
	});
}
