<script lang="ts" generics="Item">
	import type { Snippet } from 'svelte';

	// @ts-expect-error - upstream package does not ship TypeScript declarations
	import VirtualList from '@sveltejs/svelte-virtual-list';
	import { fade } from 'svelte/transition';

	import Logo from './Logo.svelte';
	import { scrollController } from './scrollcontroller.svelte.js';

	interface Props {
		items: Item[];
		item: Snippet<[item: Item, index: number]>;
		/** If given a string, shows a centered empty-variant Logo and the given string */
		empty?: string | Snippet;
		scroll?: { y: number };
	}

	let { items, item: itemSnippet, empty, scroll = $bindable({ y: 0 }) }: Props = $props();
</script>

{#if items.length === 0 && empty}
	<div class="empty" in:fade={{ duration: 200 }}>
		{#if typeof empty === 'string'}
			<Logo variant="empty" />
			<p>{empty}</p>
		{:else if empty}
			{@render empty()}
		{/if}
	</div>
{:else}
	<div
		in:fade={{ duration: 200 }}
		class="virtual-list"
		{@attach (node) => {
			const scrollable = node.querySelector('svelte-virtual-list-viewport');
			if (!scrollable) return;
			return scrollController(scroll)(scrollable);
		}}
	>
		<VirtualList {items} let:item let:index>
			{@render itemSnippet(item, index)}
		</VirtualList>
	</div>
{/if}

<style>
	.virtual-list {
		height: 100%;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1rem;
		padding: 2rem;
		text-align: center;

		/* Logo size */
		--size: 5rem;
	}
</style>
