<!-- 
 @component
 Text that can overflow, and shows ellipsis when it does so. Also shows a tooltip with the full text when it overflows.
 
  -->

<script>
	import { tooltip } from './tooltips';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {string} text
	 * @property {string} [tag] span by default
	 */

	/** @type {Props} */
	const { text, tag = 'span' } = $props();

	/** @type {HTMLElement | undefined} */
	let element = $state();
	let offsetWidth = $state(0);

	const tooltipText = $derived(element && offsetWidth < element.scrollWidth ? text : '');
</script>

<svelte:element
	this={tag}
	class="overflowable"
	use:tooltip={tooltipText}
	bind:this={element}
	bind:offsetWidth
>
	{text}
</svelte:element>

<style>
	.overflowable {
		display: inline-block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		vertical-align: middle;
		width: 100%;
	}
</style>
