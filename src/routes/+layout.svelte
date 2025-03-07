<script>
	import { base } from '$app/paths';
	import Toast from '$lib/Toast.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { setContext } from 'svelte';
	import Navigation from './Navigation.svelte';
	import PreviewSidePannel from './PreviewSidePannel.svelte';
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
	let img = 'https://letsenhance.io/static/73136da51c245e80edc6ccfe44888a99/1015f/MainBefore.jpg';
	let sexe = 0;
	let date = 0;
	let metaValue = $state([sexe, date]);
</script>

<Navigation hasImages={true} progress={uiState.processing.progress}></Navigation>

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
<PreviewSidePannel
	images={[img, img, img, img, img, img, img, img, img, img, img]}
	metaNom={['sexe', 'date']}
	metaType={['enumeration', 'date']}
	bind:metaValue
	metaOptions={[['male', 'femelle'], []]}
	clickFusion={() => {}}
	clickAddMeta={() => {}}
	showFusion="true"
/>

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

	:global(body) {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	:global(*) {
		font-family: 'Host Grotesk', sans-serif;
	}

	:global(code, pre) {
		font-family: 'Fira Code', monospace;
	}
</style>
