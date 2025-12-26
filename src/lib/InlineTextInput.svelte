<script generics="T extends import('arktype').Type = typeof import('arktype').type.string">
	import { type } from 'arktype';

	import { tooltip } from './tooltips.js';

	/**
	 * @typedef {object} Props
	 * @property {string} label
	 * @property {string} value
	 * @property {boolean} [discreet=false] don't show bottom border until hover/focus
	 * @property {boolean} [monospace] use a monospace font
	 * @property {string | { idle: string; focused: string }} [placeholder] give an object to have a different placeholder when focused
	 * @property {T} [Type=type.string] arktype Type for the value
	 * @property {'email' | 'text' | 'password'} [type='text'] input type
	 * @property {(newValue: T['infer'], setValueTo: (v: string) => void) => void | Promise<void>} [onblur] also triggered on component unmount
	 * @property {(err: unknown) => void} [onerror] called if onblur throws
	 */

	/** @type {Props} */
	let {
		label,
		discreet,
		monospace,
		value = $bindable(),
		onblur = () => {},
		onerror,
		placeholder: _placeholder = '',
		type: inputType = 'text',
		Type = type.string
	} = $props();

	const placeholder = $derived(
		typeof _placeholder === 'string'
			? { idle: _placeholder, focused: _placeholder }
			: _placeholder
	);

	let focused = $state(false);
</script>

<input
	type={inputType}
	aria-label={label}
	class="inline-input"
	class:monospace
	class:discreet
	placeholder={focused ? placeholder.focused : placeholder.idle}
	use:tooltip={discreet ? label : undefined}
	bind:value
	onfocus={() => (focused = true)}
	onblur={async ({ currentTarget }) => {
		focused = false;
		try {
			await onblur(Type.assert(currentTarget.value), (v) => (value = v));
		} catch (err) {
			onerror?.(err);
		}
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

	.inline-input.monospace {
		font-family: var(--font-mono);
	}

	.inline-input.discreet:not(:hover):not(:focus-visible) {
		border-color: transparent;
	}

	.inline-input:is(:hover, :focus-visible) {
		border-color: var(--bg-primary);
		outline: none;
	}
</style>
