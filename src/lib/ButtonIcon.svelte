<script>
	import { tooltip } from './tooltips';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {() => void} onclick
	 * @property {import('svelte').Snippet} children
	 * @property {string} help
	 * @property {boolean} [disabled]
	 */

	/** @type {Props} */
	let { children, onclick, help, disabled } = $props();
</script>

<button {disabled} {onclick} use:tooltip={help}>
	{@render children()}
</button>

<style>
	button {
		cursor: pointer;
		background-color: var(--bg-primary-translucent);
		color: var(--fg-primary);
		display: inline-flex;
		justify-content: center;
		align-items: center;
		border: 1px solid var(--gray);
		padding: 0.75em;
		border-radius: var(--corner-radius);
		font-weight: bold;
		font-size: var(--font-size, 1em);
		border: none;
		height: 40px;
		width: 40px;
	}

	button:is(:hover, :focus-visible) {
		background-color: var(--bg-neutral);
		color: var(--fg-neutral);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
