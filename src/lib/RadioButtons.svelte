<script generics="OptionKey extends string">
	/**
	 * @template {string} Key
	 * @typedef {{ key: Key; label: string }} Item
	 */

	/**
	 * @typedef {object} Props
	 * @property {Array<Item<OptionKey>>} options possible options
	 * @property {NoInfer<OptionKey>} [value] the value of the selected radio button
	 * @property {(value: string|undefined) => void} [onchange] callback to call when the user selects a radio button
	 * @property {import('svelte').Snippet} children
	 */

	/** @type {Props} */
	let { options, value = $bindable(), onchange = () => {} } = $props();

	$effect(() => {
		onchange(value);
	});
</script>

{#each options as { key, label } (key)}
	<div>
		<label class="radio">
			<input type="radio" value={key} bind:group={value} />
			{label}
		</label>
	</div>
{/each}

<style>
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
</style>
