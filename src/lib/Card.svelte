<!-- 
@component
A simple card. If onclick is set, the card's shadow will change on hover and focus.

Available CSS variables:

- `--card-height`: The height of the card. Default: `auto`.
- `--card-bg`: The background color of the card. Default: `var(--bg-neutral)`.
- `--card-border`: The border color of the card. Default: `transparent`.
- `--card-padding`: The padding of the card. Default: `0.5em`.
 
-->

<script lang="ts" module>
	/**
	 * Allows updating some data of the component while loading
	 * Useful for long-running onclick callbacks
	 */
	// eslint-disable-next-line no-unused-vars
	export type Mutator = (data: {
		/** Update the loading state or text */
		loading?: boolean | string;
	}) => void;
</script>

<script lang="ts">
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { tooltip } from './tooltips.js';

	interface Props {
		children?: import('svelte').Snippet;
		// eslint-disable-next-line no-unused-vars
		onclick?: (e: MouseEvent, mutator: Mutator) => void | Promise<void>;
		ondoubleclick?: () => void;
		tag?: 'article' | 'li' | 'div';
		tooltip?: string;
		testid?: string;
		loading?: boolean | string;
		alwaysLoading?: boolean;
	}

	const {
		children = undefined,
		onclick,
		ondoubleclick,
		tag = 'article',
		tooltip: tooltipText,
		testid,
		loading: showLoading = false,
		alwaysLoading,
	}: Props = $props();

	let _showLoading = $derived(showLoading);

	let loading = $derived(alwaysLoading || false);
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
	onclick={async (e: MouseEvent) => {
		try {
			loading = true;
			await onclick?.(e, (changes) => {
				if ('loading' in changes) _showLoading = changes.loading;
			});
		} finally {
			loading = false;
		}
	}}
	aria-busy={loading}
	tabindex={clickable ? 0 : undefined}
>
	{#if _showLoading && loading}
		<div class="loading-overlay">
			<LoadingSpinner />
			{typeof _showLoading == 'string' ? _showLoading : 'Chargement…'}
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
