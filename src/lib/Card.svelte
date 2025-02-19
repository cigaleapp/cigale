<!-- 
@component
A simple card. If onclick is set, the card's shadow will change on hover and focus.

Available CSS variables:

- `--card-height`: The height of the card. Default: `auto`.
- `--card-bg`: The background color of the card. Default: `var(--bg-neutral)`.
- `--card-padding`: The padding of the card. Default: `0.5em`.
 
-->

<script>
	/**
	 * @typedef Props
	 * @type {object}
	 * @property {import('svelte').Snippet} [children]
	 * @property {() => void} [onclick]
	 */

	/** @type {Props}*/
	const { children = undefined, onclick } = $props();

	const clickable = $derived(Boolean(onclick));
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<article
	class="card"
	class:clickable
	{onclick}
	tabindex={clickable ? 0 : undefined}
	onkeypress={(e) => {
		if (e.key === 'Enter') {
			onclick?.();
		}
	}}
>
	{@render children?.()}
</article>

<style>
	.card {
		border-radius: var(--corner-radius);
		padding: var(--card-padding, 0.5em);
		height: var(--card-height, auto);
		width: 100%;
		background: var(--card-bg, var(--bg-neutral));
		overflow: hidden;
		border: 2px solid transparent;

		/* Material design box shadow */
		/* Taken from https://codepen.io/sdthornton/pen/wBZdXq */
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 1px 2px rgba(0, 0, 0, 0.24);
		transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
	}

	.card.clickable {
		cursor: pointer;
	}

	.card.clickable:is(:hover, :focus-visible) {
		border-color: var(--fg-primary);
		box-shadow:
			0 3px 6px rgba(0, 0, 0, 0.16),
			0 3px 6px rgba(0, 0, 0, 0.23);
	}
</style>
