<script>
	/**
	 * @typedef {object} Props
	 * @property {number} value
	 */

	/** @type {Props} */
	const { value } = $props();
</script>

{#if value && value > 0 && value < 1}
	<code
		class="confidence"
		style:color="var(--fg-{value < 0.25
			? 'error'
			: value < 0.5
				? 'warning'
				: value < 0.95
					? 'neutral'
					: 'success'})"
	>
		{Math.round(value * 100)
			.toString()
			.padStart(3, '\u00a0')}%
	</code>
{/if}
