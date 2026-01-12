<!-- 
 @component Segmented group of buttons (or more advanced UI elements)
  -->

<script generics="Key extends string">
	/**
	 * @typedef {object} Props
	 * @property {Key[] | readonly Key[]} options
	 * @property {string} aria-label aria-label for the group
	 * @property {Partial<{[K in Key]: string}>} [labels] labels for the options
	 * @property {NoInfer<Key> | undefined} [value] which option is selected
	 * @property {import('svelte').Snippet<[Key]>} [customOption] snippets to render for each option. called for every option in `options` that is not in `labels`. arguments: option
	 * @property {(value: NoInfer<Key>) => void | Promise<void>} [onchange] called when the value changes
	 * @property {string} [data-testid] add a data-testid attribute to the root element
	 * @property {boolean} [clickable-custom-options=false] whether the custom options should be clickable. If true, the onclick function will be called when the option is clicked.
	 */

	/**
	 * @type {Props}
	 */
	let {
		options,
		labels,
		value = $bindable(),
		customOption,
		'clickable-custom-options': clickableCustomOptions,
		onchange,
		...rest
	} = $props();
</script>

<div class="segmented-group" role="radiogroup" {...rest}>
	{#each options as option (option)}
		{#if !customOption || labels?.[option]}
			<button
				role="radio"
				aria-checked={option === value}
				class="option"
				onclick={() => {
					value = option;
					onchange?.(option);
				}}
			>
				{labels?.[option] ?? option}
			</button>
		{:else}
			<!-- svelte-ignore a11y_interactive_supports_focus -->
			<svelte:element
				this={clickableCustomOptions ? 'button' : 'div'}
				role="radio"
				aria-checked={option === value}
				class="option"
				onclick={() => {
					if (!clickableCustomOptions) return;
					value = option;
					onchange?.(option);
				}}
			>
				{@render customOption(option)}
			</svelte:element>
		{/if}
	{/each}
</div>

<style>
	.segmented-group {
		display: flex;
	}

	.option:first-child {
		border-top-left-radius: var(--corner-radius);
		border-bottom-left-radius: var(--corner-radius);
	}

	.option:last-child {
		border-top-right-radius: var(--corner-radius);
		border-bottom-right-radius: var(--corner-radius);
	}

	.option:not(:first-child) {
		/** prevent double borders in gaps */
		margin-left: -1px;
	}

	.option {
		border: 1px solid var(--bg-primary);
		padding: 0.5em 1em;
		display: flex;
		height: min-content;
	}

	button {
		font-size: 1em;
	}

	.option:not([aria-checked='true']):is(:hover, :focus-visible, :focus-within) {
		background-color: var(--bg-primary-translucent);
		color: var(--fg-primary);
		cursor: pointer;
	}

	.option[aria-checked='true'] {
		background-color: var(--bg-primary);
		color: var(--fg-primary);
	}
</style>
