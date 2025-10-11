<script>
	import Operation from './Operation.svelte';

	/**
	 * @type {Omit<import('./Operation.svelte').Props, "operator">}
	 */
	const { lhs, rhs } = $props();
</script>

<Operation operator="+" {lhs} {rhs} />
