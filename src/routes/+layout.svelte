<script>
	import './style.css';

	const { children } = $props();
</script>

{@render children?.()}

<style>
	:global(body) {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	:global(*) {
		font-family: 'Host Grotesk', sans-serif;
	}

	:global(code, pre) {
		font-family: 'Fira Code', monospace;
	}
</style>
