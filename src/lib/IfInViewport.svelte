<!-- 

@component Only renders its children snippet if the component (just a display:contents div wrapping the children snippet) is in the viewport
 
-->

<script lang="ts">
	import type { Snippet } from 'svelte';

	import { IsInViewport } from 'runed';

	interface Props {
		children: Snippet;
		/** Only run once, afterwards the content stays rendered even if the component leaves the viewport */
		once?: boolean;
	}

	const { children, once = false }: Props = $props();

	let node = $state<HTMLElement>();

	const inViewport = $derived(new IsInViewport(() => node?.parentElement, { once }));
</script>

<div class="if-in-viewport" bind:this={node}>
	{#if inViewport.current}
		{@render children()}
	{/if}
</div>

<style>
	.if-in-viewport {
		display: contents;
	}
</style>
