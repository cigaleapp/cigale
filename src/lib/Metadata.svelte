<script lang="ts" generics="T extends MetadataType">
	import type { Metadata, MetadataEnumVariant } from './database.js';
	import type { TypedMetadataValue } from './metadata/index.js';
	import type { MetadataType, RuntimeValue } from './schemas/metadata.js';
	import type { NumericUnit } from './schemas/units.js';

	import { ArkErrors } from 'arktype';

	import IconRequired from '~icons/ri/asterisk';
	import IconCheck from '~icons/ri/check-line';
	import IconClear from '~icons/ri/close-line';
	import IconTechnical from '~icons/ri/settings-line';
	import IconMerged from '~icons/ri/stack-line';

	import Carousel from './Carousel.svelte';
	import ConfidencePercentage from './ConfidencePercentage.svelte';
	import {
		metadataValueValidatorDate,
		metadataValueValidatorNumeric,
		metadataValueValidatorString,
	} from './metadata/constraints.js';
	import { hasRuntimeType } from './metadata/index.js';
	import MetadataInput from './MetadataInput.svelte';
	import OverflowableText from './OverflowableText.svelte';
	import { splitMetadataId } from './schemas/metadata.js';
	import { isDebugMode } from './settings.svelte.js';
	import { tooltip } from './tooltips.js';
	import { orEmpty, pick, safeJSONParse } from './utils.js';
	import WorldMap from './WorldMap.svelte';

	interface Props {
		definition: Metadata;
		options?: MetadataEnumVariant[];
		value: undefined | TypedMetadataValue<NoInfer<T>>;
		merged?: boolean;
		/** Display requiredness indicators */
		requiredness: 'all' | 'required' | 'none';
		onvalidation?: (
			/** Empty if okay */
			// eslint-disable-next-line no-unused-vars
			messages: string[]
		) => void;
		onchange?: (
			// eslint-disable-next-line no-unused-vars
			value: undefined | RuntimeValue<T>,
			// eslint-disable-next-line no-unused-vars
			unit?: undefined | typeof NumericUnit.infer
		) => void;
	}

	let {
		value,
		merged,
		definition,
		requiredness,
		options = [],
		onchange = () => {},
		onvalidation = () => {},
	}: Props = $props();

	const valueValidator = $derived.by(() => {
		switch (definition.type) {
			case 'string':
				return metadataValueValidatorString(definition);
			case 'integer':
			case 'float':
				return metadataValueValidatorNumeric(definition, value?.unit);
			// return
			case 'date':
				return metadataValueValidatorDate(definition);
			default:
				return undefined;
		}
	});

	let validation: ArkErrors | unknown = $derived(
		value?.value !== undefined ? valueValidator?.(value.value) : undefined
	);

	const validationErrors = $derived(validation instanceof ArkErrors ? validation : undefined);

	$effect(() => {
		onvalidation([
			...(validationErrors?.map((error) => error.message) ?? []),
			...orEmpty(definition.required && value === undefined, 'Obligatoire'),
		]);
	});

	const _id = $props.id();

	const isCompactEnum = $derived(
		definition.type === 'enum' && options.length <= 10 && !options.some((opt) => opt.learnMore)
	);

	const inputIsInline = $derived(!isCompactEnum && definition.type !== 'file');

	const displayImageOnTheSide = $derived(
		definition.images.length === 1 && (inputIsInline || definition.type === 'enum')
	);

	const optional = $derived(requiredness === 'all' && !definition.required);
	const required = $derived(requiredness !== 'none' && definition.required);
</script>

<div class="metadata">
	<div class="side-image-and-main-area">
		{#if displayImageOnTheSide}
			<div class="side-image"><img src={definition.images[0]} /></div>
		{/if}
		<div class="main-area">
			<section class="first-line">
				<label for={_id}>
					{#if required}
						<div class="required-indicator" use:tooltip={'Métadonnée obligatoire'}>
							<IconRequired />
						</div>
					{/if}
					{#if definition.label}
						<OverflowableText text={definition.label} />
					{:else}
						<div class="technical-indicator" use:tooltip={'Métadonnée technique'}>
							<IconTechnical />
						</div>
						<code>
							<OverflowableText text={definition.id} />
						</code>
					{/if}
				</label>
				<div class="value">
					{#if inputIsInline}
						{@render input()}
					{/if}
					{@render extraInline()}
				</div>
			</section>
			{#if !inputIsInline}
				{@render description()}
			{/if}
		</div>
	</div>

	{#if !inputIsInline}
		<div class="input-line">
			{@render input()}
		</div>
	{/if}

	{#if value && Object.keys(value.alternatives).length > 0}
		<section class="alternatives">
			<div class="title">Alternatives</div>
			<ul class="options">
				<!-- TODO add expand button to show all alternatives -->
				{#each Object.entries(value.alternatives)
					.sort(([, a], [, b]) => b - a)
					.slice(0, 3) as [jsonValue, confidence] (jsonValue)}
					{@const stringValue = safeJSONParse(jsonValue)?.toString()}
					{@const enumVariant = hasRuntimeType('enum', stringValue)
						? options?.find(({ key }) => key === stringValue)
						: undefined}
					<li>
						<div class="value" use:tooltip={enumVariant?.description}>
							{enumVariant?.label || stringValue}
						</div>
						<ConfidencePercentage value={confidence} />
						<button
							use:tooltip={'Sélectionner cette valeur'}
							onclick={() => {
								value = {
									value: JSON.parse(jsonValue),
									confidence,
									alternatives: value?.alternatives ?? {},
								};
								onchange(value?.value, value?.unit);
							}}
						>
							<IconCheck />
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if inputIsInline}
		{@render description()}
	{/if}

	{#if definition.type === 'location'}
		{@const coords = (value as TypedMetadataValue<'location'> | undefined)?.value}

		<section class="map">
			<WorldMap
				onNewMarker={({ lngLat: { lng, lat } }) => {
					onchange?.({ latitude: lat, longitude: lng });
				}}
				markers={orEmpty(coords !== undefined, {
					...coords!,
					id: '_',
					onMove({ lngLat: [longitude, latitude] }) {
						onchange?.({ latitude, longitude });
					},
				})}
			/>
		</section>
	{/if}
	{#if isDebugMode()}
		<pre class="debug">{JSON.stringify(
				{
					type: definition.type,
					...splitMetadataId(definition.id),
					...(options.length <= 10 ? { options } : {}),
					value,
					validationErrors,
					constraints: {
						...pick(definition, 'pattern', 'regex', 'range', 'accept', 'size'),
					},
				},
				(_k, v) => (v instanceof RegExp ? v.source : v),
				2
			)}</pre>
	{/if}
</div>

{#snippet description()}
	{#if definition.description || definition.learnMore || optional}
		<section class="learnmore">
			{#if definition.description || optional}
				<p>
					{#if optional}
						<em class="optional">(Optionnel)</em>
					{/if}
					{definition.description}
				</p>
			{/if}
			{#if definition.learnMore}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={definition.learnMore} target="_blank">En savoir plus</a>
			{/if}
		</section>
	{/if}

	{#if definition.images.length > 0 && !displayImageOnTheSide}
		<section class="images">
			<Carousel items={definition.images} slideName={(_, i) => `Image ${i + 1}`}>
				{#snippet item(src)}
					<img {src} />
				{/snippet}
			</Carousel>
		</section>
	{/if}

	{#if validationErrors}
		<section class="validation">
			{validationErrors.summary}
		</section>
	{/if}
{/snippet}

{#snippet input()}
	<MetadataInput
		id={_id}
		{definition}
		{options}
		value={value?.value}
		unit={value?.unit}
		{validationErrors}
		onblur={(val, unit) => {
			// We eagerly update value.unit because otherwise it gets updated after the DB changes
			// the validator would update separately to the unit+value change
			// which causes a flickering false validation error
			if (value) value.unit = unit;
			onchange(val, unit);
			validation = val !== undefined ? valueValidator?.(val) : undefined;
		}}
		{isCompactEnum}
		confidences={Object.fromEntries([
			...Object.entries(value?.alternatives ?? {}).map(([key, value]) => [
				safeJSONParse(key)?.toString(),
				value,
			]),
			[safeJSONParse(value?.value)?.toString(), value?.confidence],
		])}
	/>
{/snippet}

{#snippet extraInline()}
	{#if value?.confidence}
		<ConfidencePercentage no-fallback value={value.confidence} />
	{/if}
	{#if merged}
		<div
			class="merged-indicator"
			use:tooltip={'Valeur issue de la fusion de plusieurs valeurs différentes. Modifier cette valeur pour modifier toutes les valeurs de la sélection'}
		>
			<IconMerged />
		</div>
	{/if}
	<button
		class="clear"
		use:tooltip={'Supprimer cette valeur'}
		aria-label="Supprimer cette valeur"
		disabled={!value || value.isDefault}
		onclick={() => {
			if (!value) return;
			value = undefined;
			onchange(undefined);
		}}
	>
		<IconClear />
	</button>
{/snippet}

<style>
	.metadata,
	.main-area {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		scroll-padding-top: 20px;
	}

	.side-image-and-main-area:has(.side-image) {
		display: grid;
		--image-size: 8rem;
		--gap: 1em;
		grid-template-columns: var(--image-size) calc(100% - var(--image-size) - var(--gap));
		gap: var(--gap);

		.side-image {
			width: var(--image-size);
			height: var(--image-size);
			flex-shrink: 0;

			img {
				object-fit: contain;
				width: 100%;
				height: 100%;
			}
		}
	}

	.first-line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
	}
	.value {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}
	button {
		border: none;
		background: none;
		cursor: pointer;
	}

	.metadata:not(:hover):not(:focus-within) button:not(.clear) {
		opacity: 0;
	}

	button:disabled {
		opacity: 0.25;
	}

	.learnmore p {
		text-wrap: balance;
	}

	label {
		text-transform: uppercase;
		color: var(--gay);
		letter-spacing: 0.15em;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.required-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--fg-error);
		font-size: 0.75em;
	}

	.alternatives {
		display: flex;
		justify-content: space-between;
	}

	.alternatives .title {
		text-transform: uppercase;
		color: var(--gray);
		letter-spacing: 0.2ch;
	}

	.alternatives ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		justify-content: end;
		margin-top: 0.5em;
		gap: 0.25em;
	}
	.alternatives li {
		display: flex;
		align-items: center;
		justify-content: end;
		gap: 0.5em;
	}

	.merged-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--fg-primary);
	}

	.debug {
		font-size: 0.7em;
	}

	.map {
		height: 15rem;
		border-radius: var(--corner-radius);
		overflow: hidden;
		margin: 1rem 0;
	}

	.validation {
		color: var(--fg-error);
	}

	.images {
		width: 100%;
		height: 20rem;

		img {
			object-fit: contain;
			width: 100%;
			height: 100%;
		}
	}

	.optional {
		color: var(--gay);
	}
</style>
