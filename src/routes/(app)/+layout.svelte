<script>
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import KeyboardShortcuts from '$lib/KeyboardShortcuts.svelte';
	import Toast from '$lib/Toast.svelte';
	import * as db from '$lib/idb.svelte';
	import { tables } from '$lib/idb.svelte';
	import { imageIdToFileId } from '$lib/images';
	import { getSettings } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { pick } from '$lib/utils';
	import Navigation from './Navigation.svelte';

	const { children } = $props();

	export const snapshot = {
		capture() {
			return pick(uiState, 'currentProtocolId');
		},
		restore({ currentProtocolId }) {
			uiState.currentProtocolId = currentProtocolId;
		}
	};

	// Ensure every image has a preview URL at all times
	$effect(() => {
		for (const image of tables.Image.state) {
			if (uiState.hasPreviewURL(image)) continue;
			void (async () => {
				const file = await db.get('ImagePreviewFile', imageIdToFileId(image.id));
				if (!file) return;
				const blob = new Blob([file.bytes], { type: image.contentType });
				uiState.setPreviewURL(image, URL.createObjectURL(blob));
			})();
		}
	});

	const settings = $derived(getSettings());

	$effect(() => {
		document.documentElement.dataset.theme = settings.theme;
	});

	/** @type {undefined|(() => void)} */
	let openKeyboardShortcuts = $state();
</script>

<Navigation {openKeyboardShortcuts} progress={uiState.processing.progress} />

<svelte:head>
	<base href={base ? `${base}/index.html` : ''} />
</svelte:head>

<KeyboardShortcuts bind:openHelp={openKeyboardShortcuts} preventDefault binds={uiState.keybinds} />

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

<div
	class="contents"
	class:padded={!page.route.id?.includes('/(sidepanel)') && page.route.id !== '/(app)/crop/[image]'}
>
	{@render children?.()}
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

	.contents {
		display: flex;
		flex-direction: column;
		gap: 1em;
		height: 100%;
		width: 100%;
		flex-grow: 1;
		scrollbar-color: var(--gray) transparent;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		overflow-y: auto;
	}

	.contents.padded {
		padding: 1.2em;
	}
</style>
