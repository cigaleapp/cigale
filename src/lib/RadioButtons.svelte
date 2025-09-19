<script generics="OptionKey extends string|number">
	/**
	 * @template {string|number} Key
	 * @typedef {{ key: Key; label: string; subtext?: string }} Item
	 */

	/**
	 * @typedef {object} Props
	 * @property {Array<Item<OptionKey>>} options possible options
	 * @property {NoInfer<OptionKey>} [value] the value of the selected radio button
	 * @property {(value: OptionKey|undefined) => void} [onchange] callback to call when the user selects a radio button
	 * @property {import('svelte').Snippet<[Item<NoInfer<OptionKey>>]>} children
	 * @property {string} [label] label for the radio group
	 */

	/** @type {Props} */
	let { options, value = $bindable(), children, onchange = () => {}, label } = $props();

	$effect(() => {
		onchange(value);
	});
</script>

<div class="radio-inputs" role="radiogroup" aria-label={label}>
	{#if label}
		<legend>{label}</legend>
	{/if}
	{#each options as { key, label, ...additional } (key)}
		<label class="radio">
			<input type="radio" value={key} bind:group={value} />
			{#if children}
				{@render children(option)}
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
