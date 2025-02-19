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
		padding: 0.5em 0.75em;
		border-radius: var(--corner-radius);
		text-transform: uppercase;
		font-weight: bold;
		letter-spacing: 0.05em;
                cursor: pointer;
	}

	button:is(:hover, :focus-visible) {
		background-color: var(--bg-primary-translucent);
	}
</style>
