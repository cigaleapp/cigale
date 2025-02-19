<script>
	let { children } = $props();
</script>

<button>
	{@render children()}
</button>

<style>
	button {
		cursor: pointer;
		background-color: var(--bg-neutral);
		color: var(--fg-neutral);
		display: inline-block;
		justify-content: center;
		align-items: center;
		border: 1px solid var(--gray);
		padding: 0.75em;
		border-radius: var(--corner-radius);
		font-weight: bold;
		font-size: var(--font-size, 1em);
	}

	button:is(:hover, :focus-visible) {
		background-color: var(--bg-primary-translucent);
		color: var(--fg-primary);
		border-color: var(--bg-primary);
	}
</style>
