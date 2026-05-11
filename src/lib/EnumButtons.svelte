<script lang="ts" generics="OptionKey extends string|number, AdditionalItemData = {}">
	import type { MaybeLoading } from './LoadingText.svelte';

	import LoadingText from './LoadingText.svelte';

	type Item<Key extends string | number> = {
		key: Key;
		label: MaybeLoading<string>;
		subtext?: MaybeLoading<string>;
		disabled?: boolean | string;
	} & AdditionalItemData;

	/* eslint-disable no-unused-vars */
	type OnChange = (
		/** When multiple=false */
		value: OptionKey | undefined,
		/** When multiple=true. If it's false, this will be undefined */
		values: Array<OptionKey> | undefined,
		fieldset: HTMLFieldSetElement
	) => void | Promise<void>;
	/* eslint-enable no-unused-vars */

	type Props = {
		options: Array<Item<OptionKey>>;
		// vertical?: boolean;
		horizontal?: boolean;
		cards?: boolean;
		onchange?: OnChange;
		/** Always undefined if multiple=true */
		value?: NoInfer<OptionKey> | undefined;
		/** Used when multiple=true */
		values?: Array<NoInfer<OptionKey>>;
		/** Allow choosing multiple options. */
		multiple?: boolean;
		/** Allow de-selecting by clicking again on the selected option */
		deselectable?: boolean;
		children?: import('svelte').Snippet<
			[Item<NoInfer<OptionKey>> & { value: typeof value; selected: boolean }]
		>;
		label?: string;
	};

	let {
		options,
		value = $bindable(),
		values = $bindable([]),
		deselectable = false,
		children,
		cards,
		label,
		horizontal,
		multiple,
		onchange,
	}: Props = $props();

	let fieldset: HTMLFieldSetElement | undefined = $state();

	const id = $props.id();
</script>

<fieldset
	bind:this={fieldset}
	class="radio-inputs"
	class:horizontal
	role={multiple ? 'group' : 'radiogroup'}
	aria-labelledby={label ? `${id}-label` : undefined}
>
	{#if label}
		<legend id="{id}-label">{label}</legend>
	{/if}
	{#each options as option (option.key)}
		{@const { key, label, disabled } = option}
		<label class="radio" class:card={cards}>
			<input
				disabled={Boolean(disabled)}
				type={multiple ? 'checkbox' : 'radio'}
				value={key}
				checked={multiple ? values.includes(key) : key === value}
				onclick={async () => {
					if (multiple) return;
					if (!deselectable) return;
					if (!fieldset) return;
					if (value !== key) return;

					value = undefined;

					await onchange?.(value, values, fieldset);
				}}
				onchange={async (e) => {
					if (!fieldset) return;

					if (e.currentTarget.checked) {
						values = [...new Set([...values, key])];
						value = key;
					} else {
						values = values.filter((v) => v !== key);
					}

					await onchange?.(value, values, fieldset);
				}}
			/>
			{#if children}
				{@render children({ ...option, value, selected: multiple ? values.includes(key)  : key === value })}
			{:else}
				<div class="text">
					<LoadingText value={label} />
					{#if 'subtext' in option}
						<p class="subtext">
							<LoadingText value={option.subtext} />
						</p>
					{/if}
				</div>
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

	input {
		accent-color: var(--bg-primary);
		color: var(--bg-neutral);
		align-items: center;
	}

	input:hover {
		color: var(--bg-primary);
		border-radius: 50%;
	}

	.radio {
		align-items: center;
	}

	.text {
		max-width: 67ch;
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
