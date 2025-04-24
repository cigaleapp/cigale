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
	 */
</script>

<script>
	import { sound } from './sound';

	import { tooltip } from './tooltips';

	/** @type {Props} */
	let { children, onclick, disabled = false, help } = $props();
</script>

<button {onclick} {disabled} use:tooltip={help} use:sound={'vineboom.mp3'}>
	{@render children()}
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
