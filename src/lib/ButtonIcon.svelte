<script>
	import { tooltip } from './tooltips.js';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {(e: MouseEvent) => void} onclick
	 * @property {import('svelte').Snippet} children
	 * @property {boolean} [submits] whether this button submits a form
	 * @property {string} help
	 * @property {string} [keyboard] keyboard shortcut hint to display in the help tooltip
	 * @property {boolean} [disabled]
	 * @property {boolean} [crossout] draw a diagonal line through the button's content
	 * @property {boolean} [dangerous] style the button to indicate a dangerous action
	 * @property {() => void} [preload] function to call on mouseover, useful for preloading the next page in a navigation button for instance
	 * @property {Partial<import('$lib/tooltips.js').TooltipParameters>} [tooltipParams] additional params for the tooltip
	 */

	/** @type {Props & Record<string, unknown>} */
	let {
		children,
		onclick,
		help,
		keyboard,
		disabled,
		crossout,
		preload,
		dangerous,
		submits,
		tooltipParams = {},
		...rest
	} = $props();
</script>

<button
	{disabled}
	{onclick}
	onmouseenter={() => preload?.()}
	class:crossout
	class:dangerous
	use:tooltip={{ text: help, keyboard, ...tooltipParams }}
	aria-label={help}
	type={submits ? 'submit' : 'button'}
	{...rest}
>
	{@render children()}
</button>

<style>
	button {
		cursor: pointer;
		background-color: var(--bg, transparent);
		color: var(--fg, var(--fg-primary));
		display: inline-flex;
		justify-content: center;
		align-items: center;
		border: 1px solid var(--gray);
		padding: 0.5em;
		border-radius: var(--corner-radius);
		font-weight: bold;
		font-size: var(--font-size, 1em);
		border: none;
		position: relative;

		&.dangerous {
			color: var(--fg-error);
		}
	}

	button:is(:hover, :focus-visible) {
		background-color: var(--hover-bg, var(--bg-primary-translucent));
		color: var(--hover-fg, var(--fg-neutral));
	}

	button.dangerous:is(:hover, :focus-visible) {
		background-color: var(--bg-error);
		color: var(--fg-neutral);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	button.crossout::after {
		content: '';
		position: absolute;
		width: 75%;
		height: 1px;
		background-color: var(--fg, var(--fg-primary));
		transform: rotate(-45deg);
	}
</style>
