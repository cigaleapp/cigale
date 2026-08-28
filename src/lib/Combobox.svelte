<script lang="ts" module>
	export type Item = {
		key: string;
		label: string;
		icon?: string | undefined;
		color?: string | undefined;
		thumbnail?: string | undefined;
		/** If a string, shows the reason why it was disabled */
		disabled?: boolean | string | undefined;
		confidence?: number | undefined;
	};

	export type Props<I extends Item, V extends Item['key']> = {
		preloadedItems?: I[] | undefined;
		/** When empty, show these suggestions. Yield keys */
		suggestions?: () => AsyncIterable<string>;
		/** When not set, will search through preloadedItems. */
		// eslint-disable-next-line no-unused-vars
		loadItem?: (key: string) => Promise<I | undefined>;
		value: V | undefined;
		/** Used when multiple=true. **NOT BINDABLE** (at least for now) */
		values?: V[];
		multiple?: boolean;
		// eslint-disable-next-line no-unused-vars
		onValueChange?: (newValue: V, newValues: V[]) => Promise<void>;
		// eslint-disable-next-line no-unused-vars
		searcher?: (search: string) => AsyncIterable<I>;
		// eslint-disable-next-line no-unused-vars
		sorter?: (a: I, b: I) => number;
		'viewport-testid'?: PlaywrightTestId;
		itemExtraContent?: Snippet<[NoInfer<I>, { selected: boolean }]> | undefined;
		id?: string;
		// eslint-disable-next-line no-unused-vars
		focuser?: (action: 'focus' | 'blur' | 'toggle') => void;
		// highlight: Snippet<[I, I[]]>;
		details: Snippet<
			[
				NoInfer<I>,
				{
					allItems: NoInfer<I>[];
					// eslint-disable-next-line no-unused-vars
					select: (newItem: NoInfer<I>) => void;
					// eslint-disable-next-line no-unused-vars
					deselect: (item : NoInfer<V>) => void;
					expanded: boolean;
					// eslint-disable-next-line no-unused-vars
					expand: (expanded: boolean) => void;
				},
			]
		>;
		open?: boolean;
	};

	export type SubcomponentProps<I extends Item, V extends I['key']> = Omit<
		Props<I, V>,
		'preloadedItems' | 'loadItem' | 'suggestions' | 'value' | 'values'
	> & {
		loadingItems: boolean;
		loadItemsError: string;
		searcherError: string;
		itemsByKey: Map<I['key'], I>;
		usingPreloadedItems: boolean;
		suggestions: I[];
		initially: I[];
	};
</script>

<script lang="ts" generics="I extends Item, V extends I['key']">
	import type { PlaywrightTestId } from '$e2e/testids.js';
	import type { Snippet } from 'svelte';

	import { watch } from 'runed';
	import { SvelteMap } from 'svelte/reactivity';

	import { errorMessage } from '$lib/i18n.js';
	import { IsMobile } from '$lib/mobile.svelte.js';
	import { nonnull } from '$lib/utils.js';

	import ComboboxDesktop from './ComboboxDesktop.svelte';
	import ComboboxMobile from './ComboboxMobile.svelte';

	let {
		focuser = $bindable(),
		preloadedItems = [],
		searcher,
		loadItem,
		suggestions: suggest,
		value,
		values,
		...rest
	}: Props<I, V> = $props();

	// Perf hit if too much
	const usingPreloadedItems = $derived(preloadedItems.length <= 100);

	const mobile = new IsMobile();

	let suggestions = $state<I[]>([]);
	const itemsByKey = new SvelteMap<string, I>();
	let loadingItems = $state(true);
	let loadItemsError = $state('');

	watch([() => usingPreloadedItems, () => preloadedItems, () => value, () => suggest], () => {
		(async () => {
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const seen = new Set<string>();
			suggestions = [];

			if (usingPreloadedItems) {
				for (const opt of preloadedItems) {
					if (seen.has(opt.key)) continue;
					seen.add(opt.key);
					itemsByKey.set(opt.key, opt);
					suggestions.push(opt);
				}
			}

			if (value && !seen.has(value)) {
				// If loadItem is not set, we have to search through preloadedItems.
				// However, we already processed them just before, so it's either in preloadedItems and seen.has(value) (so we dont enter this block) or it's not there (so undefined is appropriate)
				const item = await loadItem?.(value);

				if (item) {
					itemsByKey.set(value, item);
					seen.add(value);
					suggestions.push(item);
				}
			}

			if (suggest) {
				for await (const key of suggest()) {
					if (seen.has(key)) continue;
					// Same reasoning here, it should've been already there if it was in preloadedItems
					const item = await loadItem?.(key);

					if (item) {
						itemsByKey.set(key, item);
						seen.add(key);
						suggestions.push(item);
					}
				}
			}
		})()
			.catch((error) => {
				loadItemsError = errorMessage(
					error,
					'Impossible de récupérer les options sélectionnées'
				);
			})
			.finally(() => {
				loadingItems = false;
			});
	});

	const selected = $derived((rest.multiple ? (values ?? []) : [value]).filter(nonnull));

	const initially = $derived(selected.map((key) => itemsByKey.get(key)).filter(nonnull));
</script>

{#if mobile.current}
	<ComboboxMobile
		bind:focuser
		{itemsByKey}
		{initially}
		{loadingItems}
		searcherError=""
		{searcher}
		{loadItemsError}
		{suggestions}
		{usingPreloadedItems}
		{...rest}
	/>
{:else}
	<ComboboxDesktop
		bind:focuser
		{itemsByKey}
		{initially}
		{loadingItems}
		searcherError=""
		{searcher}
		{loadItemsError}
		{suggestions}
		{usingPreloadedItems}
		{...rest}
	/>
{/if}
