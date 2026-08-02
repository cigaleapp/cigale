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
		// TODO: support on desktop too
		/** Show the item with warning styling. **Note:** Only supported on mobile for now. */
		warning?: boolean;
		// TODO: support on desktop too
		/** Show the item with danger styling. **Note:** Only supported on mobile for now. */
		danger?: boolean;
		/** Show left of the label */
		icon?: import('svelte').Component;
		/** Add text on the right of the label, useful to show current status/short help/etc */
		subtext?: string;
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
		testid?: PlaywrightTestIdBaseForDropdownMenu;
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
		testid?: PlaywrightTestId;
		items: AnyItem<D, SD>[];
	};
</script>

<script lang="ts" generics="D = never, SD = never">
	import type { Props as BottomDrawerProps } from './BottomDrawer.svelte';
	import type { PlaywrightTestId, PlaywrightTestIdBaseForDropdownMenu } from '$e2e/testids.js';
	import type { Snippet } from 'svelte';

	import { DropdownMenu } from 'bits-ui';
	import { watch } from 'runed';

	import IconSelected from '~icons/ri/check-line';

	import BottomDrawer from './BottomDrawer.svelte';
	import { IsMobile } from './mobile.svelte.js';
	import Submenu from './Submenu.svelte';
	import { sum } from './utils.js';
	import OverflowableText from './OverflowableText.svelte';

	interface Props {
		/** Shown on mobile (when it's a drawer) and in place of the first item group's label if not set */
		title?: string;

		/** Only useful on mobile. Tells where the bottom sheet should come from. Defaults to bottom */
		position?: BottomDrawerProps['position'];

		items: ItemsGroup<D, SD>[];
		item?: Snippet<[AnyItem<D, SD>['data'], AnyItem<D, SD> & { selected: boolean }]>;
		/** IMPORTANT: Don't put just onclick on the button, spread the entire object */
		trigger: Snippet<[{ open: boolean; onclick: () => void } & Record<string, unknown>]>;
		testid?: PlaywrightTestIdBaseForDropdownMenu | undefined;
		scrollable?: boolean;
	}

	const {
		items: groups,
		item,
		trigger,
		testid,
		scrollable = false,
		title,
		position = 'bottom',
		...rest
	}: Props = $props();

	function testids(testid: PlaywrightTestIdBaseForDropdownMenu | undefined) {
		return {
			trigger: testid ? (`${testid}-open` as const) : undefined,
			content: testid ? (`${testid}-options` as const) : undefined,
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
			onclick() {
				open = !open;
			},
		},
		{}
	)}

	<BottomDrawer
		--drawer-outer-padding="0"
		bind:open
		{position}
		{title}
		maxHeight={Math.min(
			estimatedHeight,
			windowHeight * 0.9 /* don't take more than 90% of the screen height */
		)}
	>
		<Submenu
			items={groups.flatMap((group, i) =>
				group.items.map((item, j) => ({
					key: `${i}/${j}`,
					...item,
					groupIndex: i,
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
					class:warning={i.warning}
					class:danger={i.danger}
					onclick={async () => {
						i.onclick();

						if (i.closeOnSelect ?? true) {
							open = false;
						}
					}}
				>
					{#if item}
						{@render item(
							i.data,
							i.type === 'clickable' ? { selected: false, ...i } : i
						)}
					{:else}
						<div class="label-and-icon">
							<!-- To align items when some have icons and some don't -->
							{#if groups.some( (group) => group.items.some((i) => i.icon || i.type === 'selectable') )}
								<div class="icon">
									{#if i.icon}
										<i.icon />
									{:else if i.type === 'selectable' && i.selected}
										<IconSelected />
									{/if}
								</div>
							{/if}
							{i.label}
							{#if i.subtext}
								<div class="subtext">
									<OverflowableText text={i.subtext} />
								</div>
							{/if}
						</div>
					{/if}
				</button>
			{/snippet}
		</Submenu>
	</BottomDrawer>
{:else}
	<DropdownMenu.Root bind:open>
		<DropdownMenu.Trigger {...rest} pw-testid={testids(testid).trigger}>
			{#snippet child({ props })}
				{@render trigger(
					{
						...props,
						open,
						onclick() {
							console.log('swithcing open state', {
								open,
								testid: testids(testid).trigger,
							});
						},
					},
					{}
				)}
			{/snippet}
		</DropdownMenu.Trigger>

		<DropdownMenu.Portal>
			<DropdownMenu.Content pw-testid={testids(testid).content} preventScroll={!scrollable}>
				{#each groups as group (group.label)}
					{#if group.items.length > 0}
						<DropdownMenu.Group pw-testid={group.testid}>
							{#if group.label || (groups.length === 1 && title)}
								<DropdownMenu.GroupHeading>
									{group.label || title}
								</DropdownMenu.GroupHeading>
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
											pw-testid={testids(i.testid).trigger}
										>
											{#if item}
												{@render item(i.data, { selected: false, ...i })}
											{:else}
												{i.label}
											{/if}
										</DropdownMenu.SubTrigger>
										<DropdownMenu.SubContent
											pw-testid={testids(i.testid).content}
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
		/** No vertical padding cuz height is locked, we center it vertically instead */
		padding: 0 0.75em;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		font-size: 1.125rem;
		display: flex;
		align-items: center;
		gap: 1rem;

		&:focus {
			background: var(--bg-primary-translucent);
		}

		&.warning {
			color: var(--fg-warning);
			background: var(--bg-warning);
		}

		&.danger {
			color: var(--fg-error);
		}
	}

	.bottom-drawer-heading {
		padding-top: 0.5em;
		margin-left: 0.75em;
		font-size: 0.9rem;
		font-style: italic;
		color: var(--gay);
	}

	.label-and-icon {
		display: flex;
		gap: 0.5em;
		align-items: center;
		padding: 0.25em;
		width: 100%;

		.icon {
			display: flex;
			align-items: center;
			justify-content: center;
			/* Makes space even if icon is empty */
			width: 1.25em;
			height: 1.25em;
		}

		.subtext {
			color: var(--gay);
			text-align: right;
			margin-left: auto;
		}
	}
</style>
