<script>
	/**
	 * @typedef {object} Props
	 * @property {import('svelte').Snippet} children
	 * @property {"()" | "[]" | "{}"} with
	 */

	/** @type {Props} */
	const { children, with: brackets = '()' } = $props();
</script>

<mo fence="true" form="prefix">{brackets[0]}</mo>
<mrow>
	{@render children()}
</mrow>
<mo fence="true" form="postfix">{brackets[1]}</mo>
