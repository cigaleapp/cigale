<script generics="OptionKey extends string|number">
	/**
	 * @template {string|number} Key
	 * @typedef {{ key: Key; label: string; subtext?: string, disabled?: boolean }} Item
	 */

	/**
	 * @typedef {object} Props
	 * @property {Array<Item<OptionKey>>} options possible options
	 * @property {boolean} [horizontal] display the radio buttons in a grid
	 * @property {boolean} [cards] display the radio buttons as cards
	 * @property {NoInfer<OptionKey>} [value] the value of the selected radio button
	 * @property {(value: OptionKey|undefined) => void} [onchange] callback to call when the user selects a radio button
	 * @property {import('svelte').Snippet<[Item<NoInfer<OptionKey>> & { value: typeof value, selected: boolean }]>} [children] content of the label
	 * @property {string} [label] label for the radio group
	 */

	/** @type {Props} */
	let {
		options,
		value = $bindable(),
		children,
		cards,
		onchange = () => {},
		label,
		horizontal
	} = $props();

	$effect(() => {
		onchange(value);
	});
</script>

<div class="radio-inputs" class:horizontal role="radiogroup" aria-label={label}>
	{#if label}
		<legend>{label}</legend>
	{/if}
	{#each options as option (option.key)}
		{@const { key, label, disabled } = option}
		<label class="radio" class:card={cards}>
			<input {disabled} type="radio" value={key} bind:group={value} />
			{#if children}
				{@render children({ ...option, value, selected: key === value })}
			{:else}
				{label}
				{#if 'subtext' in option}
					<p class="subtext">
						{option.subtext}
					</p>
				{/if}
			{/if}
		</label>
	{/each}
</div>

<style>
	.radio-inputs {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.radio-inputs.horizontal {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1em;
	}

	label.card {
		border: 1px solid var(--bg-neutral);
		border-radius: 0.5em;
		padding: 0.5em 1em;
		transition: box-shadow 0.1s;
		cursor: pointer;

		&:has(input:checked) {
			border-color: var(--bg-primary);
			box-shadow: 0 0 0 2px var(--bg-primary);
		}

		&:has(input:disabled) {
			opacity: 0.5;
			cursor: not-allowed;
		}

		&:hover,
		&:focus-within {
			border-color: var(--bg-primary);
		}
	}

	label.card input {
		display: none;
	}

	input[type='radio'] {
		accent-color: var(--bg-primary);
		color: var(--bg-neutral);
		align-items: center;
	}

	input[type='radio']:hover {
		color: var(--bg-primary);
		border-radius: 50%;
	}

	.radio {
		align-items: center;
	}

	.subtext {
		color: var(--gay);
		padding-left: 1.2em;
	}

	legend {
		margin-bottom: 0;
		color: var(--gay);
	}
</style>
