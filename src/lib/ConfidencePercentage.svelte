<script>
	import { tooltip } from './tooltips';

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
		use:tooltip={`Confiance: ${value * 100}%`}
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
			.padStart(2, '\u00a0')}%
	</code>
{/if}
