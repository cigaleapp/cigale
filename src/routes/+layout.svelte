<script>
	import { base } from '$app/paths';
	import { setContext } from 'svelte';
	import { toasts } from '$lib/toasts.svelte';
	import Toast from '$lib/Toast.svelte';

	import './style.css';
	import PreviewSidePannel from './PreviewSidePannel.svelte';

	const { children } = $props();

	// TODO get value from DB
	setContext('showSwitchHints', true);
	let img = 'https://letsenhance.io/static/73136da51c245e80edc6ccfe44888a99/1015f/MainBefore.jpg';
	let sexe = 0;
	let date = 0;
	let metaValue = $state([sexe, date]);
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

<PreviewSidePannel
	images={[img, img, img, img, img, img, img, img, img, img, img]}
	metaNom={['sexe', 'heure']}
	metaType={['enumeration', 'date']}
	bind:metaValue
	metaOptions={[['male', 'femelle'], []]}
></PreviewSidePannel>
<button
	onclick={() => {
		console.log(sexe);
	}}>wesh</button
>
{sexe}
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
