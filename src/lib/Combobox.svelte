<script lang="ts" module>
	type Item = {
		key: string;
		label: string;
	};

	type Props<I extends Item, V extends string> = {
		items: I[];
		value: V | undefined;
		// eslint-disable-next-line no-unused-vars
		onValueChange?: (newValue: V) => void;
		// eslint-disable-next-line no-unused-vars
		searcher: (search: string, item: I) => string | undefined;
		// eslint-disable-next-line no-unused-vars
		suggestions?: (search: string) => Promise<I[]>;
		// eslint-disable-next-line no-unused-vars
		sorter?: (a: I, b: I) => number;
		'viewport-testid'?: string;
		inputProps?: WithoutChildrenOrChild<Combobox.InputProps>;
		contentProps?: WithoutChildrenOrChild<Combobox.ContentProps>;
		id?: string;
		// eslint-disable-next-line no-unused-vars
		focuser?: (action: 'focus' | 'blur' | 'toggle') => void;
		highlight: Snippet<[I, I[]]>;
		listItem: Snippet<[I & { selected: boolean; highlighted: boolean; matchedFrom: string }]>;
	};
</script>

<script lang="ts" generics="I extends Item, V extends string">
	import VirtualList from '@sveltejs/svelte-virtual-list';
	import { Combobox, mergeProps, type WithoutChildrenOrChild } from 'bits-ui';
	import { Debounced } from 'runed';
	import type { Snippet } from 'svelte';

	import Logo from './Logo.svelte';
	import { scrollfader } from './scrollfader.js';
	import { compareBy } from './utils.js';

	type MergedProps = Props<I, V> & Omit<Combobox.RootProps, keyof Props<I, V>>;

	let {
		items: staticItems,
		sorter,
		suggestions,
		searcher,
		value = $bindable(),
		open = $bindable(false),
		focuser = $bindable(),
		'viewport-testid': viewportTestId,
		inputProps,
		contentProps,
		listItem,
		highlight,
		...restProps
	}: MergedProps = $props();

	let searchValue = $state('');

	let dynamicItems: undefined | I[] = $state();
	const items = $derived(dynamicItems ?? staticItems);

	const label = $derived(items.find((i) => i.key === value)?.label ?? '');

	const debouncedSearchValue = new Debounced(() => searchValue, 300);

	$effect(() => {
		if (debouncedSearchValue.current === '' || !suggestions) {
			dynamicItems = undefined;
			return;
		}

		void suggestions(debouncedSearchValue.current)
			.then((newItems) => {
				dynamicItems = newItems;
			})
			.catch((err) => {
				console.error('Error fetching suggestions for Combobox:', err);
			});
	});

	const filteredItems = $derived.by(() => {
		if (searchValue === '') {
			return [...items.toSorted(sorter)].map((item) => ({
				...item,
				matchedFrom: item.label
			}));
		}

		return items
			.map((item) => ({
				...item,
				matchedFrom: searcher(searchValue, item)
			}))
			.filter((item) => item.matchedFrom !== undefined)
			.toSorted(compareBy(({ label, matchedFrom }) => (label === matchedFrom ? 0 : 1)));
	});

	function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
		searchValue = e.currentTarget.value;
	}

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) searchValue = '';
	}

	const mergedRootProps = $derived(mergeProps(restProps, { onOpenChange: handleOpenChange }));
	const mergedInputProps = $derived(
		mergeProps(inputProps, {
			oninput: handleInput,
			onfocus: () => (open = true),
			defaultValue: label
		})
	);

	let highlightedItem: undefined | I = $state();
</script>

<Combobox.Root
	{value}
	bind:open
	{...mergedRootProps}
	items={items.map((i) => ({ ...i, value: i.key }))}
>
	<!-- <div class="search-icon" class:shown={open}>
		<IconSearch />
	</div> -->
	<Combobox.Input {...mergedInputProps}>
		{#snippet child({ props: { value, ...props } })}
			<input
				{...props}
				value={open ? value : label || value}
				{@attach (e) => {
					focuser = (action) => {
						switch (action) {
							case 'focus':
								e.focus();
								break;
							case 'blur':
								e.blur();
								open = false;
								break;
							case 'toggle':
								if (document.activeElement === e) {
									e.blur();
									open = false;
								} else {
									e.focus();
								}
								break;
						}
					};
				}}
			/>
		{/snippet}
	</Combobox.Input>
	<!-- <Combobox.Trigger>Open</Combobox.Trigger> -->
	<Combobox.Portal>
		<Combobox.Content {...contentProps} sideOffset={8}>
			<div class="viewport" data-testid={viewportTestId}>
				<div class="items">
					<VirtualList items={filteredItems} let:item>
						<Combobox.Item
							value={item.key}
							label={item.label}
							onHighlight={() => {
								highlightedItem = items.find((i) => i.key === item.key);
							}}
						>
							{#snippet children({ selected })}
								{@render listItem({
									...item,
									selected,
									highlighted: highlightedItem?.key === item.key
								})}
							{/snippet}
						</Combobox.Item>
					</VirtualList>
					{#if filteredItems.length === 0}
						<span class="no-results">Aucun résultat :/</span>
					{/if}
				</div>
				<div class="docs" {@attach scrollfader}>
					{#if highlightedItem}
						{@render highlight(highlightedItem, items)}
					{:else}
						<section class="empty">
							<Logo variant="empty" />
						</section>
					{/if}
				</div>
			</div>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>

<style>
	.no-results {
		color: var(--gay);
	}

	:global([data-combobox-content]) {
		width: var(--combobox-content-width, 600px);
		height: 500px;
		border-radius: calc(2 * var(--corner-radius));
		background-color: var(--bg2-neutral);
		--viewport-padding: 1em;
		padding: var(--viewport-padding);
		z-index: 10000;
	}

	.viewport {
		display: flex;
		flex-direction: row;
		overflow: hidden;
		gap: 1em;
		height: 100%;
	}

	:global(input) {
		border: none;
		outline: none;
		font-size: 1.1em;
		font-weight: bold;
	}

	.items,
	.docs {
		width: 50%;
		scrollbar-color: var(--gray) transparent;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		overflow-y: auto;
	}

	:global([data-wide-docs] .items) {
		width: 40%;
	}

	:global([data-wide-docs] .docs) {
		width: 60%;
	}

	.items {
		display: flex;
		flex-direction: column;
	}

	.items :global([data-combobox-item]) {
		padding: 0.75em 0.5em;
		cursor: pointer;
	}
	.items :global([data-combobox-item][data-highlighted]) {
		background-color: var(--bg-primary);
		color: var(--fg-primary);
		border-radius: calc(2 * var(--corner-radius) - var(--viewport-padding) / 2);
	}

	.item {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.item.selected {
		color: var(--fg-primary);
		font-weight: bold;
	}

	.items .right {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.items .icon {
		font-size: 1.4em;
		display: flex;
		align-items: center;
		height: 0.8em;
		width: 0.8em;
		border-radius: 50%;
	}

	.docs {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
	}

	.docs .empty {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		--size: 6rem;
	}
</style>
