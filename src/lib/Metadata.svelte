<script lang="ts" generics="T extends MetadataType">
	import type { Metadata, MetadataEnumVariant } from './database.js';
	import type { TypedMetadataValue } from './metadata/index.js';
	import type { MetadataType, RuntimeValue } from './schemas/metadata.js';
	import type { NumericUnit } from './schemas/units.js';
	import type { ComponentProps } from 'svelte';

	import { ArkErrors } from 'arktype';

	import IconRequired from '~icons/ri/asterisk';
	import IconCheck from '~icons/ri/check-line';
	import IconClear from '~icons/ri/close-line';
	import IconTechnical from '~icons/ri/settings-line';
	import IconMerged from '~icons/ri/stack-line';
	import Carousel from '$lib/Carousel.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import { addPointToGeoPolygon } from '$lib/geolocation.js';
	import { databaseHandle } from '$lib/idb.svelte.js';
	import LoadingText from '$lib/LoadingText.svelte';
	import {
		metadataValueValidatorDate,
		metadataValueValidatorNumeric,
		metadataValueValidatorString,
	} from '$lib/metadata/constraints.js';
	import { serializeMetadataValue } from '$lib/metadata/index.js';
	import { metadataOption } from '$lib/metadata/storage.js';
	import MetadataInput from '$lib/MetadataInput.svelte';
	import { IsMobile } from '$lib/mobile.svelte.js';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { splitMetadataId } from '$lib/schemas/metadata.js';
	import { isDebugMode } from '$lib/settings.svelte.js';
	import { tooltip } from '$lib/tooltips.js';
	import {
		compareBy,
		corsfixIfLocalhost,
		ensureArray,
		indexOfMin,
		orEmpty,
		pick,
		safeJSONParse,
		switchValue,
	} from '$lib/utils.js';
	import WorldMap from '$lib/WorldMap.svelte';

	type Props = {
		definition: Metadata;
		options?: MetadataEnumVariant[] | undefined;
		value: undefined | TypedMetadataValue<NoInfer<T>>;
		merged?: boolean;
		/** Control presentation of enum metadata inputs. Auto means use the metadata definition's presentation setting */
		'enum-presentation': 'auto' | 'dropdown-only';
		/** Display requiredness indicators */
		requiredness: 'all' | 'required' | 'none';
		onvalidation?: (
			/** Empty if okay */
			// eslint-disable-next-line no-unused-vars
			messages: string[]
		) => void;
		onchange?: (
			// eslint-disable-next-line no-unused-vars
			data: {
				value: undefined | RuntimeValue<T>;
				unit?: undefined | typeof NumericUnit.infer;
				alternatives?: RuntimeValue<T>[];
				nodes: {
					metadata: HTMLElement | undefined;
				};
			}
		) => Promise<void>;
	} & Pick<
		ComponentProps<typeof MetadataInput>,
		| 'addToAlternativesBySelect'
		| 'removeByDeselect'
		| 'optionIsDisabled'
		| 'enumOptionsExtraContent'
	>;

	let {
		value,
		merged,
		definition,
		requiredness,
		options = undefined,
		onchange = async () => {},
		onvalidation = () => {},
		'enum-presentation': enumPresentation,
		...inputProps
	}: Props = $props();

	const mobile = new IsMobile();

	/** If we have addToAlternativesBySelect, the alternatives are already shown for enum metadata */
	const showSuggestions = $derived(
		!mobile.current &&
			(inputProps.addToAlternativesBySelect ? definition.type !== 'enum' : true)
	);

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
		definition.type === 'enum' &&
			enumPresentation !== 'dropdown-only' &&
			switchValue(definition.presentation, {
				auto: definition._optionsCount > 0 && definition._optionsCount <= 10,
				dropdown: false,
				buttons: definition._optionsCount < 100,
			})
	);

	const inputIsInline = $derived(!isCompactEnum && definition.type !== 'file');

	const displayImageOnTheSide = $derived(
		definition.images.length === 1 && (inputIsInline || definition.type === 'enum')
	);

	const optional = $derived(requiredness === 'all' && !definition.required);
	const required = $derived(requiredness !== 'none' && definition.required);
	const suggestions = $derived(
		Object.entries(value?.confidences ?? {})
			.filter(([jsonValue]) => jsonValue !== serializeMetadataValue(value?.value))
			.sort(compareBy(([, score]) => -score))
			.slice(0, 3)
	);

	let element = $state<HTMLElement>();
</script>

<div class="metadata" bind:this={element}>
	<div class="side-image-and-main-area">
		{#if displayImageOnTheSide}
			<div class="side-image">
				<img loading="lazy" src={corsfixIfLocalhost(definition.images[0])} />
			</div>
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
							<OverflowableText text={splitMetadataId(definition.id).id} />
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

	{#if showSuggestions && value && suggestions.length > 0}
		<section class="alternatives">
			<div class="title">Suggestions</div>
			<ul class="options">
				<!-- TODO add expand button to show all alternatives -->
				{#each suggestions as [jsonValue, confidence] (jsonValue)}
					{@const stringValue = safeJSONParse(jsonValue)?.toString()}
					<li>
						<div class="value">
							<LoadingText
								value={async () => {
									if (definition.type === 'enum') {
										const option = await metadataOption(
											databaseHandle(),
											definition.id,
											stringValue
										).catch(() => null);
										return option?.label ?? stringValue;
									}

									return stringValue;
								}}
							>
								{#snippet loaded(label)}
									{label}
								{/snippet}
							</LoadingText>
						</div>
						<ConfidencePercentage value={confidence} />
						<button
							use:tooltip={'Sélectionner cette valeur'}
							onclick={async () => {
								value = {
									value: JSON.parse(jsonValue),
									confidence,
									confidences: value?.confidences ?? {},
								};
								await onchange({
									value: value?.value,
									unit: value?.unit,
									nodes: { metadata: element },
								});
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

	{#if definition.type === 'location' || definition.type === 'surface'}
		{@const points = ensureArray(
			(value as TypedMetadataValue<'location' | 'surface'> | undefined)?.value ?? []
		)}

		<section class="map">
			<WorldMap
				draw={switchValue(definition.type, {
					location: 'nothing',
					surface: 'area',
				})}
				onNewMarker={async ({ lngLat: { lng, lat } }) => {
					const point = { latitude: lat, longitude: lng };

					if (definition.type === 'location') {
						await onchange?.({ value: point });
						return;
					}

					await onchange?.({
						value: addPointToGeoPolygon(points, point),
					});
				}}
				markers={points.map((coords, i) => ({
					...coords!,
					key: JSON.stringify(coords),
					async onDelete({ lngLat: [longitude, latitude] }) {
						await onchange?.({
							value:
								definition.type === 'surface' && points.length > 1
									? points.filter(
											(p) =>
												p.longitude !== longitude || p.latitude !== latitude
										)
									: undefined,
						});
					},
					async onMove({ lngLat: [longitude, latitude] }) {
						await onchange?.({
							value:
								definition.type === 'surface'
									? points.with(i, { latitude, longitude })
									: { latitude, longitude },
							nodes: { metadata: element },
						});
					},
				}))}
			/>
		</section>
	{/if}
	{#if isDebugMode()}
		<pre class="debug">{JSON.stringify(
				{
					type: definition.type,
					...splitMetadataId(definition.id),
					...(options && options.length <= 10 ? { options } : {}),
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
		{...inputProps}
		value={value?.value}
		unit={value?.unit}
		{validationErrors}
		{isCompactEnum}
		confidences={value
			? {
					[serializeMetadataValue(value.value)]: value.confidence,
					...value.confidences,
				}
			: {}}
		alternatives={value?.alternatives ?? []}
		onblur={async (val, unit, alternatives) => {
			// We eagerly update value.unit because otherwise it gets updated after the DB changes
			// the validator would update separately to the unit+value change
			// which causes a flickering false validation error
			if (value && unit) value.unit = unit;

			await onchange({
				value: val,
				unit,
				alternatives,
				nodes: { metadata: element },
			});

			validation = val !== undefined ? valueValidator?.(val) : undefined;
		}}
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
		onclick={async () => {
			if (!value) return;
			value = undefined;
			await onchange({
				value: undefined,

				nodes: { metadata: element },
			});
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
		--image-size: var(--metadata-side-image-size, calc(min(10dvw, 8rem)));
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
		@media (max-width: 600px) {
			flex-wrap: var(--metadata-first-line-wrap, wrap);
		}
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
		max-width: 67ch;
		font-size: 0.9rem;
		color: var(--gay);
	}

	label {
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
		flex-wrap: wrap;
	}

	.alternatives .title {
		color: var(--gray);
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
		overflow-y: auto;
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
