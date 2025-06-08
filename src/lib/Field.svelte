<script>
	/**
	 * @import { Snippet } from 'svelte';
	 *
	 * @typedef {object} Props
	 * @property {string | Snippet} label
	 * @property {string | Snippet} [hint]
	 * @property {boolean} [composite=false] if true, the children will not be wrapped in a label element. useful when the children is composed of multiple inputs.
	 * @property {Snippet} children
	 */

	/** @type {Props} */
	const { label, hint, children, composite } = $props();
</script>

<div class="field">
	<svelte:element this={composite ? 'div' : 'label'}>
		<div class="label">
			{#if typeof label === 'string'}
				{label}
			{:else}
				{@render label()}
			{/if}
		</div>
		{@render children()}
	</svelte:element>
	{#if hint}
		<div class="hint">
			{#if typeof hint === 'string'}
				{hint}
			{:else}
				{@render hint()}
			{/if}
		</div>
	{/if}
</div>

<style>
	.field .label {
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: bold;
		font-size: 0.9em;
	}
</style>
