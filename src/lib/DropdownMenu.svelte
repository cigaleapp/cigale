<script lang="ts" generics="D = never, SD = never">
	import { DropdownMenu } from 'bits-ui';
	import { tr } from 'date-fns/locale';
	import type { Snippet } from 'svelte';

	type Item<D> = {
		type: 'clickable';
		label: string;
		onclick: () => void;
		/** Adds aria-checked="true" to the item, and set role="menuitemcheckbox" to all items */
		selected?: boolean;
		/** Whether to close the menu when this item is selected (default: true) */
		closeOnSelect?: boolean;
		/** Additional data associated with the item */
		data: D;
	};

	type SelectableItem<SD> = Omit<Item<SD>, 'type'> & {
		type: 'selectable';
		selected: boolean;
		key: string | number;
	};

	type SubmenuItem<D, SD> = {
		type: 'submenu';
		data: D;
		label: string;
		selected?: boolean;
		testid?: string;
		submenu: {
			label?: string;
			items: Array<Item<D> | SelectableItem<SD>>;
		};
	};

	type AnyItem<D, SD> = Item<D> | SelectableItem<SD> | SubmenuItem<D, SD>;

	type ItemsGroup<D, SD> = {
		label?: string;
		testid?: string;
		items: AnyItem<D, SD>[];
	};

	interface Props {
		items: ItemsGroup<D, SD>[];
		item?: Snippet<[AnyItem<D, SD>['data'], AnyItem<D, SD> & { selected: boolean }]>;
		trigger: Snippet<[{ onclick: () => void } & Record<string, unknown>]>;
		testid?: string | undefined;
	}

	const { items: groups, item, trigger, testid, ...rest }: Props = $props();

	function testids(testid: string | undefined) {
		return {
			trigger: testid ? `${testid}-open` : undefined,
			content: testid ? `${testid}-content` : undefined
		};
	}

	let open = $state(false);
</script>

<DropdownMenu.Root {open}>
	<DropdownMenu.Trigger {...rest} data-testid={testids(testid).trigger}>
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
		<DropdownMenu.Content data-testid={testids(testid).content}>
			{#each groups as group}
				<DropdownMenu.Group data-testid={group.testid}>
					{#if group.label}
						<DropdownMenu.GroupHeading>{group.label}</DropdownMenu.GroupHeading>
					{/if}

					{#each group.items as i (i.label)}
						{#if i.type === 'clickable'}
							<DropdownMenu.Item
								textValue={i.label}
								onSelect={i.onclick}
								closeOnSelect={i.closeOnSelect ?? true}
								aria-label={i.label}
							>
								{#if item}
									{@render item(i.data, { selected: false, ...i })}
								{:else}
									{i.label}
								{/if}
							</DropdownMenu.Item>
						{:else if i.type === 'selectable'}
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
						{:else if i.type === 'submenu'}
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger data-testid={testids(i.testid).trigger}>
									{#if item}
										{@render item(i.data, { selected: false, ...i })}
									{:else}
										{i.label}
									{/if}
								</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent data-testid={testids(i.testid).content}>
									<DropdownMenu.Group>
										{#if i.submenu.label}
											<DropdownMenu.GroupHeading
												>{i.submenu.label}</DropdownMenu.GroupHeading
											>
										{/if}

										{#each i.submenu.items as j (j.label)}
											{#if j.type === 'clickable'}
												<DropdownMenu.Item
													textValue={j.label}
													onSelect={j.onclick}
													closeOnSelect={j.closeOnSelect ?? true}
													aria-label={j.label}
												>
													{#if item}
														{@render item(j.data, {
															...j,
															selected: false
														})}
													{:else}
														{j.label}
													{/if}
												</DropdownMenu.Item>
											{:else if j.type === 'selectable'}
												<DropdownMenu.CheckboxItem
													checked={j.selected}
													onSelect={j.onclick}
													closeOnSelect={j.closeOnSelect ?? true}
													value={j.key.toString()}
													textValue={j.label}
													aria-label={j.label}
												>
													{#if item}
														{@render item(j.data, j)}
													{:else}
														{j.label}
													{/if}
												</DropdownMenu.CheckboxItem>
											{/if}
										{/each}
									</DropdownMenu.Group>
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
						{/if}
					{/each}
				</DropdownMenu.Group>
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
