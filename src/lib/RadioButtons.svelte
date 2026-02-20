<script lang="ts" generics="OptionKey extends string|number, AdditionalItemData = {}">
	type Item<Key extends string | number> = {
		key: Key;
		label: string;
		subtext?: string;
		disabled?: boolean;
	} & AdditionalItemData;

	interface Props {
		options: Array<Item<OptionKey>>;
		vertical?: boolean;
		horizontal?: boolean;
		cards?: boolean;
		value?: NoInfer<OptionKey> | undefined;
		// eslint-disable-next-line no-unused-vars
		onchange?: (value: OptionKey | undefined, fieldset: HTMLFieldSetElement) => void;
		children?: import('svelte').Snippet<
			[Item<NoInfer<OptionKey>> & { value: typeof value; selected: boolean }]
		>;
		label?: string;
	}

	let {
		options,
		value = $bindable(),
		children,
		cards,
		onchange = () => {},
		label,
		horizontal,
		vertical
	}: Props = $props();

	let fieldset: HTMLFieldSetElement | undefined = $state();

	$effect(() => {
		if (!fieldset) return;
		onchange(value, fieldset);
	});
</script>

<fieldset
	bind:this={fieldset}
	class="radio-inputs"
	class:horizontal
	class:smart-horizontal={!horizontal && !vertical}
	role="radiogroup"
	aria-label={label}
>
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
</fieldset>

<style>
	.radio-inputs {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		border: none;
		padding: 0;
	}

	.radio-inputs.horizontal {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1em;
	}

	.radio-inputs.smart-horizontal {
		display: flex;
		flex-flow: row wrap;
		gap: 0.5em 2em;

		& > * {
			flex: 0 0 auto;
		}

		&:has(> :nth-child(n + 2):not(:first-child):not(:last-child)) {
			flex-direction: column;
		}
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

	label.card {
		position: relative;

		input {
			/* Using display: none; removes radio buttons from the accessibility tree */
			position: absolute;
			inset: 0;
			opacity: 0;
		}
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
