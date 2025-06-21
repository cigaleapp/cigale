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
	 */

	/** @type {Props} */
	let { options, value = $bindable(), onchange = () => {} } = $props();

	$effect(() => {
		onchange(value);
	});
</script>

<div class="radio-inputs">
	{#each options as { key, label, ...additional } (key)}
		<label class="radio">
			<input type="radio" value={key} bind:group={value} />
			{label}
			{#if 'subtext' in additional}
				<p class="subtext">
					{additional.subtext}
				</p>
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
</style>
