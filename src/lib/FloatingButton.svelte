<script>
	let { children, onclick } = $props();
</script>

<button {onclick}>
	{@render children()}
</button>

<style>
	button {
		cursor: pointer;
		background-color: var(--bg-primary);
		color: var(--fg-primary);
		display: flex;
		justify-content: center;
		align-items: center;
		border: none;
		padding: 1.25em 1.75em;
		border-radius: 30000000px;
		font-weight: bold;
	}

	button:is(:hover, :focus-visible) {
		background-color: var(--bg-dark-primary);
		color: var(--fg-dark-primary);
	}
</style>
