<script lang="ts" generics="Item">
	import type { Snippet } from 'svelte';

	// @ts-expect-error - upstream package does not ship TypeScript declarations
	import VirtualList from '@sveltejs/svelte-virtual-list';

	import Logo from './Logo.svelte';

	interface Props {
		items: Item[];
		item: Snippet<[item: Item, index: number]>;
		/** If given a string, shows a centered empty-variant Logo and the given string */
		empty?: string | Snippet;
		scrollY?: number;
	}

	let { items, item: itemSnippet, empty, scrollY = $bindable(0) }: Props = $props();

	let scrollable = $state<HTMLElement | null>(null);

	// Prevent messing with scrollY while the user is scrolling
	let mouseWheelActive = $state(false);

	$effect(() => {
		if (!scrollable) return;
		if (scrollY === scrollable.scrollTop) return;
		if (!scrollable.scrollHeight) return;
		// TODO figure out a better way to ensure the scroll happens when the container is ready
		requestAnimationFrame(() => {
			if (!scrollable) return;
			if (mouseWheelActive) return;
			scrollable.scrollTo({
				top: scrollY,
			});
		});
	});

	$effect(() => {
		if (!scrollable) return;
		const onscroll = () => {
			if (!scrollable) return;
			scrollY = scrollable.scrollTop;
		};

		const onmousewheel = () => {
			mouseWheelActive = true;
			setTimeout(() => {
				mouseWheelActive = false;
			}, 500);
		};

		scrollable.addEventListener('scroll', onscroll);
		scrollable.addEventListener('mousewheel', onmousewheel, { passive: true });
		return () => {
			scrollable?.removeEventListener('scroll', onscroll);
			scrollable?.removeEventListener('mousewheel', onmousewheel);
		};
	});
</script>

{#if items.length === 0 && empty}
	<div class="empty">
		{#if typeof empty === 'string'}
			<Logo variant="empty" />
			<p>{empty}</p>
		{:else if empty}
			{@render empty()}
		{/if}
	</div>
{/if}

<div
	class="virtual-list"
	{@attach (node) => {
		scrollable = node.querySelector('svelte-virtual-list-viewport');
	}}
>
	<VirtualList {items} let:item let:index>
		{@render itemSnippet(item, index)}
	</VirtualList>
</div>

<style>
	.virtual-list {
		height: 100%;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		text-align: center;

		/* Logo size */
		--size: 5rem;
	}
</style>
