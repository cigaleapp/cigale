<script lang="ts" module>
	export interface Props {
		type: 'single';
		value: string | undefined;
		multiple?: boolean;
		// eslint-disable-next-line no-unused-vars
		onValueChange: (newValue: string, newValues: string[]) => void | Promise<void>;
		metadata: Pick<DB.Metadata, 'id'>;
		options: DB.MetadataEnumVariant[] | undefined;
		id?: string;
		confidences?: Record<string, number>;
		/** Override the displayed options order */
		sorter?: Comparator<DB.MetadataEnumVariant>;
		/** to show as additionally selected when multiple=true */
		alternatives?: string[];
		// eslint-disable-next-line no-unused-vars
		focuser?: undefined | ((action: 'focus' | 'blur' | 'toggle') => void);
		// eslint-disable-next-line no-unused-vars
		optionIsDisabled?: (option: DB.MetadataEnumVariant) => boolean | string;
		enumOptionsExtraContent?: Snippet<
			[
				{
					option: DB.MetadataEnumVariant;
					disabled: boolean | string;
					selected: boolean;
					confidence: number | undefined;
				},
			]
		>;
	}

	export interface PropsForSubcomponent extends Props {
		sorter: Comparator<DB.MetadataEnumVariant>;
	}
</script>

<script lang="ts">
	import type { Item } from '$lib/Combobox.svelte';
	import type * as DB from '$lib/database.js';
	import type { Comparator } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	import Carousel from '$lib/Carousel.svelte';
	import { cascadeLabels } from '$lib/cascades.js';
	import Combobox from '$lib/Combobox.svelte';
	import { Tables } from '$lib/database.js';
	import { databaseHandle } from '$lib/idb.svelte.js';
	import LearnMoreLink from '$lib/LearnMoreLink.svelte';
	import Markdown from '$lib/Markdown.svelte';
	import { resolveMetadataImport } from '$lib/metadata/namespacing.js';
	import { serializeMetadataValue } from '$lib/metadata/serializing.js';
	import { metadataIdOfOption, metadataOption } from '$lib/metadata/storage.js';
	import MetadataCascadesTable from '$lib/MetadataCascadesTable.svelte';
	import MetadataOptionCarousel from '$lib/MetadataOptionCarousel.svelte';
	import { IsMobile } from '$lib/mobile.svelte.js';
	import { makeSearcher } from '$lib/search.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { compareBy, corsfixIfLocalhost, nonnull, safeJSONParse } from '$lib/utils.js';

	let {
		focuser = $bindable(),
		optionIsDisabled,
		options,
		value,
		metadata: definition,
		confidences,
		alternatives,
		multiple,
		enumOptionsExtraContent,
		...rest
	}: Props = $props();

	function isSelected({ key }: DB.MetadataEnumVariant) {
		return [value, ...(multiple ? (alternatives ?? []) : [])].includes(key);
	}

	function confidenceOf(key: string) {
		return confidences?.[serializeMetadataValue(key)] ?? confidences?.[key];
	}

	const mobile = new IsMobile();
	const ismobile = $derived(mobile.current);

	type I = Item & { option: DB.MetadataEnumVariant };

	function optionToItem(option: DB.MetadataEnumVariant): I {
		return {
			label: option.label,
			key: option.key,
			color: option.color,
			icon: option.icon,
			thumbnail: option.images?.at(0),
			disabled: optionIsDisabled?.(option),
			confidence: confidenceOf(option.key),
			option,
		};
	}
</script>

{#snippet itemExtraContent(
	{ option, disabled, confidence }: I,
	{ selected }: { selected: boolean }
)}
	{@render enumOptionsExtraContent?.({ option, disabled, selected, confidence })}
{/snippet}

<Combobox
	{multiple}
	{value}
	{...rest}
	viewport-testid="metadata-combobox-viewport"
	itemExtraContent={enumOptionsExtraContent ? itemExtraContent : undefined}
	values={(multiple ? [value, ...(alternatives ?? [])] : [value]).filter(nonnull)}
	bind:focuser
	sorter={rest.sorter ??
		compareBy((item) => {
			if (isSelected(item)) return Number.NEGATIVE_INFINITY;
			if (item.disabled) return Number.POSITIVE_INFINITY;
			return -(confidenceOf(item.key) ?? 0);
		})}
	preloadedItems={options?.map(optionToItem)}
	loadItem={async (key) => {
		const raw = await metadataOption(databaseHandle(), definition.id, key);
		const opt = Tables.MetadataOption.assert(raw);
		return optionToItem(opt);
	}}
	suggestions={async function* () {
		const confs = Object.entries(confidences ?? {}).sort(compareBy(([, score]) => -score));

		for (let i = 0; i < Math.min(100, confs.length); i++) {
			const [key] = confs[i];
			yield safeJSONParse(key)?.toString() ?? key.toString();
		}
	}}
	searcher={async function* (query: string) {
		const protocol = uiState.currentProtocol;
		if (!protocol) return;

		const searcher = await makeSearcher({
			db: databaseHandle(),
			tables: Tables,
			table: 'MetadataOption',
			max: 30,
			filter: (id) =>
				metadataIdOfOption(protocol, id) === resolveMetadataImport(protocol, definition.id),
		});

		for await (const result of searcher(query)) {
			yield optionToItem(result);
		}
	}}
>
	{#snippet details({ option, confidence }, { expand, expanded })}
		{#if ismobile}
			<MetadataOptionCarousel
				bind:expanded={() => expanded, expand}
				{option}
				debugdata={{
					multiple,
					alternatives,
					value,
					confidence,
					confidences: Object.entries(confidences ?? {})
						.sort(compareBy(([, confidence]) => -confidence))
						.map(([key, val]) => `${key} @ ${val}`),
				}}
			/>
		{:else}
			{const { images, description, learnMore, label } = $derived(option)}

			{#if images?.length}
				<div class="carousel">
					<Carousel items={images} slideName={(_, i) => `Slide n°${i + 1}`}>
						{#snippet item(src)}
							<img src={corsfixIfLocalhost(src)} />
						{/snippet}
					</Carousel>
				</div>
			{:else if description || learnMore}
				<h2>{label}</h2>
			{/if}

			{#if description}
				<section class="description">
					<Markdown source={description} />
				</section>
			{/if}

			{#if learnMore}
				<LearnMoreLink href={learnMore} />
			{/if}

			{#await cascadeLabels( { db: databaseHandle(), protocolId: uiState.currentProtocolId, option } ) then cascades}
				<MetadataCascadesTable explain {cascades} />
			{:catch error}
				<p class="error">
					Erreur lors de la récupération des étiquettes en cascade: {error}
				</p>
			{/await}
		{/if}
	{/snippet}
</Combobox>

<style>
	.carousel {
		height: 300px;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}
</style>
