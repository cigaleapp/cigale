<script module>
	/**
	 * @typedef {object} Props
	 * @property {"+"|"-"|"*"|"="} operator
	 * @property {import('svelte').Snippet | string} lhs
	 * @property {import('svelte').Snippet | string} rhs
	 */
</script>

<script>
	import Atom from './Atom.svelte';

	/** @type {Props} */
	const { operator, lhs, rhs } = $props();
</script>

{#if typeof lhs === 'string'}
	<Atom expr={lhs} />
{:else}
	{@render lhs()}
{/if}

<mo>
	{#if operator === '*'}
		&middot;
	{:else}
		{operator}
	{/if}
</mo>

{#if typeof rhs === 'string'}
	<Atom expr={rhs} />
{:else}
	{@render rhs()}
{/if}
