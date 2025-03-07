<script>
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import KeyboardShortcuts from '$lib/KeyboardShortcuts.svelte';
	import Toast from '$lib/Toast.svelte';
	import { tables } from '$lib/idb.svelte';
	import { combineMetadataValues, storeMetadataValue } from '$lib/metadata';
	import { toasts } from '$lib/toasts.svelte';
	import { onMount } from 'svelte';
	import Navigation from './Navigation.svelte';
	import PreviewSidePannel from './PreviewSidePannel.svelte';
	import { uiState } from './inference/state.svelte';

	import './style.css';
	import { mergeToObservation } from '$lib/observations';

	const { children } = $props();

	onMount(() => {
		uiState.keybinds['$mod+m'] = {
			help: 'Fusionner les observations sélectionnées',
			do() {
				alert('todo!');
			}
		};
	});

	export const snapshot = {
		capture() {
			const selection = $state.snapshot(uiState.selection);
			return { selection };
		},
		restore({ selection }) {
			uiState.selection = selection;
		}
	};

	const showSidePanel = $derived(!['/about', '/settings'].includes(page.route.id));

	const selectedHrefs = $derived(
		uiState.selection.map((id) => uiState.previewURLs.get(id)).filter((href) => href !== undefined)
	);

	const selectedImages = $derived(
		uiState.selection
			.map((id) => tables.Image.state.find((i) => i.id === id))
			.filter((img) => img !== undefined)
	);
</script>

<Navigation hasImages={true} progress={uiState.processing.progress}></Navigation>

<svelte:head>
	<base href={base ? `${base}/index.html` : ''} />
</svelte:head>

<KeyboardShortcuts preventDefault binds={uiState.keybinds} />

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

<div class="main-and-sidepanel" class:has-sidepanel={showSidePanel}>
	<main>{@render children?.()}</main>
	{#if showSidePanel}
		<PreviewSidePannel
			images={selectedHrefs}
			metadata={combineMetadataValues(selectedImages)}
			onmerge={async () => {
				await mergeToObservation(uiState.selection);
			}}
			onaddmetadata={() => {}}
			onmetadatachange={async (id, value) => {
				await Promise.all(
					selectedImages.map(async (image) => {
						storeMetadataValue({
							subjectId: image.id,
							metadataId: id,
							confidence: 1,
							value
						});
					})
				);
			}}
			allowmerge
		/>
	{/if}
</div>

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

	.main-and-sidepanel {
		height: 100%;
		display: flex;
		overflow: hidden;
	}

	.main-and-sidepanel:not(.has-sidepanel) main {
		width: 100%;
	}

	main {
		display: flex;
		flex-direction: column;
		gap: 1em;
		height: 100%;
		flex-grow: 1;
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

	.navbar {
		position: fixed;
		z-index: 100;
		width: 100%;
		height: fit-content;
	}

	.container {
		margin-left: auto;
		margin-right: 0;
		display: flex;
		flex-direction: column;
		position: fixed;
		top: 0;
		z-index: 100;
	}

	:global(code, pre) {
		font-family: 'Fira Code', monospace;
	}
</style>
