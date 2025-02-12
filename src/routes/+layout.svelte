<script>
	import './style.css';
	const { children } = $props();
</script>

{@render children?.()}

<style>
	:root {
		--corner-radius: 7px;
		--border-thickness: 1px;
	}
</style>
