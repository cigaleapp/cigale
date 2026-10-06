<!-- 
@component

A secondary button component.

Available CSS variables:

- **`--bg`**: background color
- **`--fg`**: text color
- **`--bg-hover`**: background color on hover
- **`--fg-hover`**: text color on hover
- **`--bg-disabled`**: background color when disabled
- **`--fg-disabled`**: text color when disabled
 
-->

<script lang="ts" module>
	import type { PlaywrightTestId } from '$e2e/testids.js';
	import type { Snippet } from 'svelte';

	type OnclickSignals = {
		/** Sets the button's displayed text. */
		// eslint-disable-next-line no-unused-vars
		setText: (text: string) => void;
		/** Marks the beginning of the loading state. */
		loadingStarted: () => void;
		/** Marks the end of the loading state. */
		loadingEnded: () => void;
	};

	export interface Props {
		/** The button's content. */
		children: Snippet<[{ loading: boolean }]>;
		/** Handles clicks on the button. */
		// eslint-disable-next-line no-unused-vars
		onclick: undefined | ((e: MouseEvent, signals: OnclickSignals) => Promise<void> | void);
		/** Disables the button. */
		disabled?: boolean;
		/** Limits the button height, hides the keyboard hint in a tooltip, and prevents automatically appending a spinner while loading. */
		tight?: boolean;
		/** Tooltip content for the button. */
		help?: Parameters<typeof tooltip>[1];
		/** Keyboard shortcut hint to display. */
		keyboard?: string;
		/** Attribute used by Playwright's getByTestId. */
		testid?: PlaywrightTestId | undefined;
		/** Indicates whether the button is pressed. */
		'aria-pressed'?: boolean;
		/** Accessible label for the button. */
		'aria-label'?: string;
		/** Shows a loading state while the click handler is running; use "always" to always show it. */
		loading?: boolean | 'always';
		/** Prefix for the error toast shown when the click handler fails. */
		errorprefix?: string;
		/** Success toast shown when the click handler succeeds. */
		onclicksuccess?: string;
		/** Uses a red color scheme for dangerous actions. */
		danger?: boolean;
		/** Disables the border except on hover or focus. */
		subtle?: boolean;
		/** Makes the button act as a submit button in a form context. */
		submits?: boolean;
	}
</script>

<script lang="ts">
	import { errorMessage } from '$lib/i18n.js';
	import { toasts } from '$lib/toasts.svelte.js';

	import { hasPhysicalKeyboard } from './keyboard.svelte';
	import KeyboardHint from './KeyboardHint.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import ProgressBar from './ProgressBar.svelte';
	import { tooltip } from './tooltips.js';

	let {
		children,
		onclick,
		disabled = false,
		danger = false,
		subtle = false,
		errorprefix = '',
		onclicksuccess = '',
		help,
		keyboard,
		submits,
		testid,
		loading = false,
		tight = false,
		...aria
	}: Props = $props();

	let isLoading = $state(false);

	const keyboardHintIsInTooltip = $derived(
		help && (typeof help === 'string' ? keyboard : 'keyboard' in help)
	);

	let onclickTextOverride = $state('');

	let loadingProgress = $state<number | null>(null);

	/** Width of button, to lock the button width while loading (when content can possible change width) */
	let width = $state(0);
</script>

<!-- 
	We wrap the button in a div because tooltips wont show on disabled buttons 
	(and sometimes the tooltip is there to tell you *why* the button is disabled so... it's pretty important) 

	We set data-tooltip-content on the button itself so that E2E tests can still find the tooltip's contents (climbing up the DOM isnt possible with Playwright)
 -->
<div
	class="tooltip-container"
	use:tooltip={typeof help === 'string' && keyboard ? { text: help, keyboard } : help}
>
	<div class="progress">
		{#if loadingProgress !== null}
			<ProgressBar progress={loadingProgress} />
		{/if}
	</div>

	<button
		{...aria}
		data-tooltip-content={typeof help === 'string'
			? help
			: Array.isArray(help)
				? help[0]
				: `${help?.text} ${help?.keyboard ?? ''}`}
		type={submits ? 'submit' : 'button'}
		disabled={disabled || isLoading}
		class:tight
		class:danger
		class:subtle
		class:loading={isLoading}
		style:width={isLoading ? `${width}px` : undefined}
		bind:clientWidth={
			() => 0 /* ignored */,
			(newWidth) => {
				if (isLoading) return;
				width = newWidth;
			}
		}
		onclick={async (e) => {
			if (!onclick) return;

			// Only set isLoading here if the onclick handler does not define its own loadingStarted signal.
			// This is kinda crude but you cant reflect a function object's args in JS, see https://stackoverflow.com/q/6921588/9943464 (well you can, but by uhhhh parsing the source code, yeah.)
			if (loading && !onclick.toString().includes('loadingStarted')) isLoading = true;

			loadingProgress = null;

			try {
				await onclick(e, {
					setText: (text) => {
						if (loading) onclickTextOverride = text;
					},
					loadingStarted: () => {
						isLoading = true;
					},
					loadingEnded: () => {
						isLoading = false;
					},
					progress(p) {
						loadingProgress = p;
					},
				});

				if (onclicksuccess) toasts.success(onclicksuccess);
			} catch (e) {
				if (errorprefix) {
					toasts.error(errorMessage(e, errorprefix));
				}
				console.error(e);
			} finally {
				if (loading) isLoading = false;
				onclickTextOverride = '';
			}
		}}
		pw-testid={testid || undefined}
	>
		{#if isLoading && !tight}
			<div class="loading-spinner">
				<LoadingSpinner />
			</div>
		{/if}
		{#if onclickTextOverride}
			{onclickTextOverride}
		{:else}
			{@render children({ loading: isLoading && loading !== false })}
			{#if keyboard && !(tight && keyboardHintIsInTooltip) && hasPhysicalKeyboard()}
				<KeyboardHint shortcut={keyboard} />
			{/if}
		{/if}
	</button>
</div>

<style>
	.tooltip-container {
		display: flex;
		width: var(--width);
	}

	button {
		cursor: pointer;
		background-color: var(--bg, var(--bg-neutral));
		color: var(--fg, var(--fg-neutral));
		display: flex;
		justify-content: center;
		align-items: center;
		border: 0.1625em solid var(--fg, var(--gray));
		padding: 0.75em;
		border-radius: var(--corner-radius);
		font-weight: bold;
		font-size: var(--font-size, 1em);
		gap: 0.5em;
		width: 100%;

		transition:
			background-color 0.2s,
			color 0.2s,
			border-color 0.2s;
	}

	button.loading {
		padding: 0.75em 0.8em;
		box-sizing: border-box;
		text-overflow: ellipsis;
		text-wrap: nowrap;
		overflow: hidden;
	}

	button.danger:not(:disabled) {
		color: var(--fg-error);
		border-color: var(--fg-error);
		background-color: var(--bg-neutral);
	}

	button.danger:not(:disabled):is(:hover, :focus-visible) {
		background-color: var(--bg-error);
		color: var(--fg-error);
		border-color: var(--fg-error);
	}

	button.tight {
		padding: 0.25em 0.5em;
	}

	button:disabled {
		cursor: not-allowed;
		background-color: var(--bg-disabled, var(--bg-neutral));
		color: var(
			--fg-disabled,
			color-mix(in srgb, var(--fg, var(--fg-neutral)) 50%, transparent)
		);
		border-color: var(
			--fg-disabled,
			color-mix(in srgb, var(--fg, var(--fg-neutral)) 50%, var(--bg-neutral))
		);
	}

	button:not(:disabled):not(.danger):is(:hover, :focus-visible) {
		background-color: var(--bg-hover, var(--bg-primary-translucent));
		color: var(--fg-hover, var(--fg-primary));
		border-color: var(--fg-hover, var(--bg-primary));
	}

	button.subtle:not(:hover, :focus-visible) {
		border-color: transparent;
	}

	.loading-spinner {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1em;
		height: 1em;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			rotate: 0deg;
		}
		to {
			rotate: 360deg;
		}
	}

	.progress {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;

		.tooltip-container:has(&) {
			position: relative;
			border-radius: var(--corner-radius);
			overflow: hidden;
		}
	}
</style>
