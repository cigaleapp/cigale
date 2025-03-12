<script>
	/**
	 * @typedef {object} Props
	 * @property {string} label
	 * @property {string} value
	 * @property {(newValue: string) => void | Promise<void>} onblur also triggered on component unmount
	 */

	/** @type {Props} */
	let { label, value, onblur } = $props();

	// FIXME Doesn't work - see https://discord.com/channels/457912077277855764/1349511706669224049 on Svelte Discord
	// onDestroy(() => onblur(value));
</script>

<input
	aria-label={label}
	class="inline-input"
	{value}
	onblur={({ currentTarget }) => onblur(currentTarget.value)}
/>

<style>
	.inline-input {
		display: inline-flex;
		border: none;
		background-color: transparent;
		color: var(--fg-neutral);
		font-size: 1em;
		font-weight: inherit;
		border-bottom: 2px solid var(--fg-primary);
	}

	.inline-input:is(:hover, :focus-visible) {
		border-color: var(--bg-primary);
		outline: none;
	}
</style>
