<script lang="ts" generics="D">
	import type { Snippet } from 'svelte';

	import IconMore from '~icons/ri/arrow-right-s-line';

	import Submenu from './Submenu.svelte';

	type Item<D> = {
		label: string;
		data: D;
		submenu?: Item<D>[];
	};

	interface Props {
		items: Item<D>[];
		item: Snippet<[D, Item<D>]>;
	}

	const { items, item: itemSnippet }: Props = $props();
</script>

<div class="submenu">
	{#each items as item (item.label)}
		<div class="item">
			<div class="label">
				{@render itemSnippet(item.data, item)}
			</div>
			{#if item.submenu}
				<div class="icon-more">
					<IconMore />
				</div>
				<Submenu item={itemSnippet} items={item.submenu} />
			{/if}
		</div>
	{/each}
</div>
