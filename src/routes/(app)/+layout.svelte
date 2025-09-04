<script module>
	/**
	 * @type {Map<string, import("swarpc").CancelablePromise["cancel"]>}
	 */
	export const cancellers = new SvelteMap();
</script>

<script>
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import KeyboardShortcuts from '$lib/KeyboardShortcuts.svelte';
	import Toast from '$lib/Toast.svelte';
	import * as db from '$lib/idb.svelte';
	import { tables } from '$lib/idb.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { initializeProcessingQueue } from '$lib/queue.svelte';
	import { getSettings } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { nonnull, pick } from '$lib/utils';
	import { watch } from 'runed';
	import { SvelteMap } from 'svelte/reactivity';
	import Navigation from './Navigation.svelte';

	const { children, data } = $props();

	initializeProcessingQueue(data.swarpc, cancellers);

	export const snapshot = {
		capture() {
			return pick(uiState, 'currentProtocolId');
		},
		restore({ currentProtocolId }) {
			uiState.setCurrentProtocolId(currentProtocolId);
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

	defineKeyboardShortcuts('general', {
		'$mod+s': {
			help: '',
			hidden: true,
			do: () => toasts.info(m.no_need_for_ctrl_s())
		},
		...Object.fromEntries(
			/**@type{const}*/ (['w', 'e', 'i', 'd', 's']).map((type) => {
				const toastFns = {
					w: () => toasts.warn('Example warning toast'),
					e: () => toasts.error('Example error toast'),
					i: () => toasts.info('Example info toast'),
					d: () => toasts.add('debug', 'Example debug toast'),
					s: () => toasts.success('Example success toast')
				};
				return [
					`t t ${type}`,
					{
						help: '',
						hidden: true,
						allowInModals: true,
						when: () => getSettings().showTechnicalMetadata,
						do: toastFns[type]
					}
				];
			})
		)
	});

	const settings = $derived(getSettings());

	$effect(() => {
		document.documentElement.dataset.theme = settings.theme;
	});

	/** @type {undefined|(() => void)} */
	let openKeyboardShortcuts = $state();
</script>

<Navigation swarpc={data.swarpc} {openKeyboardShortcuts} progress={uiState.processing.progress} />

<svelte:head>
	<base href={base ? `${base}/index.html` : ''} />
</svelte:head>

<KeyboardShortcuts bind:openHelp={openKeyboardShortcuts} preventDefault binds={uiState.keybinds} />

<section class="toasts" data-testid="toasts-area">
	{#each toasts.items('default') as toast (toast.id)}
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
