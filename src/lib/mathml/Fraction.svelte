<script>
	import Atom from './Atom.svelte';

	/**
	 * @typedef {object} Props
	 * @property {import('svelte').Snippet | string} numerator
	 * @property {import('svelte').Snippet | string} denominator
	 */

	/** @type {Props} */
	const { numerator, denominator } = $props();
</script>

<mfrac>
	{#if typeof numerator === 'string'}
		<Atom expr={numerator} />
	{:else}
		{@render numerator()}
	{/if}
	{#if typeof denominator === 'string'}
		<Atom expr={denominator} />
	{:else}
		{@render denominator()}
	{/if}
</mfrac>
