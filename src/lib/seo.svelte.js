import { uiState } from './uistate.svelte.js';

/**
 *
 * @param {object} options
 * @param {string} options.title
 */
export function seo({ title }) {
	effectIfNeeded(() => {
		const suffix = uiState.currentSession?.name ?? 'C.I.G.A.L.E.';

		document.title = title
			? /* @wc-include */ `${title} · ${suffix}`
			: /* @wc-include */ suffix;
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
