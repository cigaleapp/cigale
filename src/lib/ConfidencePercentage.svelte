<script>
	import { tooltip } from './tooltips';

	/**
	 * @typedef {object} Props
	 * @property {number} value
	 * @property {import('svelte').Snippet} [children] optional content to put before the percentage, useful to make it under the tooltip activation area
	 */

	/** @type {Props} */
	const { value, children } = $props();
</script>

{#if value && value > 0 && value < 1}
	<span class="confidence" use:tooltip={`Confiance: ${value * 100}%`}>
		{@render children?.()}
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
				.padStart(2, '\u00a0')}%
		</code>
	</span>
{/if}

<style>
	span {
		display: inline-flex;
		align-items: center;
	}
</style>
