<script>
	import { percent } from './i18n';
	import { m } from './paraglide/messages';
	import { tooltip } from './tooltips';

	/**
	 * @typedef {object} Props
	 * @property {number} value
	 * @property {(percent: `${number}%`) => string} [tooltip] - text to show when hovering the percentage
	 * @property {import('svelte').Snippet} [children] optional content to put before the percentage, useful to make it under the tooltip activation area
	 */

	/** @type {Props} */
	const {
		value,
		children,
		tooltip: help = (percentage) => m.confidence_percentage({ percentage })
	} = $props();
</script>

{#if value && value > 0 && value < 1}
	<span class="confidence" use:tooltip={help(percent(value, 4))}>
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
			{percent(value, 0, { pad: 'nbsp' })}
		</code>
	</span>
{/if}

<style>
	span {
		display: inline-flex;
		align-items: center;
	}
</style>
