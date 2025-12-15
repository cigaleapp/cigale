<script lang="ts">
	import { percent } from './i18n.js';
	import { tooltip } from './tooltips.js';
	import { gradientedColor } from './utils.js';

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
		tooltip: help = (percentage) => `Confiance: ${percentage}`
	} = $props();

	const color = $derived(
		gradientedColor(value, 'fg-error', 'fg-warning', 'fg-neutral', 'fg-success')
	);
</script>

{#if value && value > 0 && value < 1}
	<span class="confidence" use:tooltip={help(percent(value, 4))}>
		{@render children?.()}
		<code class="confidence" style:color>
			{percent(value, value < 0.01 ? 1 : 0, { pad: 'nbsp' })}
		</code>
	</span>
{/if}

<style>
	span {
		display: inline-flex;
		align-items: center;
	}
</style>
