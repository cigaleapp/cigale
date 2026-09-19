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
	import { watch } from 'runed';
	import { onDestroy } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	import { clamp, climbDOMUntil } from './utils.js';

	type Iteration<T> = T | (typeof IterationTotalSignal)['infer'];

	interface Props {
		/** Yield a {total: number} object to signal the number of total items. This causes AsyncEach to add (total - loaded.length) ghost items (if the ghost snippet is defined) at the end of the DOM */
		items: Array<T> | (() => AsyncIterable<Iteration<T>>);
		/** Called with last item. Add new items */
		// eslint-disable-next-line no-unused-vars
		more?: (last: T) => AsyncIterable<Iteration<T>>;
		// eslint-disable-next-line no-unused-vars
		key: (item: T, index: number) => string | number;
		/**
		 * Cache the results if the AsyncEach component ever gets recreated with the same key
		 * The cache only gets filled when the iteration finishes
		 */
		cache?: undefined | { key: string; entries: Map<[key: string, page: number], T[]> };
		/** Additional item while we are still loading but one item has loaded already */
		ghost?: Snippet;
		/** When no items have loaded yet */
		loading?: Snippet;
		/** When the iteration is finished but there's still no items */
		empty?: Snippet;
		/** When an error occurs */
		error?: Snippet<[unknown]>;
		/** Callback when the iteration finished */
		// eslint-disable-next-line no-unused-vars
		onloaded?: (items: T[]) => Promise<void> | void;
		children: Snippet<[T, number]>;
	}

	const { items, key, children, cache, onloaded, more, ...snippets }: Props = $props();

	const abortion = new AbortController();

	let total = $state(0);
	let loading = $state(true);
	let loaded: T[] = $state([]);
	const loadedKeys = new SvelteSet<string | number>();
	let error: unknown = $state();
	/** Number of times more() has been called */
	let page = $state(0);

	let pagesize = $state(0);

	/** All items have been loaded, even eventual more() calls */
	let noMoreItems = $state(false);

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

	async function loadItems(
		last: T | undefined,
		// eslint-disable-next-line no-unused-vars
		generator: T[] | ((last?: T | undefined) => AsyncIterable<Iteration<T>>)
	) {
		if (noMoreItems) return;

		const totalBefore = total;
		loading = true;

		if (Array.isArray(generator)) {
			loaded = generator;
			noMoreItems = true;
			loading = false;
			error = undefined;
			await onloaded?.(loaded);
			return;
		}

		// Estimate total before receiving the actual total
		total += pagesize;

		try {
			if (cache && cache.entries.has([cache.key, page.toString()])) {
				loaded = [...loaded, ...cache.entries.get([cache.key, page.toString()])!];
			} else {
				let i = 0;
				for await (const item of generator(last)) {
					if (abortion.signal.aborted) {
						break;
					}

					if (IterationTotalSignal.allows(item)) {
						total = totalBefore + item.total;
						if (totalBefore === 0) {
							pagesize = item.total;
						}

						if (!item.total) {
							noMoreItems = true;
						}
					} else if (!loadedKeys.has(key(item, i))) {
						loaded.push(item);
						loadedKeys.add(key(item, i));
					}

					i++;
				}

				if (i === 0) {
					noMoreItems = true;
				}

				if (cache) {
					cache.entries.set([cache.key, page.toString()], loaded);
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
	}

	// Initial loading
	watch([() => items], () => {
		total = 0;
		loaded = [];
		void loadItems(undefined, items);
	});
</script>

{#snippet content()}
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
			{#each Array.from({ length: ghostsCount }) as _, i (i)}
				{@render snippets.ghost?.()}
			{/each}
		{/if}
	{/if}
{/snippet}

{#if more}
	<div
		class="scrollspy"
		style:display="contents"
		{@attach (node) => {
			const scrollable = climbDOMUntil(node, (n) =>
				Boolean(n.dataset.scrollable || n.scrollHeight > n.clientHeight)
			);

			if (!scrollable) return;

			const listener = () => {
				const remaining =
					scrollable.scrollTop - (scrollable.scrollHeight - scrollable.clientHeight);

				if (remaining < 200) {
					if (loading) return;
					if (!loaded.length) return;
					if (error) return;
					page++;
					void loadItems(loaded.at(-1)!, more);
				}
			};

			scrollable.addEventListener('scroll', listener);
			return () => scrollable.removeEventListener('scroll', listener);
		}}
	>
		{@render content()}
	</div>
{:else}
	{@render content()}
{/if}
