<script>
	let { children, onclick } = $props();
</script>

<button {onclick}>
	{@render children()}
</button>

<style>
	button {
		cursor: pointer;
		background-color: var(--bg-neutral);
		color: var(--fg-neutral);
		display: flex;
		justify-content: center;
		align-items: center;
		border: 1px solid var(--gray);
		padding: 0.75em;
		border-radius: var(--corner-radius);
		width: var(--width, 7.5em);
		font-weight: bold;
		font-size: var(--font-size, 1em);
	}

	button:is(:hover, :focus-visible) {
		background-color: var(--bg-primary-translucent);
		color: var(--fg-primary);
		border-color: var(--bg-primary);
	}
</style>
