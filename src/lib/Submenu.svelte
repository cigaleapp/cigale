<script lang="ts" generics="D, SD">
	import type { AnyItem, SubmenuItem } from './DropdownMenu.svelte';
	import type { Snippet } from 'svelte';

	import { ms } from 'convert';
	import { tick } from 'svelte';

	import IconBack from '~icons/ri/arrow-left-s-fill';

	import ButtonInk from './ButtonInk.svelte';
	import Logo from './Logo.svelte';
	import { climbDOMUntil, logexpr, sleep } from './utils.js';

	type Item = AnyItem<D, SD>;

	// type Item<D> = {
	// 	key?: string | number | undefined;
	// 	label: string;
	// 	data: D;
	// 	submenu?: Item<D>[];
	// 	submenuEmptyText?: string;
	// };

	interface Props {
		items: Item[];
		item: Snippet<[D | SD, Item & { closeOnSelect?: boolean; onclick: () => void }]>;
	}

	const { items, item: itemSnippet }: Props = $props();

	let transitionsDisabled = $state(false);

	type StackEntry = {
		key: string;
		scroll: number;
	};

	const stack = $state<StackEntry[]>([
		{
			/** root is "" */
			key: '',
			scroll: 0,
		},
	]);

	const previous = $derived(stack.at(-2));
	const current = $derived(stack.at(-1));
	let next = $state<StackEntry | undefined>(undefined);

	function submenuOf(key: string | number | undefined) {
		const withNoEmptyText = <T,>(items: T) => ({ items, empty: '' });

		if (key === undefined) return withNoEmptyText([]);
		if (key === '') return withNoEmptyText(items);

		const submenus = items.filter((i) => i.type === 'submenu');

		return submenus.find((i) => i.key === key)?.submenu ?? withNoEmptyText([]);
	}

	const nodes = $state({
		previous: null as HTMLElement | null,
		current: null as HTMLElement | null,
		next: null as HTMLElement | null,
	});

	const scrollable = $derived(
		// XXX: relies on bottom-sheet internals
		climbDOMUntil(
			nodes.current ?? null,
			(n) => n.classList?.contains('bottom-sheet') && n.role === 'dialog'
		)
	);

	function captureScroll(stackPosition: number) {
		if (!scrollable) return;

		const stackIndex = stack.findIndex(({ key }) => key === stack.at(stackPosition)?.key);
		if (stackIndex === -1) return;
		stack[stackIndex].scroll = scrollable.scrollTop;
	}

	/** Returns old scrollTop value */
	function setScroll(scroll: number): number {
		if (!scrollable) return 0;

		const oldScroll = scrollable.scrollTop;

		scrollable.scrollTo({
			top: scroll,
			behavior: 'smooth',
		});

		return oldScroll;
	}

	async function slideViews(
		current: HTMLElement | null,
		target: HTMLElement | null,
		{ direction, scroll }: { direction: 'next' | 'previous'; scroll: number }
	) {
		if (!current || !target) return;
		const width = current.offsetWidth;

		console.log({ width });

		target.style.width = `${width}px`;

		const sign = direction === 'next' ? '-' : '';

		target.style.translate = sign + `${width}px 0`;
		current.style.translate = sign + `${width}px 0`;
		setScroll(scroll);

		const transitionDuration = ms(getComputedStyle(target).transitionDuration ?? '0s');

		await sleep(transitionDuration + ms('20ms'));

		transitionsDisabled = true;
	}

	async function resetNodes() {
		if (!nodes.previous || !nodes.current || !nodes.next) return;

		const everynode = [nodes.previous, nodes.current, nodes.next];

		everynode.forEach((node) => (node.style.translate = `0 0`));
		await sleep(50);
		transitionsDisabled = false;
	}

	function armNestedSubmenu(key: string | number) {
		next = { key: key.toString(), scroll: 0 };
	}

	async function switchToNext() {
		if (!next) return;
		captureScroll(-1);
		await slideViews(nodes.current, nodes.next, { direction: 'next', scroll: 0 });
		stack.push(next);
		next = undefined;
		await resetNodes();
	}

	async function switchBack() {
		await slideViews(nodes.current, nodes.previous, {
			direction: 'previous',
			scroll: previous?.scroll ?? 0,
		});
		stack.pop();
		next = undefined;
		await resetNodes();
	}
</script>

{#snippet listing(entry: StackEntry | undefined)}
	{@const { items, empty: emptyText } = submenuOf(entry?.key)}
	<div class="submenu">
		{#each items as item (item.key || item.label)}
			<div class="item">
				<div class="label">
					{@render itemSnippet(
						item.data,
						item.type === 'submenu'
							? {
									...item,
									closeOnSelect: false,
									async onclick() {
										console.log('Opening submenu', item);
										if (!item.key)
											throw new Error('Submenu items must have a key');
										armNestedSubmenu(item.key);
										await tick();
										await switchToNext();
									},
								}
							: item
					)}
				</div>
			</div>
		{:else}
			{#if emptyText}
				<div class="empty">
					<Logo variant="empty" />
					{emptyText}
				</div>
			{/if}
		{/each}
	</div>
{/snippet}

<div
	class="submenu-stack"
	class:no-transitions={transitionsDisabled}
	{@attach (node) => {
		// Needed otherwise submenu-stack takes the height of submenu-onscreen (since others are positionned absolutely), which hides content during transition when sliding from a shorter submenu to a taller one.
		// XXX: The - 10 is a margin to prevent a scrollbar from appearing (we're probably missing something like padding which causes that -10 to be needed, but oh well)
		node.style.height = node.parentElement!.offsetHeight - 10 + 'px';
	}}
>
	<div class="submenu-offscreen-prev" bind:this={nodes.previous}>
		{@render listing(previous)}
	</div>

	<div class="submenu-onscreen" bind:this={nodes.current}>
		{#if stack.length > 1}
			<ButtonInk onclick={switchBack}>
				<IconBack />
				Retour
			</ButtonInk>
		{/if}
		{@render listing(current)}
	</div>

	<div class="submenu-offscreen-next" bind:this={nodes.next}>
		<ButtonInk onclick={() => {}}>
			<IconBack />
			Retour
		</ButtonInk>
		{@render listing(next)}
	</div>
</div>

<style>
	.submenu-stack {
		position: relative;
		width: 100%;
		overflow-x: hidden;
		/* Required to prevent extra scrollbars in some conditions when going to a longer submenu and scroll > 0 on parent menu (or sth like that idk, it's kinda tricky) */
		overflow-y: hidden;

		&:not(.no-transitions) > * {
			transition: translate 0.3s ease;
		}

		> * {
			will-change: translate;
		}

		.submenu-offscreen-prev {
			position: absolute;
			right: 100%;
			top: 0;
		}

		.submenu-offscreen-next {
			position: absolute;
			left: 100%;
			top: 0;
		}
	}


	.label {
		width: 100%;
	}

	.empty {
		--size: 5em;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		margin: 3rem auto;
		max-width: 200px;
		gap: 1em;
	}
</style>
