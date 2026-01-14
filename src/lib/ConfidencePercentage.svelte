<script>
	import { percent } from './i18n.js';
	import { tooltip } from './tooltips.js';
	import { gradientedColor } from './utils.js';

	/**
	 * @typedef {object} Props
	 * @property {number|undefined} value if undefined, the element shows a fallback "--%" text
	 * @property {(percent: `${number}%`) => string} [tooltip] - text to show when hovering the percentage
	 * @property {import('svelte').Snippet} [children] optional content to put before the percentage, useful to make it under the tooltip activation area
	 * @property {boolean} [compact] if true, the percentage is guaranteed to never change width (by omitting "0" in "0.n%" representations)
	 */

	/** @type {Props} */
	const {
		value,
		children,
		tooltip: help = (percentage) => `Confiance: ${percentage}`,
		compact
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
			{percent(value, decimals, { pad: 'nbsp', trimZero: compact })}
		</code>
	</span>
{:else}
	<span class="confidence empty">
		{@render children?.()}
		<code class="figure">--%</code>
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
