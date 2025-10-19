<script generics="ItemData, SelectableItemData">
	import { DropdownMenu } from 'bits-ui';

	/**
	 * @typedef {object} ItemBase
	 * @property {string} label
	 * @property {() => void} onclick
	 * @property {boolean} [selected] adds aria-checked="true" to the item, and set role="menuitemcheckbox" to all items
	 */

	/**
	 * @typedef {ItemBase & ItemData} Item
	 * @typedef {ItemBase & SelectableItemData & { selected: boolean, key: string | number }} SelectableItem
	 * @typedef {Item | SelectableItem} AnyItem
	 */

	/**
	 * @typedef {object} Props
	 * @property {Item[]} items
	 * @property {SelectableItem[]} [selectableItems]
	 * @property {string} [help]
	 * @property {import('svelte').Snippet<[AnyItem]>} [item]
	 * @property {import('svelte').Snippet<[{onclick: () => void}& Record<string, unknown>]>} trigger
	 * @property {string} [testid] sets data-testid to "{your value}-open" on the trigger element and "{your value}-options" on the content element
	 */

	/** @type {Props} */
	const { items, item, selectableItems = [], trigger, testid, help = '', ...rest } = $props();

	const testids = $derived({
		trigger: testid ? `${testid}-open` : undefined,
		content: testid ? `${testid}-options` : undefined
	});

	let open = $state(false);
</script>

<DropdownMenu.Root {open}>
	<DropdownMenu.Trigger {...rest} data-testid={testids.trigger}>
		{#snippet child({ props })}
			{@render trigger({
				...props,
				onclick: () => {
					open = !open;
				}
			})}
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Portal>
		<DropdownMenu.Content data-testid={testids.content}>
			<DropdownMenu.CheckboxGroup
				value={selectableItems.filter((i) => i.selected).map((i) => i.key.toString())}
			>
				{#if help}
					<DropdownMenu.GroupHeading>{help}</DropdownMenu.GroupHeading>
				{/if}

				{#each selectableItems as i (i.label)}
					<DropdownMenu.CheckboxItem
						checked={i.selected}
						onSelect={i.onclick}
						value={i.key.toString()}
						textValue={i.label}
						aria-label={i.label}
					>
						{#if item}
							{@render item(i)}
						{:else}
							{i.label}
						{/if}
					</DropdownMenu.CheckboxItem>
				{/each}
			</DropdownMenu.CheckboxGroup>

			<DropdownMenu.Group>
				{#if help && !selectableItems.length}
					<DropdownMenu.GroupHeading>{help}</DropdownMenu.GroupHeading>
				{/if}

				{#each items as i (i.label)}
					<DropdownMenu.Item
						textValue={i.label}
						onSelect={i.onclick}
						aria-label={i.label}
					>
						{#if item}
							{@render item(i)}
						{:else}
							{i.label}
						{/if}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
	:global([data-dropdown-menu-content]) {
		display: flex;
		flex-direction: column;
		background-color: var(--bg-neutral);
		border: 1px solid var(--fg-primary);
		border-radius: 0.5rem;
		overflow: hidden;
		z-index: 100;
	}

	:global([data-dropdown-menu-group-heading]) {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-style: italic;
		color: var(--gay);
	}

	:global([data-dropdown-menu-item]) {
		padding: 0.5rem 1rem;
		cursor: pointer;
		user-select: none;
		display: flex;
		align-items: center;
		gap: 0.25em;
	}

	:global([data-dropdown-menu-item]:is(:hover, :focus-visible)) {
		background-color: var(--bg-primary-translucent);
		color: var(--fg-primary);
	}
</style>
