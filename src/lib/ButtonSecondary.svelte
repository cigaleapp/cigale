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
	 * @property {import('svelte').Snippet} children
	 * @property {(e: MouseEvent) => void} onclick
	 * @property {boolean} [disabled=false]
	 * @property {string} [help]
	 * @property {string} [keyboard] keyboard shortcut hint to display
	 * @property {string|undefined} [testid] add a data-testid attribute to the button
	 */
</script>

<script>
	import KeyboardHint from './KeyboardHint.svelte';

	import { tooltip } from './tooltips';

	/** @type {Props} */
	let { children, onclick, disabled = false, help, keyboard, testid } = $props();
</script>

<button
	{onclick}
	{disabled}
	use:tooltip={help ? { text: help, keyboard } : undefined}
	data-testid={testid || undefined}
>
	{@render children()}
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

	button:disabled {
		opacity: 0.75;
		cursor: not-allowed;
	}

	button:not(:disabled):is(:hover, :focus-visible) {
		background-color: var(--bg-hover, var(--bg-primary-translucent));
		color: var(--fg-hover, var(--fg-primary));
		border-color: var(--fg-hover, var(--bg-primary));
	}
</style>
