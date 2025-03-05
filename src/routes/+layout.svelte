<script>
	import { base } from '$app/paths';
	import Toast from '$lib/Toast.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { setContext } from 'svelte';

	import './style.css';
	import Navigation from './Navigation.svelte';

	const { children, data } = $props();

	setContext('showSwitchHints', data.showInputHints);
</script>

<Navigation hasImages={true}></Navigation>

<svelte:head>
	<base href={base ? `${base}/index.html` : ''} />
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

<main>{@render children?.()}</main>

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
		z-index: 1000;
	}

	main {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow-y: scroll;
	}

	:global(body) {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	:global(*) {
		font-family: 'Host Grotesk', sans-serif;
	}
</style>
