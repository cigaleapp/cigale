<script>
	import { tooltip } from './tooltips';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {import('svelte').Snippet} children
	 * @property {(e: MouseEvent) => void} onclick
	 * @property {string} [help]
	 */

	/** @type {Props} */
	let { children, onclick, help } = $props();
</script>

<button {onclick} use:tooltip={help}>
	{@render children()}
</button>

<style>
	button {
		background-color: var(--bg, var(--bg-neutral));
		color: var(--fg, var(--fg-primary));
		display: flex;
		gap: 0.5em;
		justify-content: center;
		align-items: center;
		border: none;
		padding: 0.5em 0.75em;
		border-radius: var(--corner-radius);
		text-transform: uppercase;
		font-weight: bold;
		letter-spacing: 0.05em;
		cursor: pointer;
	}

	button:is(:hover, :focus-visible) {
		background-color: var(--bg-hover, var(--bg-primary-translucent));
	}
</style>
