<script>
	import Icon from '@iconify/svelte';
	import * as dates from 'date-fns';

	import IconIncrement from '~icons/ri/add-line';
	import IconError from '~icons/ri/error-warning-fill';
	import IconDecrement from '~icons/ri/subtract-line';

	import MetadataTypeswitch from './metadata/MetadataTypeswitch.svelte';
	import MetadataCombobox from './MetadataCombobox.svelte';
	import RadioButtons from './RadioButtons.svelte';
	import Switch from './Switch.svelte';
	import { tooltip } from './tooltips.js';
	import { compareBy, pick, readableOn, round, safeJSONParse } from './utils.js';

	/**
	 * @import { RuntimeValue } from './schemas/metadata';
	 */

	/**
	 * @typedef {object} Props
	 * @property {import('./database').Metadata} definition
	 * @property {undefined | RuntimeValue} value
	 * @property {boolean} [merged] the value is the result of the merge of multiple metadata values
	 * @property {(value: undefined | RuntimeValue) => void} onblur
	 * @property {string} id
	 * @property {boolean} [disabled]
	 * @property {import('./database').MetadataEnumVariant[]} [options]
	 * @property {Record<string, number>} [confidences]
	 * @property {boolean} [isCompactEnum] whether to use the compact enum display (radio buttons)
	 */

	/** @type {Props} */
	let {
		value,
		confidences = {},
		id,
		disabled,
		definition,
		options = [],
		isCompactEnum = false,
		onblur
	} = $props();

	const { type } = $derived(definition);
</script>

<div
	class="metadata-input"
	data-type={type}
	data-metadata-id={definition.id}
	class:compact-enum={isCompactEnum}
>
	<MetadataTypeswitch {type} {value}>
		{#snippet enum_(value)}
			{#if isCompactEnum}
				<RadioButtons
					{value}
					onchange={onblur}
					cards={options.every((opt) => opt.icon || opt.color)}
					options={options
						.toSorted(compareBy(({ index }) => index))
						.map((opt) => pick(opt, 'key', 'label', 'icon', 'color', 'description'))}
				>
					{#snippet children({ label, icon, color, description })}
						<div class="label">
							<div class="first-line">
								{#if icon || color}
									<div
										class="icon"
										style:background-color={color}
										style:color={color ? readableOn(color) : undefined}
									>
										{#if icon}
											<Icon {icon} />
										{/if}
									</div>
								{/if}
								{label}
							</div>
							{#if description}
								<p class="subtext">{description}</p>
							{/if}
						</div>
					{/snippet}
				</RadioButtons>
			{:else}
				<MetadataCombobox
					{id}
					{options}
					{confidences}
					type="single"
					disabled={disabled ?? false}
					value={safeJSONParse(value?.toString())?.toString() ?? value}
					onValueChange={(newValue) => {
						if (newValue === undefined) {
							onblur(undefined);
							return;
						}
						onblur(newValue.toString());
					}}
				/>
			{/if}
		{/snippet}
		{#snippet boolean(value)}
			<div class="boolean-switch">
				<Switch
					value={value ?? false}
					onchange={(newValue) => {
						onblur(newValue);
					}}
				/>
				{#if value}
					Oui
				{:else if value === false}
					Non
				{/if}
			</div>
		{/snippet}
		{#snippet string(value)}
			<input type="text" {value} {id} {disabled} onblur={() => onblur(value)} />
		{/snippet}
		{#snippet numeric(val)}
			<input
				{id}
				{disabled}
				type="text"
				inputmode="numeric"
				onblur={({ currentTarget }) => {
					if (!(currentTarget instanceof HTMLInputElement)) return;
					const newValue = currentTarget.value;
					if (!newValue) {
						onblur(undefined);
						return;
					}

					/** @type {number|undefined} */
					let parsedValue =
						type === 'integer'
							? Number.parseInt(newValue, 10)
							: Number.parseFloat(newValue);

					if (Number.isNaN(parsedValue)) {
						parsedValue = undefined;
					}

					onblur(parsedValue);
				}}
				value={val?.toString() ?? ''}
			/>
			<button
				class="decrement"
				aria-label="Décrémenter"
				onclick={() => {
					if (value === undefined || value === null) {
						value = 0;
					}
					if (typeof value !== 'number') return;
					value--;
					value = round(value, 5);
					onblur(value);
				}}
			>
				<IconDecrement />
			</button>
			<button
				class="increment"
				aria-label="Incrémenter"
				onclick={() => {
					if (value === undefined || value === null) {
						value = 0;
					}
					if (typeof value !== 'number') return;
					value++;
					value = round(value, 5);
					onblur(value);
				}}
			>
				<IconIncrement />
			</button>
		{/snippet}
		{#snippet date(value)}
			<!-- TODO use bits-ui datepicker -->
			<input
				type="date"
				{id}
				{disabled}
				onblur={() => onblur(value)}
				bind:value={
					() => {
						if (value === undefined) return undefined;
						return dates.format(value, 'yyyy-MM-dd');
					},
					(newValue) => {
						if (newValue === undefined) {
							onblur(undefined);
							return undefined;
						}
						onblur(dates.parse(newValue, 'yyyy-MM-dd', new Date()));
						return newValue;
					}
				}
			/>
		{/snippet}
		{#snippet location(value)}
			<input
				type="text"
				{id}
				{disabled}
				onblur={({ currentTarget }) => {
					let newValue = currentTarget.value;
					if (newValue === undefined) {
						onblur(undefined);
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
					const [latitude, longitude] = newValue
						.split(',')
						.map((v) => parseFloat(v.trim()));
					onblur({ latitude, longitude });
				}}
				value={value ? `${value.latitude}, ${value.longitude}` : ''}
			/>
		{/snippet}
		{#snippet fallback()}
			<div class="unrepresentable" use:tooltip={JSON.stringify(value, null, 2)}>
				<IconError />
				<p>Irreprésentable</p>
			</div>
		{/snippet}
		{#snippet error()}
			<div
				class="unrepresentable"
				use:tooltip={`${JSON.stringify(value, null, 2)} n'est pas une valeur valide de type ${type}`}
			>
				<IconError />
				<p>Mismatch</p>
			</div>
		{/snippet}
	</MetadataTypeswitch>
</div>

<style>
	input {
		font-size: 1.1em;
		font-weight: bold;
		border: none;
	}

	.metadata-input.compact-enum {
		width: 100%;
	}

	.metadata-input.compact-enum .label {
		gap: 0.75em;
		margin-left: 0.25em;

		&:not(:has(.subtext)) {
			display: inline-flex;
			align-items: center;
		}

		.first-line {
			display: flex;
			align-items: center;
			gap: 0.5em;
			flex-wrap: nowrap;
		}

		.icon {
			border-radius: 50%;
			font-size: 1.2em;
			display: flex;
			align-items: center;
			height: 0.9em;
			width: 0.9em;
		}

		.subtext {
			margin: 0;
			margin-top: 0.25em;
			font-size: 0.9em;
			color: var(--gay);
		}
	}

	.metadata-input:not([data-type='boolean']):not(.compact-enum):not(:has(.unrepresentable)) {
		border-bottom: 2px dashed var(--fg-neutral);
		display: flex;
		align-items: center;
	}

	.metadata-input:not([data-type='boolean']):not(.compact-enum):focus-within {
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
