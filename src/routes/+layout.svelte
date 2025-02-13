<script>
	import { base } from '$app/paths';
	import { setContext } from 'svelte';
	import { toasts } from '$lib/toasts.svelte';
	import Toast from '$lib/Toast.svelte';

	import './style.css';

	const { children } = $props();

	// TODO get value from DB
	setContext('showSwitchHints', true);
</script>

<svelte:head>
	<base href={base} />
</svelte:head>

<section class="toasts">
	{#each toasts.items as toast (toast.id)}
		<Toast
			{...toast}
			action={toast.labels.action}
			dismiss={toast.labels.close}
			onaction={() => {
				toast.callbacks?.action?.(toast);
			}}
			ondismiss={() => {
				toasts.remove(toast.id);
			}}
		/>
	{/each}
</section>

{@render children?.()}

<style>
	.toasts {
		position: fixed;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1em;
		bottom: 1em;
		left: 0;
		right: 0;
	}

	:global(*) {
		font-family: 'Host Grotesk', sans-serif;
	}
</style>
