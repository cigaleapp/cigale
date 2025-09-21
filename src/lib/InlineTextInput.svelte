<script generics="T extends import('arktype').Type">
	import { type } from 'arktype';

	/**
	 * @typedef {object} Props
	 * @property {string} label
	 * @property {string} value
	 * @property {boolean} [discreet=false] don't show bottom border until hover/focus
	 * @property {string} [placeholder]
	 * @property {T} [Type=type.string] arktype Type for the value
	 * @property {(newValue: T['infer'] extends string ? string : (T['infer'] | import('arktype').ArkErrors), setValueTo: (v: string) => void) => void | Promise<void>} onblur also triggered on component unmount
	 */

	/** @type {Props} */
	let { label, discreet, value = $bindable(), onblur, placeholder, Type = type.string } = $props();

	// FIXME Doesn't work - see https://discord.com/channels/457912077277855764/1349511706669224049 on Svelte Discord
	// onDestroy(() => onblur(value));
</script>

<input
	aria-label={label}
	class="inline-input"
	class:discreet
	{placeholder}
	bind:value
	onblur={({ currentTarget }) => {
		onblur(Type(currentTarget.value), (v) => (value = v));
	}}
/>

<style>
	.inline-input {
		display: inline-flex;
		width: 100%;
		border: none;
		background-color: transparent;
		/* color: var(--fg-neutral); */
		color: inherit;
		font-size: 1em;
		font-weight: inherit;
		font-family: inherit;
		border-bottom: 2px solid var(--fg-primary);
	}

	.inline-input.discreet:not(:hover):not(:focus-visible) {
		border-color: transparent;
	}

	.inline-input:is(:hover, :focus-visible) {
		border-color: var(--bg-primary);
		outline: none;
	}
</style>
