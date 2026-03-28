<!-- 

@component Only renders its children snippet if the component (just a display:contents div wrapping the children snippet) is in the viewport
 
-->

<script lang="ts">
	import type { Snippet } from 'svelte';

	import { IsInViewport } from 'runed';

	interface Props {
		children: Snippet;
		/** Only run once, afterwards the content stays rendered even if the component leaves the viewport */
		once: boolean;
	}

	const { children, once }: Props = $props();

	let node = $state<HTMLElement>();

	/** Closest parent of `node` up the DOM tree that is scrollable */
	const scrollableParent = $derived.by(() => {
		let parent = node;
		if (!parent) return;
		while (parent.scrollHeight <= parent.clientHeight) {
			if (!parent.parentElement) return parent;
			parent = parent.parentElement;
		}
		return parent;
	});

	const inViewport = $derived(
		new IsInViewport(() => node, { once, root: scrollableParent})
	);

	$inspect({node, scrollableParent, inViewport})

	$effect(() => {
		console.log(
			'IfInViewport',
			node?.parentElement?.parentElement?.parentElement,
			inViewport.current ? 'visible' : 'hidden',
			'in',
			scrollableParent
		);
	});
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
