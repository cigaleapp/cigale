<script>
	/**
	 * @type {{ children: import('svelte').Snippet }}
	 */
	const { children } = $props();
</script>

<mrow>
	{@render children()}
</mrow>
