<script lang="ts" module>
	export type Item<D> = {
		type: 'clickable';
		label: string;
		onclick: () => void;
		/** Adds aria-checked="true" to the item, and set role="menuitemcheckbox" to all items */
		selected?: boolean;
		/** Whether to close the menu when this item is selected (default: true) */
		closeOnSelect?: boolean;
		/** Additional data associated with the item */
		data: D;
		key?: string | number;
	};

	export type SelectableItem<SD> = Omit<Item<SD>, 'type' | 'key'> & {
		type: 'selectable';
		selected: boolean;
		key: string | number;
	};

	export type SubmenuItem<D, SD> = {
		type: 'submenu';
		data: D;
		label: string;
		selected?: boolean;
		testid?: string;
		key?: string | number;
		submenu: {
			label?: string;
			/** Text to show when items is empty */
			empty?: string;
			items: Array<Item<D> | SelectableItem<SD>>;
		};
	};

	export type AnyItem<D, SD> = Item<D> | SelectableItem<SD> | SubmenuItem<D, SD>;

	export type ItemsGroup<D, SD> = {
		label?: string;
		testid?: string;
		items: AnyItem<D, SD>[];
	};
</script>

<script lang="ts" generics="D = never, SD = never">
	import type { Snippet } from 'svelte';

	import { DropdownMenu } from 'bits-ui';
	import { watch } from 'runed';

	import BottomDrawer from './BottomDrawer.svelte';
	import { IsMobile } from './mobile.svelte.js';
	import Submenu from './Submenu.svelte';
	import { sum } from './utils.js';

	interface Props {
		/** Shown on mobile (when it's a drawer) and in place of the first item group's label if not set */
		title?: string;

		items: ItemsGroup<D, SD>[];
		item?: Snippet<[AnyItem<D, SD>['data'], AnyItem<D, SD> & { selected: boolean }]>;
		/** IMPORTANT: Don't put just onclick on the button, spread the entire object */
		trigger: Snippet<[{ open: boolean; onclick: () => void } & Record<string, unknown>]>;
		testid?: string | undefined;
		scrollable?: boolean;
	}

	const {
		items: groups,
		item,
		trigger,
		testid,
		scrollable = false,
		title,
		...rest
	}: Props = $props();

	function testids(testid: string | undefined) {
		return {
			trigger: testid ? `${testid}-open` : undefined,
			content: testid ? `${testid}-options` : undefined,
		};
	}

	let open = $state(false);

	const mobile = new IsMobile();

	const rem = (x: number) => x * 16;

	/** Used to estimate the total height of the drawer content on mobile */
	const heights = {
		item: { height: 48 },
		group: {
			marginTop: rem(1),
			height: 20,
			marginBottom: rem(0.5),
		},
	};

	let windowHeight = $state<number>(0);

	// Don't change estimated height if the items change, because it causes jank
	let estimatedHeight = $state<number>();
	watch([() => title], () => {
		const { item, group } = heights;

		const groupHeights = groups.map(
			({ label, items: { length } }, i) =>
				length * item.height +
				(label && length
					? sum([i > 0 ? group.marginTop : 0, group.height, group.marginBottom])
					: 0)
		);

		estimatedHeight =
			/* groups */
			sum(groupHeights) +
			/* padding */
			1.25 /*rem*/ * 16 +
			/* handle area */
			(title ? 60 : 36) /*px*/ +
			/* margin for error */
			20; /*px*/
	});
</script>

<svelte:window bind:innerHeight={windowHeight} />

{#if mobile.current}
	{@render trigger(
		{
			open,
			onclick: () => {
				open = !open;
			},
		},
		{}
	)}

	<BottomDrawer
		bind:open
		{title}
		maxHeight={Math.min(
			estimatedHeight,
			windowHeight * 0.9 /* don't take more than 90% of the screen height */
		)}
	>
		<Submenu
			items={groups.flatMap((group, i) =>
				group.items.map((item, j) => ({
					...item,
					key: `${i}/${item.key ?? j}`,
					data: {
						...item.data,
						groupIndex: i,
						groupTitle: j === 0 ? group.label : undefined,
					},
				}))
			)}
		>
			{#snippet item({ groupTitle, groupIndex }, i)}
				{#if groupTitle}
					<p
						style:margin-top="{groupIndex === 0 ? 0 : heights.group.marginTop}px"
						style:height="{heights.group.height}px"
						style:margin-bottom="{heights.group.marginBottom}px"
						class="bottom-drawer-heading"
					>
						{groupTitle}
					</p>
				{/if}
				<button
					style:height="{heights.item.height}px"
					class="bottom-drawer-item"
					onclick={async () => {
						i.onclick();

						if (i.closeOnSelect ?? true) {
							open = false;
						}
					}}
				>
					{#if i.type === 'clickable'}
						{#if item}
							{@render item(i.data, { selected: false, ...i })}
						{:else}
							{i.label}
						{/if}
					{:else if item}
						{@render item(i.data, i)}
					{:else}
						{i.label}
					{/if}
				</button>
			{/snippet}
		</Submenu>
	</BottomDrawer>
{:else}
	<DropdownMenu.Root {open}>
		<DropdownMenu.Trigger {...rest} data-testid={testids(testid).trigger}>
			{#snippet child({ props })}
				{@render trigger(
					{
						...props,
						open,
						onclick: () => {
							open = !open;
						},
					},
					{}
				)}
			{/snippet}
		</DropdownMenu.Trigger>

		<DropdownMenu.Portal>
			<DropdownMenu.Content data-testid={testids(testid).content} preventScroll={!scrollable}>
				{#each groups as group (group.label)}
					{#if group.items.length > 0}
						<DropdownMenu.Group data-testid={group.testid}>
							{#if group.label || (groups.length === 1 && title)}
								<DropdownMenu.GroupHeading
									>{group.label || title}</DropdownMenu.GroupHeading
								>
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
										<DropdownMenu.SubTrigger
											data-testid={testids(i.testid).trigger}
										>
											{#if item}
												{@render item(i.data, { selected: false, ...i })}
											{:else}
												{i.label}
											{/if}
										</DropdownMenu.SubTrigger>
										<DropdownMenu.SubContent
											data-testid={testids(i.testid).content}
										>
											<DropdownMenu.Group>
												{#if i.submenu.label}
													<DropdownMenu.GroupHeading
														>{i.submenu
															.label}</DropdownMenu.GroupHeading
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
																	selected: false,
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
												{:else}
													<DropdownMenu.Item disabled>
														<div class="empty-submenu">
															{i.submenu.empty ??
																'Aucun élément disponible'}
														</div>
													</DropdownMenu.Item>
												{/each}
											</DropdownMenu.Group>
										</DropdownMenu.SubContent>
									</DropdownMenu.Sub>
								{/if}
							{/each}
						</DropdownMenu.Group>
					{/if}
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	</DropdownMenu.Root>
{/if}

<style>
	:global([data-dropdown-menu-content]) {
		display: flex;
		flex-direction: column;
		background-color: var(--bg-neutral);
		border: 1px solid var(--fg-primary);
		border-radius: 0.5rem;
		overflow: auto;
		max-height: 60vh;
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

	:global([data-dropdown-menu-item]:not([aria-disabled='true']):is(:hover, :focus-visible)) {
		background-color: var(--bg-primary-translucent);
		color: var(--fg-primary);
	}

	.empty-submenu {
		max-width: 200px;
		min-height: 300px;
		display: flex;
		align-items: center;
		text-align: center;
		color: var(--gay);
	}

	.bottom-drawer-item {
		/* padding: 0.5em; */
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		font-size: 1.125rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.bottom-drawer-heading {
		margin: 1em 0 0.5em;
		font-size: 0.9rem;
		font-style: italic;
		color: var(--gay);
	}
</style>
