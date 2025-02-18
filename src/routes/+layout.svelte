<script>
	import { base } from '$app/paths';
	import { setContext } from 'svelte';
	import './style.css';

	const { children } = $props();

	// TODO get value from DB
	setContext('showSwitchHints', true);
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

	:global(*) {
		font-family: 'Host Grotesk', sans-serif;
	}
</style>
