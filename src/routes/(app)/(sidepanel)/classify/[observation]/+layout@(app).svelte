<script lang="ts">
	import { navbarAppearance } from '$routes/(app)/+layout.svelte';

	navbarAppearance('hidden');

	const { children } = $props();
</script>

{@render children()}
