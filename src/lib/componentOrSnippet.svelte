<script module>
	export { componentOrSnippet };
</script>

<script lang="ts">
	import type { Component, Snippet } from 'svelte';
</script>

{#snippet componentOrSnippet(component: Component | undefined, snippet: Snippet | undefined)}
	{#if component}
		<svelte:component this={component} />
	{:else if snippet}
		{@render snippet()}
	{/if}
{/snippet}
