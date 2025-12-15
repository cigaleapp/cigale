<!-- 
@component
A simple card. If onclick is set, the card's shadow will change on hover and focus.

Available CSS variables:

- `--card-height`: The height of the card. Default: `auto`.
- `--card-bg`: The background color of the card. Default: `var(--bg-neutral)`.
- `--card-border`: The border color of the card. Default: `transparent`.
- `--card-padding`: The padding of the card. Default: `0.5em`.
 
-->

<script lang="ts">
	import { tooltip } from './tooltips.js';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {import('svelte').Snippet} [children]
	 * @property {(e: MouseEvent) => void} [onclick]
	 * @property {'article' | 'li' | 'div'} [tag=article] - HTML tag to use for the card container
	 * @property {string} [tooltip] - Tooltip text to show on hover (only if clickable)
	 * @property {string} [testid]
	 */

	/** @type {Props}*/
	const {
		children = undefined,
		onclick,
		tag = 'article',
		tooltip: tooltipText,
		testid
	} = $props();

	const clickable = $derived(Boolean(onclick));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
	this={tag}
	class:clickable
	data-testid={testid}
	use:tooltip={clickable && tooltipText ? tooltipText : undefined}
	class="card"
	{onclick}
	tabindex={clickable ? 0 : undefined}
>
	{@render children?.()}
</svelte:element>

<style>
	.card {
		border-radius: var(--corner-radius);
		padding: var(--card-padding, 0.5em);
		height: var(--card-height, auto);
		width: 100%;
		background: var(--card-bg, var(--bg-neutral));
		overflow: hidden;
		border: 2px solid var(--card-border, transparent);

		--shadow-color-1: light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.7));
		--shadow-color-2: light-dark(rgba(0, 0, 0, 0.24), rgba(0, 0, 0, 1));

		/* Material design box shadow */
		/* Taken from https://codepen.io/sdthornton/pen/wBZdXq */
		box-shadow:
			0 1px 3px var(--shadow-color-1),
			0 1px 2px var(--shadow-color-2);
		transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
	}

	.card.clickable {
		cursor: pointer;
	}

	.card.clickable:is(:hover, :focus-visible) {
		border-color: var(--fg-primary);
		box-shadow:
			0 3px 6px var(--shadow-color-1),
			0 3px 6px var(--shadow-color-2);
	}
</style>
