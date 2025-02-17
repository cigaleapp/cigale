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
		border: 1px var(--bg-neutral) solid;
		--height: 1em;
		--padding: 0.5em;
		padding: var(--padding);
		height: calc(var(--height) +2 * var(--padding));
		border-radius: var(--corner-radius);
		text-transform: uppercase;
		font-weight: bold;
		letter-spacing: 0.05em;
	}

	button:hover {
		background-color: var(--bg-primary-translucent);
	}
</style>
