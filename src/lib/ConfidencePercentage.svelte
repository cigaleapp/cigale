<script lang="ts">
	import { percent } from './i18n.js';
	import { tooltip } from './tooltips.js';
	import { gradientedColor } from './utils.js';

	interface Props {
		/**  if undefined, the element shows a fallback "--%" text */
		value: number | undefined;
		/**  text to show when hovering the percentage */
		// eslint-disable-next-line no-unused-vars
		tooltip: (percent: `${number}%`) => void;
		/**  optional content to put before the percentage, useful to make it under the tooltip activation area */
		children: import('svelte').Snippet;
		/**  if true, the "--%" fallback will not be shown when value is undefined, and the tooltip will not be activated. Useful when you want to show confidence without drawing attention to the fact that it's missing. */
		'no-fallback': boolean;
		/**  don't pad the number. Can take up less space, but may result in misalignment */
		compact: boolean;
		/** Show 100% when its 100% */
		'show-hundred': boolean;
	}

	// False positive for no-fallback and show-hundred
	// eslint-disable-next-line svelte/no-unused-props
	const {
		value,
		children,
		compact,
		tooltip: help = (percentage) => `Confiance: ${percentage}`,
		'no-fallback': noFallback = false,
		'show-hundred': showHundred = false,
	}: Props = $props();

	const color = $derived(
		value ? gradientedColor(value, 'fg-error', 'fg-warning', 'fg-neutral', 'fg-success') : ''
	);

	const decimals = $derived(value && Number((value * 100).toFixed(1)) < 1 ? 1 : 0);
</script>

{#if value && (showHundred || (value > 0 && value < 1))}
	<span class="confidence" use:tooltip={help(percent(value, 4))}>
		{@render children?.()}
		<code class="figure" style:color>
			{percent(value, decimals, { pad: compact ? 'none' : 'nbsp', length: 4 })}
		</code>
	</span>
{:else if !noFallback}
	<span class="confidence empty">
		{@render children?.()}
		<code class="figure">
			{#if compact}
				--%
			{:else}
				&nbsp;--%
			{/if}
		</code>
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
