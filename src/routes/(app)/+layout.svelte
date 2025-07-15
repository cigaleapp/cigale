<script>
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import KeyboardShortcuts from '$lib/KeyboardShortcuts.svelte';
	import { watch } from 'runed';
	import Toast from '$lib/Toast.svelte';
	import * as db from '$lib/idb.svelte';
	import { tables } from '$lib/idb.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import { getSettings } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { nonnull, pick } from '$lib/utils';
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

	const imageFileIds = $derived(tables.Image.state.map((image) => image.fileId).filter(nonnull));

	// Ensure every image has a preview URL at all times
	watch(
		() => imageFileIds,
		(imageFileIds) => {
			// https://github.com/sveltejs/svelte/issues/9520#issuecomment-1817092724
			for (const fileId of imageFileIds) {
				void (async () => {
					if (uiState.hasPreviewURL(fileId)) return;
					const file = await db.get('ImagePreviewFile', fileId);
					if (!file) return;
					const blob = new Blob([file.bytes], { type: file.contentType });
					uiState.setPreviewURL(fileId, URL.createObjectURL(blob));
				})();
			}
		}
	);

	defineKeyboardShortcuts({
		'$mod+s': {
			help: '',
			hidden: true,
			do: () => {
				toasts.info('Pas besoin de Ctrl-S, vos changements sont sauvegardés automatiquement 😎');
			}
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

<section class="toasts" data-testid="toasts-area">
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
	class:padded={!page.route.id?.includes('/(sidepanel)') &&
		page.route.id !== '/(app)/crop/[image]' &&
		!page.route.id?.includes('protocols/[id]/')}
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
