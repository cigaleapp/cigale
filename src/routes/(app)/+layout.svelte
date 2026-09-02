<script lang="ts" module>
	export const cancellers = new SvelteMap<string, import('swarpc').CancelablePromise['cancel']>();

	type NavbarAppearance = 'full' | 'hidden';
</script>

<script lang="ts">
	import { watch } from 'runed';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	import { version } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base, resolve } from '$app/paths';
	import { page } from '$app/state';
	import { tables } from '$lib/idb.svelte';
	import { loadPreviewImage } from '$lib/images';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import KeyboardShortcuts from '$lib/KeyboardShortcuts.svelte';
	import { IsMobile } from '$lib/mobile.svelte.js';
	import Modal from '$lib/Modal.svelte';
	import { globalModals } from '$lib/modals.svelte.js';
	import { routeIsIn } from '$lib/paths.js';
	import { initializeProcessingQueue } from '$lib/queue.svelte';
	import { switchSession } from '$lib/sessions';
	import { getColorScheme, isDebugMode, setSetting } from '$lib/settings.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { uiState } from '$lib/uistate.svelte.js';
	import { undo } from '$lib/undo.svelte';
	import { nonnull, pick } from '$lib/utils';

	import ModalCreateCustomNeuralNetwork from './ModalCreateCustomNeuralNetwork.svelte';
	import Navigation from './Navigation.svelte';
	import PrepareForOffline from './PrepareForOffline.svelte';
	import ToastsArea from './ToastsArea.svelte';

	const { children, data } = $props();
	const { swarpc, parallelism } = $derived(data);

	const mobile = new IsMobile();

	initializeProcessingQueue({ swarpc, cancellers, parallelism });

	const navbarAppearance = $derived.by<NavbarAppearance>(() => {
		if (routeIsIn('/(app)/(sidepanel)/o/[observation]')) return 'hidden';
		if (routeIsIn('/(app)/protocols/[id]')) return 'hidden';
		if (routeIsIn('/(app)/capture')) return 'hidden';

		return 'full';
	});

	undo.initialize(100);

	// TODO(2026-01-24) remove at some point
	onMount(() => {
		if (page.url.hash.startsWith('#/')) {
			goto(base + page.url.hash.slice(1));
		}
	});

	export const snapshot = {
		capture() {
			return pick(uiState, 'currentSessionId');
		},
		async restore({ currentSessionId }) {
			await switchSession(currentSessionId);
		},
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
				),
		},
		'i d e v': {
			help: 'Activer/Désactiver le debug mode',
			do: async () => {
				await setSetting('debugMode', isDebugMode() ? false : true);
			},
		},
	});

	defineKeyboardShortcuts('debugmode', {
		'x s': {
			help: 'Show current UI State',
			debug: true,
			allowInModals: true,
			when: isDebugMode,
			do() {
				globalModals.modal_debug_ui_state.open?.();
			},
		},
		...Object.fromEntries(
			(['warn', 'error', 'info', 'debug', 'success'] as const).map((type) => {
				const toastFns = {
					warn: () => toasts.warn(/* @wc-ignore */ 'Example warning toast'),
					error: () => toasts.error(/* @wc-ignore */ 'Example error toast'),
					info: () => toasts.info(/* @wc-ignore */ 'Example info toast'),
					debug: () => toasts.add('debug', /* @wc-ignore */ 'Example debug toast'),
					success: () => toasts.success(/* @wc-ignore */ 'Example success toast'),
				};
				return [
					`x t ${type.charAt(0)}`,
					{
						help: `Summon a ${type} toast`,
						debug: true,
						allowInModals: true,
						when: isDebugMode,
						do: toastFns[type],
					},
				];
			})
		),
	});

	$effect(() => {
		document.documentElement.style.colorScheme = getColorScheme();
	});

	onMount(() => {
		navigator.serviceWorker?.ready.then((registration) => {
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
						action: 'Recharger',
					},
					data: undefined,
					action() {
						location.reload();
					},
				});
			});
		});
	});

	$effect(() => {
		window.setSetting = setSetting;
	});
</script>

<svelte:head>
	<base href={resolve('/') === '/' ? '' : resolve('/') + 'index.html'} />
</svelte:head>

<KeyboardShortcuts
	bind:openHelp={globalModals.modal_keyboard_shortcuts_help.open}
	preventDefault
	binds={uiState.keybinds}
/>

<PrepareForOffline bind:open={globalModals.modal_prepare_for_offline_use.open} />

<ModalCreateCustomNeuralNetwork />

<Modal
	key="modal_debug_ui_state"
	title="UI State"
	bind:open={globalModals.modal_debug_ui_state.open}
>
	<!-- That if is for performance, since {#key uiState} could be expensive -->
	{#if isDebugMode()}
		{#key uiState}
			<pre class="debug-ui-state">{JSON.stringify(uiState.snapshot(), null, 2)}</pre>
		{/key}
	{/if}
</Modal>

<div class="layout" id="app-layout">
	{#if !mobile.current}
		<Navigation
			progressbarOnly={navbarAppearance === 'hidden'}
			progress={uiState.processing.progress}
			eta={uiState.eta}
		/>
	{/if}

	<div id="portal-target-mobile-topbar"></div>

	<ToastsArea />

	<div
		class="contents"
		class:padded={!page.route.id?.includes('/(sidepanel)') &&
			!page.route.id?.includes('protocols/[id]/') &&
			page.route.id !== '/(app)/capture'}
	>
		{@render children?.()}
	</div>

	<div id="portal-target-mobile-bottombar"></div>

	{#if mobile.current}
		<Navigation
			progressbarOnly={navbarAppearance === 'hidden'}
			progress={uiState.processing.progress}
			eta={uiState.eta}
		/>
	{/if}
</div>

<style>
	.contents {
		display: flex;
		flex-direction: column;
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
		gap: 1em;
	}

	.layout {
		display: flex;
		flex-direction: column;
		height: 100svh;
	}

	.debug-ui-state {
		font-size: 0.8rem;
	}
</style>
