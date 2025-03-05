<script>
	import { base } from '$app/paths';
	import Toast from '$lib/Toast.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { setContext } from 'svelte';

	import './style.css';
	import Navigation from './Navigation.svelte';
	import PreviewSidePannel from './PreviewSidePannel.svelte';

	const { children, data } = $props();

	setContext('showSwitchHints', data.showInputHints);
	let img = 'https://letsenhance.io/static/73136da51c245e80edc6ccfe44888a99/1015f/MainBefore.jpg';
	let sexe = 0;
	let date = 0;
	let metaValue = $state([sexe, date]);
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
