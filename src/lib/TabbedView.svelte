<script lang="ts" generics="TabKey extends string">
	import type { Snippet } from 'svelte';

	import { fade } from 'svelte/transition';

	import { onswipe } from './touch/swipes.js';

	type Tab<Key extends TabKey = TabKey> = {
		key: Key;
		name: string;
		scrollable?: boolean;
		/** Tab contents will be re-rendered when this changes */
		rerender?: unknown;
		/** Dont show that tab */
		hidden?: boolean;
	};

	type Snip<Key extends TabKey, Extra extends unknown[] = []> = Snippet<
		[...Extra, Key, { shown: boolean; index: number; tab: Tab<Key> }]
	>;

	type Props = {
		/** Switch tabs by swiping */
		swipeable?: boolean;
		/** Hide the tab bar when there's only one tab listed */
		hideonsingle?: boolean;
		/** Each tab has a key and a name */
		tabs: Tab[];
		/** Content in tab. By default, just `{tab.name}`. Spread `btnattrs` into your <button> element */
		tab?: Snip<TabKey, [btnattrs: { onclick: () => void } & Record<string, unknown>]>;
		/** For the whole tab panel */
		'aria-label': string;
		/** Which tab to start on */
		initially?: TabKey;
		/**
		 * Snippet for tab content.
		 */
		content: Snip<NoInfer<TabKey>>;
	};

	const {
		swipeable = false,
		hideonsingle = false,
		tabs: allTabs,
		initially: _initially,
		tab: tabSnippet,
		'aria-label': arialabel,
		content: contentSnippet,
	}: Props = $props();

	const tabs = $derived(allTabs.filter((tab) => !tab.hidden));
	const initially = $derived(_initially ?? tabs[0]?.key);

	// svelte-ignore state_referenced_locally
	// this is intentioanl, updating of currently
	// when initially changes is handled in conjunction
	// with usermoved, see the $effects below
	let currently = $state<TabKey>(initially);
	let usermoved = $state(false);

	// Reset tab to initial one if it changes,
	// but only if the user didnt explicitly change tabs before
	$effect(() => {
		if (usermoved) return;
		currently = initially;
	});

	// when keeping the current tab when initial changes
	// would result in staying on a now-missing tab,
	// go back to "user didnt move tabs" mode
	$effect(() => {
		if (!tabs.some((tab) => tab.key === currently)) {
			currently = initially;
			usermoved = false;
		}
	});

	const svelteid = $props.id();

	function tabFocusTranslation(key: TabKey) {
		return `calc(${-1 * tabs.findIndex((t) => t.key === key)} * 100lvw) 0px`;
	}

	function previousSlide() {
		usermoved = true;
		const currentIndex = tabs.findIndex((t) => t.key === currently);
		currently = tabs[Math.max(0, currentIndex - 1)].key;
	}

	function nextSlide() {
		usermoved = true;
		const currentIndex = tabs.findIndex((t) => t.key === currently);
		currently = tabs[Math.min(tabs.length - 1, currentIndex + 1)].key;
	}

	let translate = $derived(tabFocusTranslation(currently));

	let tablistheight = $state<number>();
</script>

<div
	class="tabbedview"
	aria-label={arialabel}
	style:--tablist-height="{tablistheight}px"
	class:swipeable
	class:hide-tablist={tabs.length === 1 && hideonsingle}
>
	<div role="tablist" bind:clientHeight={tablistheight}>
		{#each tabs as tab, i (tab.key)}
			{const selected = $derived(currently === tab.key)}
			<div class="tab-wrapper" transition:fade={{ duration: 100 }} class:selected>
				{const btnattrs = $derived({
					onclick: () => {
						currently = tab.key;
					},
					role: 'tab',
					'aria-selected': selected ? 'true' : 'false',
					'aria-controls': `${svelteid}-panel`,
				})}

				<div class="inner">
					{#if tabSnippet}
						{@render tabSnippet(btnattrs, tab.key, {
							index: i,
							tab,
							shown: tab.key === currently,
						})}
					{:else}
						<button {...btnattrs}>
							{tab.name}
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<div
		role="tabpanel"
		id="{svelteid}-panel"
		{@attach onswipe('horizontal', ({ direction }) => {
			if (!swipeable) return;
			if (direction === 'left') nextSlide();
			if (direction === 'right') previousSlide();
		})}
	>
		{#each tabs as tab, i (tab.key)}
			<div
				class="inner"
				class:scrollable={tab.scrollable}
				class:visible={currently === tab.key}
				data-tab-key={tab.key}
				style:--i={i}
				style:translate
			>
				{#key tab.rerender}
					{@render contentSnippet(tab.key, {
						index: i,
						tab,
						shown: tab.key === currently,
					})}
				{/key}
			</div>
		{/each}
	</div>
</div>

<style>
	.tabbedview {
		height: 100%;
	}

	[role='tablist'] {
		display: flex;
		flex-wrap: nowrap;
		overflow-x: auto;
		font-size: 0.8rem;
	}

	.tabbedview.hide-tablist [role='tablist'] {
		display: none;
	}

	.tab-wrapper {
		padding: 1em;
		min-width: 4em;
		min-height: 2em;

		&:not(.selected) .inner {
			color: var(--gray);
			transition: color 100ms;
		}
	}

	[role='tabpanel'] {
		display: flex;
		height: 100%;
		position: relative;
		touch-action: none;

		.inner {
			flex-shrink: 0;
			width: 100lvw;
			overflow-x: hidden;
			position: absolute;
			left: calc(var(--i) * 100lvw);
			height: calc(100% - var(--tablist-height));

			transition: translate 200ms ease;
		}

		.inner.scrollable {
			overflow: auto;
		}

		.inner:not(.scrollable) {
			overflow: hidden;
		}
	}

	.tabbedview.swipeable [role='tabpanel'] .inner {
		overflow-x: hidden;
	}
</style>
