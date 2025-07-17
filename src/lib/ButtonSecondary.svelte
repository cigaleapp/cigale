<!-- 
@component

A secondary button component.

Available CSS variables:

- **`--bg`**: background color
- **`--fg`**: text color
- **`--bg-hover`**: background color on hover
- **`--fg-hover`**: text color on hover
 
-->

<script module>
	/**
	 * @typedef Props
	 * @type {object}
	 * @property {import('svelte').Snippet<[{loading: boolean}]>} children
	 * @property {(e: MouseEvent, signals: { loadingStarted: () => void, loadingEnded: () => void }) => Promise<void> |void} onclick
	 * @property {boolean} [disabled=false]
	 * @property {boolean} [tight=false] limit the height of the button
	 * @property {string} [help]
	 * @property {string} [keyboard] keyboard shortcut hint to display
	 * @property {string|undefined} [testid] add a data-testid attribute to the button
	 * @property {boolean} [loading] show a loading state while the onlick handler is running
	 */
</script>

<script>
	import KeyboardHint from './KeyboardHint.svelte';
	import IconSpinner from '~icons/ph/spinner-ball';

	import { tooltip } from './tooltips';

	/** @type {Props} */
	let {
		children,
		onclick,
		disabled = false,
		help,
		keyboard,
		testid,
		loading = false,
		tight = false
	} = $props();

	let isLoading = $state(false);
</script>

<button
	disabled={disabled || isLoading}
	class:tight
	onclick={async (e) => {
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
			<IconSpinner />
		</div>
	{/if}
	{@render children({ loading: isLoading && loading })}
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
		border: 1px solid var(--fg, var(--gray));
		padding: 0.75em;
		border-radius: var(--corner-radius);
		width: var(--width);
		font-weight: bold;
		font-size: var(--font-size, 1em);
		gap: 0.5em;
	}

	button.tight {
		padding: 0.25em 0.5em;
	}

	button:disabled {
		opacity: 0.75;
		cursor: not-allowed;
	}

	button:not(:disabled):is(:hover, :focus-visible) {
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
