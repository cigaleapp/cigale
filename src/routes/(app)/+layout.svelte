<script module>
	/**
	 * @type {Map<string, import("swarpc").CancelablePromise["cancel"]>}
	 */
	export const cancellers = new SvelteMap();

	/**
	 * @typedef {'full' | 'hidden'} NavbarAppearance
	 */
	let _navbarAppearance = $state('full');

	/**
	 * Set navbar appearance for the page or layout, until unmounted.
	 * Uses `onMount` and `onDestroy` internally.
	 * @param {NavbarAppearance} appearance
	 */
	export function navbarAppearance(appearance) {
		$effect(() => {
			_navbarAppearance = appearance;
			return () => {
				_navbarAppearance = 'full';
			};
		});
	}
</script>

<script>
	import { watch } from 'runed';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	import { version } from '$app/environment';
	import { page } from '$app/state';
	import { tables } from '$lib/idb.svelte';
	import { loadPreviewImage } from '$lib/images';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import KeyboardShortcuts from '$lib/KeyboardShortcuts.svelte';
	import { resolve } from '$lib/paths';
	import { initializeProcessingQueue } from '$lib/queue.svelte';
	import { switchSession } from '$lib/sessions';
	import { getColorScheme, isDebugMode, setSetting } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte';
	import Toast from '$lib/Toast.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { undo } from '$lib/undo.svelte';
	import { nonnull, pick } from '$lib/utils';

	import Navigation from './Navigation.svelte';
	import PrepareForOffline from './PrepareForOffline.svelte';

	const { children, data } = $props();
	const { swarpc, parallelism } = $derived(data);

	initializeProcessingQueue({ swarpc, cancellers, parallelism });

	undo.initialize(100);

	export const snapshot = {
		capture() {
			return pick(uiState, 'currentSessionId');
		},
		async restore({ currentSessionId }) {
			await switchSession(currentSessionId);
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
					await loadPreviewImage(fileId);
				})();
			}
		}
	);

	defineKeyboardShortcuts('general', {
		'$mod+s': {
			help: '',
			hidden: true,
			do: () =>
				toasts.info(
					'Pas besoin de Ctrl-S, vos changements sont sauvegardés automatiquement 😎'
				)
		},
		'i d e v': {
			help: 'Activer/Désactiver le debug mode',
			do: async () => {
				await setSetting('showTechnicalMetadata', isDebugMode() ? false : true);
			}
		}
	});

	defineKeyboardShortcuts(
		'debugmode',
		Object.fromEntries(
			/**@type{const}*/ (['warn', 'error', 'info', 'debug', 'success']).map((type) => {
				const toastFns = {
					warn: () => toasts.warn(/* @wc-ignore */ 'Example warning toast'),
					error: () => toasts.error(/* @wc-ignore */ 'Example error toast'),
					info: () => toasts.info(/* @wc-ignore */ 'Example info toast'),
					debug: () => toasts.add('debug', /* @wc-ignore */ 'Example debug toast'),
					success: () => toasts.success(/* @wc-ignore */ 'Example success toast')
				};
				return [
					`t t ${type.charAt(0)}`,
					{
						help: `Summon a ${type} toast`,
						debug: true,
						allowInModals: true,
						when: isDebugMode,
						do: toastFns[type]
					}
				];
			})
		)
	);

	$effect(() => {
		document.documentElement.style.colorScheme = getColorScheme();
	});

	onMount(() => {
		navigator.serviceWorker.ready.then((registration) => {
			const installedVersion = localStorage.getItem('sw-version');

			if (installedVersion !== version) {
				localStorage.setItem('sw-version', version);
				toasts.info('L’application a été mise à jour.');
			}

			registration.addEventListener('updatefound', () => {
				// TODO remove
				console.info('Update found in service worker');
				toasts.info('Une mise à jour est disponible.', {
					lifetime: Infinity,
					labels: {
						action: 'Recharger'
					},
					action() {
						location.reload();
					}
				});
			});
		});
	});

	/** @type {undefined|(() => void)} */
	let openKeyboardShortcuts = $state();
	/** @type {undefined|(() => void)} */
	let openPrepareForOfflineUse = $state();
</script>

<svelte:head>
	<base href={resolve('/') === '/' ? '' : resolve('/') + 'index.html'} />
</svelte:head>

<KeyboardShortcuts bind:openHelp={openKeyboardShortcuts} preventDefault binds={uiState.keybinds} />
<PrepareForOffline bind:open={openPrepareForOfflineUse} />

<Navigation
	{openKeyboardShortcuts}
	{openPrepareForOfflineUse}
	progressbarOnly={_navbarAppearance === 'hidden'}
	progress={uiState.processing.progress}
	eta={uiState.eta}
/>

<section class="toasts" data-testid="toasts-area">
	{#each toasts.items('default') as toast (toast.id)}
		<Toast
			{...toast}
			action={toast.labels.action}
			dismiss={toast.labels.close}
			onaction={toast.callbacks.action instanceof URL
				? toast.callbacks.action
				: async () => toast.callbacks.action?.(toast)}
			ondismiss={async () => {
				await toast.callbacks.closed?.(toast);
				toasts.remove(toast.id);
			}}
		/>
	{/each}
</section>

<div
	class="contents"
	class:padded={!page.route.id?.includes('/(sidepanel)') &&
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
