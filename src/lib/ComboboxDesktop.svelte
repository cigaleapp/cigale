<script lang="ts" generics="I extends Item, V extends string">
	import type { Item, SubcomponentProps } from './Combobox.svelte';
	import type { Attachment } from 'svelte/attachments';

	import { Combobox } from 'bits-ui';
	import { uniqBy } from 'es-toolkit';
	import { Debounced, watch } from 'runed';

	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import DebugOnly from '$lib/DebugOnly.svelte';
	import Logo from '$lib/Logo.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { scrollfader } from '$lib/scrollfader.js';
	import VirtualList from '$lib/VirtualList.svelte';

	let {
		multiple,
		initially,
		suggestions,
		itemsByKey,
		sorter,
		details,
		searcher,
		itemExtraContent,
		focuser = $bindable(),
		'viewport-testid': viewportTestId,
		onValueChange,
		open = $bindable(false),
		id,
	}: SubcomponentProps<I, V> = $props();

	let searchValue = $state('');

	const label = $derived(initially.at(0)?.label ?? '');

	const debouncedSearchValue = new Debounced(() => searchValue, 300);

	let searchedItems = $state<I[] | undefined>();
	$effect(() => {
		if (debouncedSearchValue.current === '' || !searcher) {
			searchedItems = undefined;
			return;
		}

		(async () => {
			searchedItems = await Array.fromAsync(searcher(debouncedSearchValue.current));
		})();
	});

	const items = $derived(searchedItems ?? uniqBy([...initially, ...suggestions], (i) => i.key));

	// Only re-sort items when we open the combobox again,
	// to prevent jumps while changing the selection
	// svelte-ignore state_referenced_locally
	let sortedItems = $state(items.toSorted(sorter));
	watch([() => open, () => sorter], () => {
		sortedItems = items.toSorted(sorter);
	});

	const filteredItems = $derived.by(() => {
		if (searchedItems) return searchedItems;
		if (sortedItems.length > 0) return sortedItems;
		return items;
	});

	function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
		searchValue = e.currentTarget.value;
	}

	function handleOpenChange(newOpen: boolean) {
		// FIXME: does not clear the stored search value
		// repro: type something in, close the combobox, re-open it:
		// it remembers the search instead of clearing
		if (!newOpen) searchValue = '';
	}

	let highlightedItem: undefined | I = $derived(initially.at(0));

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
	onOpenChange={handleOpenChange}
	items={items.map((i) => ({ ...i, disabled: Boolean(i.disabled), value: i.key }))}
	{...multiple
		? {
				value: initially.map((i) => i.key),
				type: 'multiple',
				async onValueChange(newValue: V[]) {
					if (newValue.length === 0) return;
					await onValueChange?.(newValue[0], newValue);
				},
			}
		: {
				value: initially.at(0)?.key,
				type: 'single',
				async onValueChange(newValue: V) {
					await onValueChange?.(newValue, []);
				},
			}}
>
	<!-- <div class="search-icon" class:shown={open}>
		<IconSearch />
	</div> -->
	<Combobox.Input
		{id}
		placeholder={label}
		oninput={handleInput}
		defaultValue={label}
		onfocus={() => {
			open = true;
		}}
	>
		{#snippet child({ props })}
			{@const effectiveValue = open ? searchValue : label}
			<input {...props} value={effectiveValue} {@attach focusSetter} />
		{/snippet}
	</Combobox.Input>
	<Combobox.Portal>
		<Combobox.Content sideOffset={8}>
			<div class="viewport" pw-testid={viewportTestId}>
				<div class="items">
					<!-- FIXME: doesnt seem to work that well
					 Used to reset scroll every time the filtered items change -->
					<VirtualList
						scroll={{ y: searchValue.length * 0 }}
						items={filteredItems}
						empty="Aucun résultat :/"
					>
						{#snippet item(item)}
							{const { label, key, disabled, confidence } = $derived(item)}

							<Combobox.Item
								value={key}
								{label}
								onHighlight={() => {
									highlightedItem = items.find((i) => i.key === key);
								}}
							>
								{#snippet children({ selected })}
									<div class="suggestion" class:selected>
										<div class="label">
											<OverflowableText text={label} />
											{#if disabled}
												<div class="disabled-why">
													<DebugOnly inline data={key} />
													{typeof disabled === 'string'
														? disabled
														: 'Désactivé'}
												</div>
											{:else}
												<DebugOnly inline data={key} />
											{/if}
										</div>

										<div class="confidence">
											{#if confidence !== undefined}
												<ConfidencePercentage
													compact
													no-fallback
													value={confidence}
												/>
											{/if}
										</div>

										{#if itemExtraContent}
											<div class="extra-content">
												{@render itemExtraContent(item, {
													selected,
												})}
											</div>
										{/if}
									</div>
								{/snippet}
							</Combobox.Item>
						{/snippet}
					</VirtualList>
				</div>
				<div class="docs" {@attach scrollfader}>
					{#if highlightedItem}
						{@render details(highlightedItem, {
							allItems: items,
							expanded: false,
							// TODO: maybe?
							expand() {
								console.error(
									'Expanding details isnt available on desktop comboboxes'
								);
							},
							select(item) {
								itemsByKey.set(item.key, item);
								highlightedItem = item;
							},
						})}
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
	input {
		background-color: var(--metadata-combobox-trigger-bg, var(--bg-neutral));
	}

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
		scrollbar-color: var(--gray) transparent;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		overflow-y: auto;
	}

	.items {
		width: var(--combobox-items-width, 40%);
	}
	.docs {
		width: var(--combobox-details-height, 60%);
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

	.suggestion {
		overflow: hidden;
		display: grid;
		width: 100%;
		--h: 1.5rem;
		height: var(--h);
		gap: 1rem;
		align-items: center;
		text-align: left;

		grid-template-columns: 1fr max-content;
		&:has(.extra-content) {
			grid-template-columns: 1fr max-content max-content;
		}

		&[disabled] {
			opacity: 0.5;
		}

		.label {
			overflow: hidden;
		}

		.confidencen {
			margin-left: auto;
		}
	}
</style>
