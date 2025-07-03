<script>
	import { format, parse } from 'date-fns';
	import IconError from '~icons/ph/exclamation-mark-fill';
	import IconDecrement from '~icons/ph/minus';
	import IconIncrement from '~icons/ph/plus';
	import { isType } from './metadata';
	import MetadataCombobox from './MetadataCombobox.svelte';
	import Switch from './Switch.svelte';
	import { tooltip } from './tooltips';
	import { safeJSONParse } from './utils';

	/**
	 * @typedef {object} Props
	 * @property {import('./database').Metadata} definition
	 * @property {undefined | import('./metadata').RuntimeValue} value
	 * @property {boolean} [merged] the value is the result of the merge of multiple metadata values
	 * @property {(value: undefined | import('./metadata').RuntimeValue) => void} [onblur]
	 * @property {string} [id]
	 * @property {boolean} [disabled]
	 * @property {import('./database').MetadataEnumVariant[]} [options]
	 * @property {Record<string, number>} [confidences]
	 */

	/** @type {Props} */
	let {
		value = $bindable(),
		confidences = {},
		id,
		disabled,
		definition,
		options = [],
		onblur
	} = $props();

	const { type } = definition;
</script>

<div class="metadata-input" data-type={type} data-metadata-id={definition.id}>
	{#if isType('enum', type, value)}
		<MetadataCombobox
			{id}
			{disabled}
			{options}
			{confidences}
			type="single"
			value={safeJSONParse(value?.toString())?.toString() ?? value}
			onValueChange={(newValue) => {
				if (newValue === undefined) {
					onblur?.(undefined);
					return;
				}
				onblur?.(newValue.toString());
			}}
		/>
	{:else if isType('boolean', type, value)}
		<div class="boolean-switch">
			<Switch
				{value}
				onchange={(newValue) => {
					console.log('onblur', newValue);
					onblur?.(newValue);
				}}
			/>
			{#if value}
				Oui
			{:else if value === false}
				Non
			{/if}
		</div>
	{:else if isType('string', type, value)}
		<input type="text" bind:value {id} {disabled} />
	{:else if isType('integer', type, value) || isType('float', type, value)}
		<button class="increment">
			<IconIncrement />
		</button>
		<input type="text" inputmode="numeric" bind:value {id} {disabled} />
		<button class="decrement">
			<IconDecrement />
		</button>
	{:else if isType('date', type, value)}
		<!-- TODO use bits-ui datepicker -->
		<input
			type="date"
			{id}
			{disabled}
			onblur={() => onblur?.(value)}
			bind:value={
				() => {
					console.log(' () => { ');
					if (!isType('date', type, value)) return undefined;
					if (value === undefined) return undefined;
					return format(value, 'yyyy-MM-dd');
				},
				(newValue) => {
					console.log(' (newValue) => { ', newValue);
					if (newValue === undefined) {
						onblur?.(undefined);
						return undefined;
					}
					onblur?.(parse(newValue, 'yyyy-MM-dd', new Date()));
					return newValue;
				}
			}
		/>
	{:else if isType('location', type, value)}
		<input
			type="text"
			{id}
			{disabled}
			onblur={({ currentTarget }) => {
				let newValue = currentTarget.value;
				if (newValue === undefined) {
					onblur?.(undefined);
					return;
				}
				if (!newValue.includes(',')) {
					return;
				}
				if (newValue.split(',').length > 3) {
					return;
				}
				// French convention: commas for decimals, semicolons for separation
				if (newValue.split(',').length === 3) {
					newValue = newValue.replace(',', '.').replace(';', ',');
				}
				const [latitude, longitude] = newValue.split(',').map((v) => parseFloat(v.trim()));
				onblur?.({ latitude, longitude });
			}}
			value={value ? `${value.latitude}, ${value.longitude}` : ''}
		/>
	{:else}
		<div class="unrepresentable" use:tooltip={JSON.stringify(value, null, 2)}>
			<IconError />
			<p>Irreprésentable</p>
		</div>
	{/if}
</div>

<style>
	input {
		font-size: 1.1em;
		font-weight: bold;
		border: none;
	}

	.metadata-input:not([data-type='boolean']):not(:has(.unrepresentable)) {
		border-bottom: 2px dashed var(--fg-neutral);
		display: flex;
		align-items: center;
	}

	.metadata-input:not([data-type='boolean']):focus-within {
		border-bottom-style: solid;
	}

	.unrepresentable {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: var(--fg-error);
	}

	.boolean-switch {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}
</style>
