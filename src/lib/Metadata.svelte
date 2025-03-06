<script generics="Type extends import('./database').MetadataType">
	import Checkbox from './Checkbox.svelte';
	import RadialIndicator from './RadialIndicator.svelte';
	import RadioButtons from './RadioButtons.svelte';
	import SelectWithSearch from './SelectWithSearch.svelte';
	import { tooltip } from './tooltips';

	/**
	 * @typedef {object} Props
	 * @property {Type} type
	 * @property {import('./metadata').RuntimeValue<Type> | undefined} value
	 * @property {number} [confidence] between 0 and 1
	 * @property {import('svelte').Snippet} children
	 * @property {import('./database').Metadata['options']} [options]
	 * @property {(value: import('./metadata').RuntimeValue<Type>) => void} [onchange]
	 */

	/** @type {Props} */
	let {
		value = $bindable(),
		confidence,
		children,
		type,
		options = [],
		onchange = () => {}
	} = $props();

	$effect(() => {
		if (value !== undefined) onchange(value);
	});
</script>

<div class="meta">
	<label>
		{#if confidence !== undefined}
			<div class="confidence" use:tooltip={`Confiance: ${confidence}`}>
				<RadialIndicator value={confidence} />
			</div>
		{/if}
		{@render children()}
	</label>

	{#if type === 'date'}
		<input class="date" type="date" bind:value />
	{:else if type === 'float' || type === 'integer'}
		<input
			type="text"
			inputmode="numeric"
			{value}
			oninput={(e) => {
				// @ts-expect-error
				value = e.currentTarget.valueAsNumber;
			}}
		/>
		<div class="ligne"></div>
	{:else if type === 'boolean'}
		<Checkbox bind:value>
			<div class="niOuiNiNon">
				{#if value}
					Oui
				{:else}
					Non
				{/if}
			</div>
		</Checkbox>
	{:else if type === 'enum'}
		{#if options.length <= 5}
			<RadioButtons {options} bind:value name=""></RadioButtons>
		{:else}
			<SelectWithSearch
				options={Object.fromEntries(options.map(({ key, label }) => [key, label]))}
				bind:selectedValue={value}
			/>
		{/if}
	{:else if type === 'string'}
		<input type="text" bind:value />
		<div class="ligne"></div>
	{:else}
		<code class="unrepresentable-datatype" use:tooltip={JSON.stringify(value, null, 2)}>
			{JSON.stringify(value)}
		</code>
	{/if}
</div>

<style>
	.meta {
		gap: 0.1em;
		display: flex;
		flex-direction: column;
	}

	label {
		color: var(--gray);
		text-transform: uppercase;
		font-weight: bold;
		display: flex;
		align-items: center;
		gap: 1em;
	}

	.unrepresentable-datatype {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.confidence {
		font-size: 0.7em;
	}

	.ligne {
		height: 2px;
		background-color: var(--bg-neutral);
		display: flex;
	}

	input {
		outline: none;
		border: none;
	}

	.meta:hover .ligne {
		background-color: var(--fg-neutral);
	}

	.meta:focus-within .ligne {
		background-color: var(--bg-primary);
	}

	.meta:focus-within label {
		color: var(--fg-neutral);
	}

	.niOuiNiNon {
		color: var(--gay);
	}

	.niOuiNiNon:hover {
		color: var(--fg-neutral);
	}
	.date {
		color: var(--gay);
	}

	.date:hover {
		color: var(--fg-neutral);
	}
</style>
