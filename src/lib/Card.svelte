<!-- 
@component
A simple card. If onclick is set, the card's shadow will change on hover and focus.

Available CSS variables:

- `--card-height`: The height of the card. Default: `auto`.
- `--card-bg`: The background color of the card. Default: `var(--bg-neutral)`.
- `--card-border`: The border color of the card. Default: `transparent`.
- `--card-padding`: The padding of the card. Default: `0.5em`.
 
-->

<script>
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { tooltip } from './tooltips.js';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {import('svelte').Snippet} [children]
	 * @property {(e: MouseEvent) => void} [onclick]
	 * @property {() => void} [ondoubleclick]
	 * @property {'article' | 'li' | 'div'} [tag=article] - HTML tag to use for the card container
	 * @property {string} [tooltip] - Tooltip text to show on hover (only if clickable)
	 * @property {string} [testid]
	 * @property {boolean | string} [loading=false] - Whether to show a loading state while onclick is being processed, if string, show it instead of the default loading text
	 */

	/** @type {Props}*/
	const {
		children = undefined,
		onclick,
		ondoubleclick,
		tag = 'article',
		tooltip: tooltipText,
		testid,
		loading: showLoading = false
	} = $props();

	let loading = $state(false);
	const clickable = $derived(Boolean(onclick));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
	this={tag}
	class:clickable
	data-testid={testid}
	use:tooltip={clickable && tooltipText ? tooltipText : undefined}
	class="card"
	ondblclick={ondoubleclick}
	onclick={async (e) => {
		try {
			loading = true;
			await onclick?.(e);
		} finally {
			loading = false;
		}
	}}
	aria-busy={loading}
	tabindex={clickable ? 0 : undefined}
>
	{#if showLoading && loading}
		<div class="loading-overlay">
			<LoadingSpinner />
			{typeof showLoading == 'string' ? showLoading : 'Chargement…'}
		</div>
	{/if}
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

	.card {
		position: relative;

		.loading-overlay {
			z-index: 10;
			position: absolute;
			inset: 0;
			background-color: color-mix(in srgb, var(--bg-neutral) 80%, transparent);
			height: 100%;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			font-size: 1.25em;
			gap: 0.5em;

			/* Spinner */
			--size: 2em;
		}
	}
</style>
