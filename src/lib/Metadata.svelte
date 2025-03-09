<script generics="Type extends import('./database').MetadataType">
	import Checkbox from './Checkbox.svelte';
	import RadialIndicator from './RadialIndicator.svelte';
	import RadioButtons from './RadioButtons.svelte';
	import IconMaps from '~icons/ph/map-trifold';
	import SelectWithSearch from './SelectWithSearch.svelte';
	import { tooltip } from './tooltips';
	import { getSettings } from './settings.svelte';
	import { format } from 'date-fns';

	/**
	 * @typedef {object} Props
	 * @property {Type} type
	 * @property {string} id The id of the metadata
	 * @property {string} [description=""] A description of the metadata
	 * @property {?string} [learnMore=null] A link to learn more about the metadata
	 * @property {import('./metadata').RuntimeValue<Type> | undefined} value
	 * @property {number} [confidence] between 0 and 1
	 * @property {import('svelte').Snippet} children
	 * @property {boolean} [conflicted] the value is in conflict (selection has multiple differing values)
	 * @property {import('./database').Metadata['options']} [options]
	 * @property {(value: import('./metadata').RuntimeValue<Type>) => void} [onchange]
	 * @property {(value: undefined | import('./metadata').RuntimeValue<Type>) => void} [onblur]
	 */

	/** @type {Props} */
	let {
		value = $bindable(),
		id,
		conflicted,
		confidence,
		children,
		type,
		options = [],
		description = '',
		learnMore = null,
		onchange = () => {},
		onblur = () => {}
	} = $props();

	/** @type {number|undefined} */
	let latitude = $state(undefined);
	/** @type {number|undefined} */
	let longitude = $state(undefined);

	/** @type {string|undefined} */
	let datePart = $state(undefined);
	/** @type {string|undefined} */
	let timePart = $state(undefined);

	$effect(() => {
		if (type === 'location' && value !== undefined) {
			// @ts-ignore
			latitude = value.latitude;
			// @ts-ignore
			longitude = value.longitude;
		}
	});

	$effect(() => {
		if (type === 'date' && value !== undefined) {
			// @ts-ignore
			datePart = format(value, 'yyyy-MM-dd');
			// @ts-ignore
			timePart = format(value, 'HH:mm:ss');
		}
	});

	$effect(() => {
		if (value !== undefined) onchange(value);
	});
</script>

<div class="meta">
	<label for="metadata-{id}">
		<div class="first-line">
			{#if confidence !== undefined && confidence < 1}
				<div class="confidence" use:tooltip={`Confiance: ${confidence}`}>
					<RadialIndicator value={confidence} />
				</div>
			{/if}
			{@render children()}
			{#if type === 'location' && value !== undefined}
				<a
					class="gmaps-link"
					href="https://maps.google.com/maps/@{value.latitude},{value.longitude},17z"
					target="_blank"
				>
					<IconMaps />
				</a>
			{/if}
		</div>
		<section class="about">
			{#if description}
				<p>{description}</p>
			{/if}
			{#if learnMore}
				<a href={learnMore} target="_blank">Plus d'infos</a>
			{/if}
		</section>
	</label>

	{#if type === 'date'}
		<div class="date-and-time">
			{#if !value && conflicted}
				<p>Plusieurs valeurs</p>
			{/if}
			<input
				id="metadata-{id}"
				type="date"
				bind:value={datePart}
				onblur={() => {
					// @ts-ignore
					if (datePart && timePart) onblur(new Date(`${datePart}T${timePart}`));
				}}
			/>
			<input
				type="time"
				bind:value={timePart}
				onblur={() => {
					// @ts-ignore
					if (datePart && timePart) onblur(new Date(`${datePart}T${timePart}`));
				}}
			/>
		</div>
		<div class="ligne"></div>
	{:else if type === 'float' || type === 'integer'}
		<input
			id="metadata-{id}"
			type="text"
			inputmode="numeric"
			placeholder={conflicted ? 'Plusieurs valeurs' : 'Nombre'}
			value={value ?? ''}
			onblur={({ currentTarget }) => {
				const corced = currentTarget.valueAsNumber;
				// @ts-ignore
				if (!isNaN(corced)) onblur(corced);
			}}
		/>
		<div class="ligne"></div>
	{:else if type === 'boolean'}
		<!-- https://github.com/sveltejs/language-tools/issues/1026#issuecomment-2495493220 -->
		{/* @ts-ignore */ null}
		<Checkbox id="metadata-{id}" bind:value onchange={onblur}>
			<div class="niOuiNiNon">
				{#if value === undefined && conflicted}
					Plusieurs valeurs
				{:else if value}
					Oui
				{:else}
					Non
				{/if}
			</div>
		</Checkbox>
	{:else if type === 'enum'}
		{#if options.length <= 5}
			{/* @ts-ignore */ null}
			<RadioButtons onchange={onblur} {options} bind:value></RadioButtons>
		{:else}
			{/* @ts-ignore */ null}
			<SelectWithSearch
				id="metadata-{id}"
				placeholder={conflicted ? 'Plusieurs valeurs' : 'Rechercher…'}
				{onblur}
				{options}
				searchQuery={value ? (options.find((o) => o.key === value)?.label ?? value) : ''}
				selectedValue={typeof value === 'string' ? value : undefined}
			/>
		{/if}
	{:else if type === 'string'}
		<input id="metadata-{id}" type="text" bind:value onblur={() => onblur(value)} />
		<div class="ligne"></div>
	{:else if type === 'location'}
		<div class="subfield">
			Lat.
			{/* @ts-ignore */ null}
			{#if value?.latitude !== undefined}
				{/* @ts-ignore */ null}
				<input
					id="metadata-{id}"
					aria-label="Latitude"
					type="text"
					bind:value={value.latitude}
					onblur={() => onblur(value)}
				/>
			{:else}
				<input
					id="metadata-{id}"
					type="text"
					inputmode="numeric"
					aria-label="Latitude"
					placeholder={conflicted ? 'Plusieurs valeurs' : '43.602419'}
					bind:value={latitude}
					onblur={() => {
						// @ts-ignore
						if (latitude && longitude) onblur({ latitude, longitude });
					}}
				/>
			{/if}
		</div>
		<div class="subfield">
			Lon.
			{/* @ts-ignore */ null}
			{#if value?.longitude !== undefined}
				{/* @ts-ignore */ null}
				<input
					aria-label="Longitude"
					type="text"
					bind:value={value.longitude}
					onblur={() => onblur(value)}
				/>
			{:else}
				<input
					type="text"
					inputmode="numeric"
					aria-label="Longitude"
					placeholder={conflicted ? 'Plusieurs valeurs' : '1.456366'}
					bind:value={longitude}
					onblur={() => {
						// @ts-ignore
						if (latitude && longitude) onblur({ latitude, longitude });
					}}
				/>
			{/if}
		</div>
	{:else if getSettings().showTechnicalMetadata}
		<pre class="unrepresentable-datatype">{value
				? JSON.stringify(value, null, 2)
				: conflicted
					? 'Plusieurs valeurs'
					: 'undefined'}</pre>
	{/if}
</div>

<style>
	.meta {
		gap: 0.1em;
		display: flex;
		flex-direction: column;
	}

	label .first-line {
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
		font-size: 1em;
	}

	input:empty ~ .ligne {
		background-color: var(--gray);
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
