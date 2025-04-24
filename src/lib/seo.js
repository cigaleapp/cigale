import { onMount } from 'svelte';

/**
 *
 * @param {string} title
 */
export function setTabTitle(title) {
	onMount(() => {
		document.title = title ? `${title} · Cigale` : 'Cigale';
	});
}
