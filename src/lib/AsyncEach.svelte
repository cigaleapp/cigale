<!-- 

@component Like an {#each} block, but it works with AsyncIterables instead.

New data is appended to the DOM when received, until exhaustion of the iterable
 
-->

<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	interface Props {
		items: () => AsyncIterator<T>;
		key: (item: T) => string | number;
		children: Snippet<[T, number]>;
		/** Additional item while we are still loading but one item has loaded already */
		ghost?: Snippet;
		/** When no items have loaded yet */
		loading: Snippet;
		/** When the iteration is finished but there's still no items */
		empty: Snippet;
		/** When an error occurs */
		error: Snippet<[unknown]>;
	}

	const { items, key, children, ...snippets }: Props = $props();

	let loading = $state(true);
	let loaded: T[] = $state([]);
	let error: unknown = $state();

	$effect(() => {
		void (async () => {
			loaded = [];
			loading = true;
			try {
				for await (const item of items()) {
					loaded.push(item);
				}
				error = undefined;
			} catch (err) {
				error = err;
			} finally {
				loading = false;
			}
		})();
	});
</script>

{#if error}
	{@render snippets.error(error)}
{:else}
	{#each loaded as item, i (key(item))}
		{@render children(item, i)}
	{:else}
		{#if loading}
			{@render snippets.loading()}
		{:else}
			{@render snippets.empty()}
		{/if}
	{/each}
	{#if loaded.length > 0 && loading}
		{@render snippets.ghost?.()}
	{/if}
{/if}
