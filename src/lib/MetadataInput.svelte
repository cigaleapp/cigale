<script>
	import Checkbox from './Checkbox.svelte';
	import { isType } from './metadata';
	import MetadataCombobox from './MetadataCombobox.svelte';
	import IconIncrement from '~icons/ph/plus';
	import IconDecrement from '~icons/ph/minus';
	import { format, parse } from 'date-fns';

	/**
	 * @typedef {object} Props
	 * @property {import('./database').Metadata} definition
	 * @property {undefined | import('./metadata').RuntimeValue} value
	 * @property {(value: import('./metadata').RuntimeValue) => void} [onblur]
	 * @property {string}[id]
	 * @property {boolean}[disabled]
	 */

	/** @type {Props} */
	let { value = $bindable(), id, disabled, definition, ...props } = $props();

	const { type, options } = definition;
</script>

{#if isType('enum', type, value) && options}
	<MetadataCombobox
		{id}
		{disabled}
		items={options.map((opt) => ({
			value: opt.key,
			label: opt.label
		}))}
		type="single"
		value={value?.toString()}
	/>
{:else if isType('boolean', type, value)}
	<Checkbox bind:value {id} {disabled}>
		{#if value}
			Oui
		{:else if value === false}
			Non
		{/if}
	</Checkbox>
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
		bind:value={
			() => {
				if (!isType('date', type, value)) return undefined;
				if (value === undefined) return undefined;
				return format(value, 'yyyy-MM-dd');
			},
			(newValue) => {
				if (!isType('date', type, value)) return undefined;
				if (newValue === undefined) return undefined;
				return parse(newValue, 'yyyy-MM-dd', new Date());
			}
		}
	/>
{:else if isType('location', type, value)}
	<input
		type="text"
		{id}
		{disabled}
		bind:value={
			() => {
				if (!isType('location', type, value)) return undefined;
				if (value === undefined) return undefined;
				return `${value.latitude}, ${value.longitude}`;
			},
			(newValue) => {
				if (!isType('location', type, value)) return undefined;
				if (newValue === undefined) return undefined;

				// French convention: commas for decimals, semicolons for separation
				if (newValue.split(',').length > 2) {
					newValue = newValue.replace(',', '.').replace(';', ',');
				}
				const [latitude, longitude] = newValue.split(',').map((v) => parseFloat(v));
				return { latitude, longitude };
			}
		}
	/>
{:else}
	<div class="unrepresentable">
		<textarea
			{id}
			{disabled}
			rows={3}
			bind:value={
				() => {
					if (value === undefined) return '';
					return JSON.stringify(value, null, 2);
				},
				(newValue) => {
					if (newValue === '') return undefined;
					return JSON.parse(newValue);
				}
			}
		>
		</textarea>
	</div>
{/if}
