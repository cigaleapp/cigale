<script>
	import ButtonSecondary from './ButtonSecondary.svelte';

	/** @type {import ('./ButtonSecondary.svelte').Props} */
	const { children: grandchildren, ...props } = $props();
</script>

<ButtonSecondary
	{...props}
	--bg="var(--bg-primary)"
	--fg="var(--fg-primary)"
	--bg-hover="var(--bg-dark-primary)"
	--fg-hover="var(--fg-dark-primary)"
>
	{#snippet children(params)}
		{@render grandchildren(params)}
	{/snippet}
</ButtonSecondary>
