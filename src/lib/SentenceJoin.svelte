<script generics="T">
	import { m } from './paraglide/messages';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {T[]} items
	 * @property {string} [final="et"] the final word to display in the sentence
	 * @property {(item: T, index: number) => string|number} [key] the key to use for each item in the list. If not provided, the index is used as the key.
	 * @property {import('svelte').Snippet<[T, number]>} children the children to display in the sentence. Gets the item and its index as parameters
	 */

	/** @type {Props} */
	const { final = m.sentence_join_and(), items, children, key = (_, i) => i } = $props();
</script>

{#each items as item, i (key(item, i))}
	{@render children(item, i)}{#if i < items.length - 2},&nbsp;
	{:else if i === items.length - 2}
		&nbsp;{final}&nbsp;
	{/if}
{/each}
