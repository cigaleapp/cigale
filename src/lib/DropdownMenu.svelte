<script generics="D = never, SD = never">
	import { DropdownMenu } from 'bits-ui';

	/**
	 * @template D
	 * @typedef {object} Item
	 * @property {string} label
	 * @property {() => void} onclick
	 * @property {boolean} [selected] adds aria-checked="true" to the item, and set role="menuitemcheckbox" to all items
	 * @property {boolean} [closeOnSelect] whether to close the menu when this item is selected (default: true)
	 * @property {D} data additional data associated with the item
	 */

	/**
	 * @template SD
	 * @typedef {Item<SD> & { selected: boolean, key: string | number }} SelectableItem
	 */

	/**
	 * @template D, SD
	 * @typedef {Item<D> | SelectableItem<SD>} AnyItem
	 */

	/**
	 * @template D, SD
	 * @typedef {{label?: string} & ({items: Item<D>[]} | {selectables: SelectableItem<SD>[]})} ItemsGroup
	 */

	/**
	 * @typedef {object} Props
	 * @property {ItemsGroup<D, SD>[]} items
	 * @property {import('svelte').Snippet<[AnyItem<D, SD>["data"], AnyItem<D, SD> & {selected: boolean}]>} [item]
	 * @property {import('svelte').Snippet<[{onclick: () => void}& Record<string, unknown>]>} trigger
	 * @property {string} [testid] sets data-testid to "{your value}-open" on the trigger element and "{your value}-options" on the content element
	 */

	/** @type {Props} */
	const { items: groups, item, trigger, testid, ...rest } = $props();

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
			{#each groups as group}
				{#if 'selectables' in group}
					<DropdownMenu.CheckboxGroup
						value={group.selectables
							.filter((i) => i.selected)
							.map((i) => i.key.toString())}
					>
						{#if group.label}
							<DropdownMenu.GroupHeading>{group.label}</DropdownMenu.GroupHeading>
						{/if}

						{#each group.selectables as i (i.key)}
							<DropdownMenu.CheckboxItem
								checked={i.selected}
								onSelect={i.onclick}
								closeOnSelect={i.closeOnSelect ?? true}
								value={i.key.toString()}
								textValue={i.label}
								aria-label={i.label}
							>
								{#if item}
									{@render item(i.data, i)}
								{:else}
									{i.label}
								{/if}
							</DropdownMenu.CheckboxItem>
						{/each}
					</DropdownMenu.CheckboxGroup>
				{:else}
					<DropdownMenu.Group>
						{#if group.label}
							<DropdownMenu.GroupHeading>{group.label}</DropdownMenu.GroupHeading>
						{/if}

						{#each group.items as i (i.label)}
							<DropdownMenu.Item
								textValue={i.label}
								onSelect={i.onclick}
								closeOnSelect={i.closeOnSelect ?? true}
								aria-label={i.label}
							>
								{#if item}
									{@render item(i.data, { ...i, selected: false })}
								{:else}
									{i.label}
								{/if}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Group>
				{/if}
			{/each}
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
