<script>
	import { percent } from './i18n.js';
	import { tooltip } from './tooltips.js';
	import { gradientedColor } from './utils.js';

	/**
	 * @typedef {object} Props
	 * @property {number|undefined} value if undefined, the element shows a fallback "--%" text
	 * @property {(percent: `${number}%`) => string} [tooltip] - text to show when hovering the percentage
	 * @property {import('svelte').Snippet} [children] optional content to put before the percentage, useful to make it under the tooltip activation area
	 * @property {boolean} [no-fallback] if true, the "--%" fallback will not be shown when value is undefined, and the tooltip will not be activated. Useful when you want to show confidence without drawing attention to the fact that it's missing.
	 */

	/** @type {Props} */
	const {
		value,
		children,
		tooltip: help = (percentage) => `Confiance: ${percentage}`,
		'no-fallback': noFallback = false
	} = $props();

	const color = $derived(
		value ? gradientedColor(value, 'fg-error', 'fg-warning', 'fg-neutral', 'fg-success') : ''
	);

	const decimals = $derived(value && Number((value * 100).toFixed(1)) < 1 ? 1 : 0);
</script>

{#if value && value > 0 && value < 1}
	<span class="confidence" use:tooltip={help(percent(value, 4))}>
		{@render children?.()}
		<code class="figure" style:color>
			{percent(value, decimals, { pad: 'nbsp', length: 4 })}
		</code>
	</span>
{:else if !noFallback}
	<span class="confidence empty">
		{@render children?.()}
		<code class="figure">&nbsp;--%</code>
	</span>
{/if}

<style>
	span {
		display: inline-flex;
		align-items: center;
	}

	code {
		white-space: pre;
	}
</style>
