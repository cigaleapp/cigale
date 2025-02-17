<script>
	let { children, onclick } = $props();
</script>

<button {onclick}>
	{@render children()}
</button>

<style>
	button {
		background-color: var(--bg-neutral);
		color: var(--bg-primary);
		display: flex;
		justify-content: center;
		align-items: center;
		border: none;
		--height: 1em;
		--padding: 0.5em;
		padding: var(--padding);
		height: calc(var(--height) +2 * var(--padding));
		border-radius: var(--corner-radius);
		text-transform: uppercase;
		font-weight: bold;
		letter-spacing: 0.05em;
	}

	button:is(:hover, :focus-visible) {
		background-color: var(--bg-primary-translucent);
	}
</style>
