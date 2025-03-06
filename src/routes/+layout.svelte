<script>
	import { base } from '$app/paths';
	import Toast from '$lib/Toast.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { setContext } from 'svelte';
	import Navigation from './Navigation.svelte';
	import { uiState } from './inference/state.svelte';

	import './style.css';

	const { children, data } = $props();

	export const snapshot = {
		capture() {
			const captured = $state.snapshot(uiState);
			return { selection: captured.selection };
		},
		restore({ selection }) {
			uiState.selection = selection;
		}
	};

	setContext('showSwitchHints', data.showInputHints);
</script>

<Navigation hasImages={true}></Navigation>

<div class="global-progress-bar" class:inactive={[0, 1].includes(uiState.processing.progress)}>
	<div class="completed" style:width="{uiState.processing.progress * 100}%"></div>
</div>

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
		gap: 1em;
		height: 100%;
		overflow-y: scroll;
		padding: 1.2em;
	}

	.global-progress-bar.inactive {
		opacity: 0;
		transition: opacity 1s;
	}

	.global-progress-bar {
		width: 100%;
		height: 0.25rem;
	}

	.global-progress-bar .completed {
		height: 100%;
		background: var(--fg-primary);
		transition: width 0.5s;
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
