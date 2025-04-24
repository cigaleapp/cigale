/**
 *
 * @param {object} options
 * @param {string} options.title
 */
export function seo({ title }) {
	if ($effect.tracking()) {
		document.title = title ? `${title} · Cigale` : 'Cigale';
		return;
	}

	$effect(() => {
		document.title = title ? `${title} · Cigale` : 'Cigale';
	});
}
