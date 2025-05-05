<script>
	import { tooltip } from './tooltips';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {() => void} onclick
	 * @property {import('svelte').Snippet} children
	 * @property {string} help
	 * @property {string} [keyboard] keyboard shortcut hint to display in the help tooltip
	 * @property {boolean} [disabled]
	 */

	/** @type {Props & Record<string, unknown>} */
	let { children, onclick, help, keyboard, disabled, ...rest } = $props();
</script>

<button {disabled} {onclick} use:tooltip={{ text: help, keyboard }} {...rest}>
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
	}

	button:is(:hover, :focus-visible) {
		background-color: var(--hover-bg, var(--bg-primary-translucent));
		color: var(--hover-fg, var(--fg-neutral));
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
