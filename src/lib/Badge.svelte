<script lang="ts">
	import { tooltip } from './tooltips';

	/**
	 * @typedef {object} Props
	 * @property {import('svelte').Snippet} children
	 * @property {string} [tooltip] optional tooltip text
	 */

	/** @type {Props} */
	let { children, tooltip: tooltipText } = $props();
</script>

<div class="badge" use:tooltip={tooltipText}>
	{@render children()}
</div>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.1em 0.4em;
		border-radius: 999999px;
		font-size: 0.75em;
		font-weight: 600;
		color: var(--fg-primary);
		border: 1px solid var(--fg-primary);
	}
</style>
