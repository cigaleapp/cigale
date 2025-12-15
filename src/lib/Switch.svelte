<script lang="ts">
	import Check from '~icons/ri/check-line';
	import Cross from '~icons/ri/close-line';

	import { getSettings } from './settings.svelte';

	/**
	 * @typedef {object} Props
	 * @property {boolean} [value]
	 * @property {{ on: import('svelte').Component, off: import('svelte').Component }} [icons]
	 * @property {string} [label]
	 * @property {boolean} [show-label] show the label next to the switch instead of having it as an aria-label
	 * @property {undefined | ((value: boolean) => void)} [onchange]
	 */

	/** @type {Props & Record<string, unknown>} */
	let {
		value = $bindable(),
		icons: iconsOverride = undefined,
		onchange = () => {},
		label,
		'show-label': showLabel = false,
		...rest
	} = $props();

	/** @type {boolean} */
	let showHints = $derived(getSettings().showInputHints);

	let icons = $derived(
		iconsOverride ?? {
			on: Check,
			off: Cross
		}
	);
</script>

<div class="switch-and-label">
	<button
		class="switch"
		role="switch"
		aria-checked={value}
		onclick={() => {
			value = !value;
			onchange(value);
		}}
		aria-label={showLabel ? undefined : label}
		{...rest}
	>
		<div class="handle" class:pushed={value}>
			{#if showHints || iconsOverride}
				{#if value}
					<icons.on />
				{:else}
					<icons.off />
				{/if}
			{/if}
		</div>
	</button>
	{#if showLabel}
		{label}
	{/if}
</div>

<style>
	.switch-and-label {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-size: 0.9em;
		cursor: pointer;
	}

	.switch {
		cursor: pointer;
		--handle-size: 1.5rem;
		--pad: 0.25rem;
		display: flex;
		align-items: center;
		width: calc(2 * var(--handle-size) + 2 * var(--pad));
		height: calc(var(--handle-size) + 2 * var(--pad));
		background: var(--bg-neutral);
		border: 1px var(--fg-dark-primary) solid;
		padding: 0 var(--pad);
		border-radius: 1.5em;
		flex-shrink: 0;
	}

	.handle {
		font-size: 0.8em;
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		content: '';
		width: var(--handle-size);
		height: var(--handle-size);
		background: var(--switch-bg, var(--fg-neutral));
		border-radius: 100%;
		transition: margin 0.25s ease;
		color: var(--bg-neutral);
	}

	.handle.pushed {
		margin-left: var(--handle-size);
		background-color: var(--bg-primary);
		color: var(--fg-primary);
	}

	.switch:is(:hover, :focus-visible) {
		border-color: var(--bg-primary);
		background-color: var(--bg-primary-translucent);
		outline: none;
	}

	.switch:is(:hover, :focus-visible) .handle {
		color: var(--bg-primary);
	}

	.switch:is(:hover, :focus-visible) .handle.pushed {
		color: var(--fg-neutral);
	}
</style>
