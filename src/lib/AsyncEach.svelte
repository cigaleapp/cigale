<!-- 

@component Like an {#each} block, but it works with AsyncIterables instead.

New data is appended to the DOM when received, until exhaustion of the iterable.

When the component is destroyed and the iteration is still ongoing, it gets canceled.

If you have a changing items iterator, please use a {#key} block around to ensure cancelation works properly:

```svelte
{#key items}
	<AsyncEach {items} key={...}>
		...
	</AsyncEach>
{/key}
```

 
-->

<script lang="ts" module>
	export const IterationTotalSignal = type({
		total: 'number',
		'+': 'reject',
	});
</script>

<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	import { type } from 'arktype';
	import { onDestroy } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	import { clamp } from './utils.js';

	interface Props {
		/** Yield a {total: number} object to signal the number of total items. This causes AsyncEach to add (total - loaded.length) ghost items (if the ghost snippet is defined) at the end of the DOM */
		items: () => AsyncIterable<T | (typeof IterationTotalSignal)['infer']>;
		key: (item: T, index: number) => string | number;
		/**
		 * Cache the results if the AsyncEach component ever gets recreated with the same key
		 * The cache only gets filled when the iteration finishes
		 */
		cache?: undefined | { key: string; entries: Map<string, T[]> };
		children: Snippet<[T, number]>;
		/** Additional item while we are still loading but one item has loaded already */
		ghost?: Snippet;
		/** When no items have loaded yet */
		loading?: Snippet;
		/** When the iteration is finished but there's still no items */
		empty?: Snippet;
		/** When an error occurs */
		error?: Snippet<[unknown]>;
		/** Callback when the iteration finished */
		onloaded?: (items: T[]) => Promise<void> | void;
	}

	const { items, key, children, cache, onloaded, ...snippets }: Props = $props();

	const abortion = new AbortController();

	let total = $state(0);
	let loading = $state(true);
	let loaded: T[] = $state([]);
	const loadedKeys = new SvelteSet<string | number>();
	let error: unknown = $state();

	const ghostsCount = $derived.by(() => {
		if (!loading) return 0;
		if (total > 0) return clamp(0, total - loaded.length, Infinity);
		if (loaded.length > 0) return 1;
		return 0;
	});

	// When component is removed, cancel all
	onDestroy(() => {
		// pro-choice ftw
		abortion.abort(true);
	});

	$effect(() => {
		void (async () => {
			loaded = [];
			loading = true;
			try {
				if (cache && cache.entries.has(cache.key)) {
					loaded = cache.entries.get(cache.key)!;
				} else {
					let i = 0;
					for await (const item of items()) {
						if (abortion.signal.aborted) {
							break;
						}

						if (IterationTotalSignal.allows(item)) {
							total = item.total;
						} else if (!loadedKeys.has(key(item, i))) {
							loaded.push(item);
							loadedKeys.add(key(item, i));
						}

						i++
					}

					if (cache) {
						cache.entries.set(cache.key, loaded);
					}
				}

				error = undefined;

				await onloaded?.(loaded);
			} catch (err) {
				// TODO detect when it's a abortsignal error
				error = err;
			} finally {
				loading = false;
			}
		})();
	});
</script>

{#if error}
	{@render snippets.error?.(error)}
{:else}
	{#each loaded as item, i (key(item, i))}
		{@render children(item, i)}
	{:else}
		{#if loading && !ghostsCount}
			{@render snippets.loading?.()}
		{:else if !ghostsCount}
			{@render snippets.empty?.()}
		{/if}
	{/each}
	{#if ghostsCount > 0}
		{#each Array.from({ length: ghostsCount }) as _}
			{@render snippets.ghost?.()}
		{/each}
	{/if}
{/if}
