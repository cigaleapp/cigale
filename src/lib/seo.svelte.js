/**
 *
 * @param {object} options
 * @param {string} options.title
 */
export function seo({ title }) {
	effectIfNeeded(() => {
		document.title = title
			? /* @wc-include */ `${title} · C.I.G.A.L.E.`
			: /* @wc-include */ 'C.I.G.A.L.E.';
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
