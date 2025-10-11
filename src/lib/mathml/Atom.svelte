<script>
	/**
	 * @typedef {object} Props
	 * @property {string} expr
	 */

	/** @type {Props} */
	const { expr } = $props();
</script>

{#if /^\d+$/.test(expr)}
	<mn>{expr}</mn>
{:else}
	<mi>{expr}</mi>
{/if}
