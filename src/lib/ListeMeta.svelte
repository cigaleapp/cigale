<script>
	let { children } = $props();
</script>

<div class="liste">
	{@render children()}
</div>

<style>
	.liste {
		gap: 0.5em;
		display: flex;
	}
</style>
