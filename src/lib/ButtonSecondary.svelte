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
	 * @property {undefined | ((e: MouseEvent, signals: { loadingStarted: () => void, loadingEnded: () => void }) => Promise<void> |void)} onclick
	 * @property {boolean} [disabled=false]
	 * @property {boolean} [tight=false] limit the height of the button
	 * @property {string} [help]
	 * @property {string} [keyboard] keyboard shortcut hint to display
	 * @property {string|undefined} [testid] add a data-testid attribute to the button
	 * @property {boolean} [aria-pressed]
	 * @property {boolean |"always"} [loading] show a loading state while the onlick handler is running. set to "always" to always show the loading state.
	 * @property {boolean} [danger=false] use a red color scheme for dangerous actions
	 * @property {boolean} [submits=false] if true, the button acts as a submit button in a form context
	 */
</script>

<script>
	import KeyboardHint from './KeyboardHint.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { tooltip } from './tooltips.js';

	/** @type {Props} */
	let {
		children,
		onclick,
		disabled = false,
		danger = false,
		help,
		keyboard,
		submits,
		testid,
		loading = false,
		tight = false,
		'aria-pressed': ariaPressed
	} = $props();

	let isLoading = $state(false);
</script>

<button
	type={submits ? 'submit' : 'button'}
	disabled={disabled || isLoading}
	class:tight
	class:danger
	aria-pressed={ariaPressed}
	onclick={async (e) => {
		if (!onclick) return;

		// Only set isLoading here if the onclick handler does not define its own loadingStarted signal.
		// This is kinda crude but you cant reflect a function object's args in JS, see https://stackoverflow.com/q/6921588/9943464 (well you can, but by uhhhh parsing the source code, yeah.)
		if (loading && !onclick.toString().includes('loadingStarted')) isLoading = true;

		try {
			await onclick(e, {
				loadingStarted: () => {
					isLoading = true;
				},
				loadingEnded: () => {
					isLoading = false;
				}
			});
		} finally {
			if (loading) isLoading = false;
		}
	}}
	use:tooltip={help ? { text: help, keyboard } : undefined}
	data-testid={testid || undefined}
>
	{#if isLoading}
		<div class="loading-spinner">
			<LoadingSpinner />
		</div>
	{/if}
	{@render children({ loading: isLoading && loading !== false })}
	{#if keyboard}
		<KeyboardHint shortcut={keyboard} />
	{/if}
</button>

<style>
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
		width: var(--width);
		font-weight: bold;
		font-size: var(--font-size, 1em);
		gap: 0.5em;

		transition:
			background-color 0.2s,
			color 0.2s,
			border-color 0.2s;
	}

	button.danger:not(:disabled) {
		color: var(--fg, var(--fg-error));
		border-color: var(--fg, var(--fg-error));
	}

	button.danger:not(:disabled):is(:hover, :focus-visible) {
		background-color: var(--bg-hover, var(--bg-error));
		color: var(--fg-hover, var(--fg-error));
		border-color: var(--fg-hover, var(--fg-error));
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
