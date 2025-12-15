<script lang="ts">
	import { tooltip } from '$lib/tooltips';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {string} text  the text to display in the tooltip
	 * @property {string} [keyboard] the keyboard shortcut to display in the tooltip
	 * @property {number} [delay] the delay before the tooltip appears after starting to hover on the element
	 * @property {import('svelte').Snippet} children
	 */

	/** @type {Props} */
	const { text = '', keyboard = '', delay, children } = $props();
</script>

<span use:tooltip={keyboard ? { text, keyboard, delay } : delay ? [text, delay] : text}>
	{@render children?.()}
</span>

<style>
	span {
		display: inline-block;
	}
</style>
