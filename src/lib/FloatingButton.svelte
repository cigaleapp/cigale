<script lang="ts">
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
		padding: 0.75em 1.25em;
		font-size: 1.15em;
		border-radius: 30000000px;
		font-weight: 1000;
		letter-spacing: 0.025em;
	}

	button:is(:hover, :focus-visible) {
		background-color: var(--bg-dark-primary);
		color: var(--fg-dark-primary);
	}
</style>
