<script lang="ts" module>
	type Item = {
		key: string;
		label: string;
	};

	type Props<I extends Item, V extends string> = {
		items: I[];
		value: V | undefined;
		/** Used when multiple=true. **NOT BINDABLE** (at least for now) */
		values?: V[];
		multiple?: boolean;
		// eslint-disable-next-line no-unused-vars
		onValueChange?: (newValue: V, newValues: V[]) => Promise<void>;
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
		/** Usage:
		 * ```svelte
		 * {#snippet searchbox({ focusSetter, ...props })}
		 * 		<input {...props} {@attach focusSetter}>
		 * {/snippet}
		 * ```
		 * */
		searchbox?: Snippet<[Record<string, unknown>]>;
	};
</script>

<script lang="ts" generics="I extends Item, V extends string">
	import type { WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	import { Combobox, mergeProps } from 'bits-ui';
	import { Debounced } from 'runed';

	import Logo from './Logo.svelte';
	import { scrollfader } from './scrollfader.js';
	import { compareBy } from './utils.js';
	import VirtualList from './VirtualList.svelte';

	type MergedProps = Props<I, V> & Omit<Combobox.RootProps, keyof Props<I, V>>;

	let {
		multiple,
		items: staticItems,
		sorter,
		suggestions,
		searcher,
		value = $bindable(),
		values,
		open = $bindable(false),
		focuser = $bindable(),
		'viewport-testid': viewportTestId,
		inputProps,
		contentProps,
		listItem,
		highlight,
		searchbox,
		onValueChange,
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
				matchedFrom: item.label,
			}));
		}

		return items
			.map((item) => ({
				...item,
				matchedFrom: searcher(searchValue, item),
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
			defaultValue: label,
		})
	);

	let highlightedItem: undefined | I = $state();

	const focusSetter: Attachment<HTMLInputElement> = (node) => {
		focuser = (action) => {
			switch (action) {
				case 'focus':
					node.focus();
					break;
				case 'blur':
					node.blur();
					open = false;
					break;
				case 'toggle':
					if (document.activeElement === node) {
						node.blur();
						open = false;
					} else {
						node.focus();
					}
					break;
			}
		};
	};
</script>

<Combobox.Root
	bind:open
	{...mergedRootProps}
	items={items.map((i) => ({ ...i, value: i.key }))}
	{...multiple
		? {
				value: values ?? (value ? [value] : []),
				type: 'multiple',
				async onValueChange(newValue: V[]) {
					if (newValue.length === 0) return;
					await onValueChange?.(newValue[0], newValue);
				},
			}
		: {
				value: value,
				type: 'single',
				async onValueChange(newValue: V) {
					await onValueChange?.(newValue, []);
				},
			}}
>
	<!-- <div class="search-icon" class:shown={open}>
		<IconSearch />
	</div> -->
	<Combobox.Input {...mergedInputProps}>
		{#snippet child({ props: { value: inputValue, ...props } })}
			{const effectiveValue = value ? (open ? inputValue : label) : ''}
			{#if searchbox}
				{@render searchbox({ value: effectiveValue, ...props, focusSetter })}
			{:else}
				<input {...props} value={effectiveValue} {@attach focusSetter} />
			{/if}
		{/snippet}
	</Combobox.Input>
	<!-- <Combobox.Trigger>Open</Combobox.Trigger> -->
	<Combobox.Portal>
		<Combobox.Content {...contentProps} sideOffset={8}>
			<div class="viewport" data-testid={viewportTestId}>
				<div class="items">
					<VirtualList items={filteredItems} empty="Aucun résultat :/">
						{#snippet item(item)}
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
										highlighted: highlightedItem?.key === item.key,
									})}
								{/snippet}
							</Combobox.Item>
						{/snippet}
					</VirtualList>
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
