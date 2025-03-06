<script>
	/**
	 * @type {{value: number}}
	 */
	let { value } = $props();
</script>

<div class="radial-indicator" style:--progress="{value * 100}%">
	{Math.round(value * 100)}
</div>

<style>
	.radial-indicator {
		width: 2.5em;
		height: 2.5em;
		background: conic-gradient(
			from 0deg at 50% 50%,
			var(--bg-primary) var(--progress),
			var(--bg-neutral) var(--progress)
		);
		border-radius: 50%;
		color: var(--fg-primary);
		text-align: center;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
