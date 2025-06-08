<script>
	/**
	 * @import { Snippet } from 'svelte';
	 *
	 * @typedef {object} Props
	 * @property {string | Snippet} label
	 * @property {string | Snippet} [hint]
	 * @property {Snippet} children
	 */

	/** @type {Props} */
	const { label, hint, children } = $props();
</script>

<div class="field">
	<label>
		<div class="label">
			{#if typeof label === 'string'}
				{label}
			{:else}
				{@render label()}
			{/if}
		</div>
		{@render children()}
	</label>
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
