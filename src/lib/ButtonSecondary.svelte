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

<script module>
	/**
	 * @typedef Props
	 * @type {object}
	 * @property {import('svelte').Snippet<[{loading: boolean}]>} children
	 * @property {undefined | ((e: MouseEvent, signals: { setText: (text: string) => void, loadingStarted: () => void, loadingEnded: () => void }) => Promise<void> |void)} onclick
	 * @property {boolean} [disabled=false]
	 * @property {boolean} [tight=false] limit the height of the button. also hides keyboard shortcut hint if itll be displayed in a tooltip, and doesn't auto-append a spinner when loading, and {@link loading} is true
	 * @property {Parameters<typeof tooltip>[1]} [help]
	 * @property {string} [keyboard] keyboard shortcut hint to display
	 * @property {import('$e2e/testids.js').PlaywrightTestId|undefined} [testid] add a attribute for Playwright getByTestId to the button
	 * @property {boolean} [aria-pressed]
	 * @property {string} [aria-label]
	 * @property {boolean |"always"} [loading] show a loading state while the onlick handler is running. set to "always" to always show the loading state.
	 * @property {string} [errorprefix] show an error toast if the onclick handler fails. message is constructed with errorMessage(e, errorprefix)
	 * @property {string} [onclicksuccess] show a success toast if the onclick handler doesnt fail.
	 * @property {boolean} [danger=false] use a red color scheme for dangerous actions
	 * @property {boolean} [subtle=false] disable the border except on hover/focus
	 * @property {boolean} [submits=false] if true, the button acts as a submit button in a form context
	 * @property {string} [aria-label] accessible label for the button
	 */
</script>

<script>
	import { errorMessage } from '$lib/i18n.js';
	import { toasts } from '$lib/toasts.svelte.js';

	import { hasPhysicalKeyboard } from './keyboard.svelte';
	import KeyboardHint from './KeyboardHint.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { tooltip } from './tooltips.js';

	/** @type {Props} */
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
	} = $props();

	let isLoading = $state(false);

	const keyboardHintIsInTooltip = $derived(
		help && (typeof help === 'string' ? keyboard : 'keyboard' in help)
	);

	let onclickTextOverride = $state('');

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
</style>
