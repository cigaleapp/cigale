<script lang="ts" module>
	const [getTheme, setTheme] = createContext<Theme>();

	export { getTheme };
</script>

<script lang="ts">
	import '$lib/tippy-svg-arrow.css';
	import './style.css';

	import { App as CapacitorApp } from '@capacitor/app';
	import { SplashScreen } from '@capacitor/splash-screen';
	import { createContext } from 'svelte';

	import { goto } from '$app/navigation';
	import { match, resolve } from '$app/paths';
	import { Theme } from '$lib/colorscheme.svelte';
	import { uiState } from '$lib/state.svelte';
	import { fadeOutElement } from '$lib/utils';

	const { children } = $props();

	setTheme(new Theme());

	$effect(() =>
		fadeOutElement('#loading', 250, {
			firstTimeDuration: 1_000,
		})
	);

	// Just in case we're on a page that's not in the (app) layout
	// See also file://./(app)/+layout.js
	$effect(() => {
		void SplashScreen.hide();
	});

	$effect(() => {
		// Source - https://stackoverflow.com/a/69084017
		// Posted by Siyahul Haq, modified by community. See post 'Timeline' for change history
		// Retrieved 2026-05-03, License - CC BY-SA 4.0

		CapacitorApp.addListener('backButton', ({ canGoBack }) => {
			if (!canGoBack) {
				CapacitorApp.exitApp();
			} else {
				window.history.back();
			}
		});

		// https://capacitorjs.com/docs/guides/deep-links#react
		CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
			const route = await match(url);
			if (!route) {
				console.warn(`No route matched URL: ${url}`);
				return;
			}

			console.info(
				`Deep link opened: ${url}, matched route: ${route.id} with params ${JSON.stringify(route.params)}`
			);

			// @ts-expect-error
			await goto(resolve(route.id, route.params), { replaceState: true });
		});
	});
</script>

<svelte:window
	{@attach (window) => {
		window.uiState = uiState;
	}}
	{@attach (window) => {
		// @ts-expect-error
		window.nativeWindow?.setControlsColor(
			getComputedStyle(document.documentElement).getPropertyValue('--fg-primary')
		);
	}}
/>

{@render children?.()}

<style>
	:global(*) {
		scrollbar-width: thin;
	}

	:global(body) {
		display: flex;
		flex-direction: column;
		height: 100vh;
		-webkit-tap-highlight-color: transparent;

		@media (max-width: 600px) {
			overflow: hidden;
		}
	}

	:global(body, input, textarea, button, dialog) {
		background-color: var(--bg-neutral);
		color: var(--fg-neutral);
	}

	:global(::placeholder) {
		color: var(--gay);
	}

	:global(a, a:visited) {
		color: inherit;
	}

	:global(a:hover) {
		color: var(--fg-primary);
	}

	:global(body) {
		font-family: var(--font-regular);
	}

	:global(input, textarea, button) {
		font-family: inherit;
	}

	:global(button) {
		border: none;
		cursor: pointer;
	}

	:global(code, pre, code a, code input) {
		font-family: var(--font-mono);
		font-weight: 260;
	}

	:global(svg.icon) {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
	}

	/* Tippy.js (see https://atomiks.github.io/tippyjs/v6/themes/#tippy-elements) */
	:global([data-tippy-root] .tippy-box) {
		background: var(--bg-neutral) !important;
		color: var(--fg-neutral);
		border-radius: var(--corner-radius);
		border: 1px solid var(--fg-neutral);
	}

	:global([data-tippy-root]) {
		/* Position tooltips above bits-ui comboboxes (and other flyouts) */
		z-index: 100000 !important;
	}

	/* :global([data-tippy-root] .tippy-content) {
		word-break: break-all;
	} */

	:global([data-tippy-root] .tippy-box > .tippy-svg-arrow) {
		fill: var(--bg-neutral) !important;
		stroke: var(--fg-neutral);
		stroke-width: 1px;
	}

	:global(textarea) {
		resize: vertical;
		border: 1px solid var(--gay);
		border-radius: var(--corner-radius);
		padding: 0.5em;
		width: 100%;
		max-width: 70rem;
	}

	:global(details) {
		--transition-duration: 0.2s;

		@supports (interpolate-size: allow-keywords) {
			@media (prefers-reduced-motion: no-preference) {
				interpolate-size: allow-keywords;
			}

			&::details-content {
				opacity: 0;
				block-size: 0;
				overflow-y: clip;
				transition:
					content-visibility var(--transition-duration) allow-discrete,
					opacity var(--transition-duration) ease,
					block-size var(--transition-duration) ease;
			}

			&:open::details-content {
				opacity: 1;
				block-size: auto;
			}
		}
	}
</style>
