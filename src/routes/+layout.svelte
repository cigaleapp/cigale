<script>
	import { base } from '$app/paths';
	import './style.css';
	
	const { children } = $props();
</script>

<svelte:head>
	<base href={base} />
</svelte:head>

{@render children?.()}

<style>
	:root {
		--corner-radius: 7px;
		--border-thickness: 1px;
	}
</style>
