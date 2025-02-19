<script>
	import ButtonSecondary from './ButtonSecondary.svelte';

	/** @type {import ('./ButtonSecondary.svelte').Props} */
	const { children, ...props } = $props();
</script>

<ButtonSecondary
	{...props}
	--bg="var(--bg-primary)"
	--fg="var(--fg-primary)"
	--bg-hover="var(--bg-dark-primary)"
	--fg-hover="var(--fg-dark-primary)"
>
	{@render children()}
</ButtonSecondary>
