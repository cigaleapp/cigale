<script>
	import { tooltip } from '$lib/tooltips';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {string} text  the text to display in the tooltip
	 * @property {?number} delay the delay before the tooltip appears after starting to hover on the element
	 * @property {import('svelte').Snippet} children
	 */

	/** @type {Props} */
	const { text = '', delay, children } = $props();
</script>

<div use:tooltip={delay ? [text, delay] : text}>
	{@render children?.()}
</div>
