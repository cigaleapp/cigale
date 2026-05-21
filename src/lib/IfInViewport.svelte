<!-- 

@component Only renders its children snippet if the component (just a display:contents div wrapping the children snippet) is in the viewport
 
-->

<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	import { IsInViewport } from 'runed';

	interface Props {
		children: Snippet<[T]>;
		/** Only run once, afterwards the content stays rendered even if the component leaves the viewport */
		once?: boolean;
		/** Computation to run when in viewport. The result is availabe as a prop to the children snippet */
		computation?: () => T | Promise<T>;
	}

	const { children, once = false, computation }: Props = $props();

	let node = $state<HTMLElement>();

	const inViewport = $derived(new IsInViewport(() => node?.parentElement, { once }));
</script>

<div class="if-in-viewport" bind:this={node}>
	{#if inViewport.current}
		{#await (async () => {
			if (!computation) return undefined;
			return await computation();
		})() then result}
			{@render children(result)}
		{/await}
	{/if}
</div>

<style>
	.if-in-viewport {
		display: contents;
	}
</style>
