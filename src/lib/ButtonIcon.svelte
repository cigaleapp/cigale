<script>
	/**
	 * @typedef Props
	 * @type {object}
	 * @property {() => void} onclick
	 * @property {import('svelte').Snippet} children
	 */

	/** @type {Props} */
	let { children, onclick } = $props();
</script>

<button {onclick}>
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
</style>
