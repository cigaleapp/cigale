<script lang="ts">
	import type { PropsForSubcomponent } from './MetadataCombobox.svelte';
	import type { NamespacedMetadataID } from './schemas/common.js';
	import type * as DB from '$lib/database.js';

	import Icon from '@iconify/svelte';

	import IconCheck from '~icons/ri/check-line';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';

	import Badge from './Badge.svelte';
	import { cascadeLabels } from './cascades.js';
	import Combobox from './Combobox.svelte';
	import ConfidencePercentage from './ConfidencePercentage.svelte';
	import * as idb from './idb.svelte.js';
	import LearnMoreLink from './LearnMoreLink.svelte';
	import Markdown from './Markdown.svelte';
	import { metadataOptionsOf, serializeMetadataValue } from './metadata/index.js';
	import MetadataCascadesTable from './MetadataCascadesTable.svelte';
	import { namespaceOfMetadataId } from './schemas/metadata.js';
	import { uiState } from './state.svelte';
	import { cancellable, readableOn } from './utils.js';

	let {
		options: precomputedOptions,
		metadata,
		multiple = false,
		alternatives = [],
		confidences = {},
		sorter,
		value = $bindable(),
		open = $bindable(false),
		focuser = $bindable(),
		optionIsDisabled = () => false,
		enumOptionsExtraContent,
		...restProps
	}: PropsForSubcomponent = $props();

	const protocolId = $derived(namespaceOfMetadataId(metadata.id));

	const showConfidences = $derived(
		Object.keys(confidences).length > 0 &&
			Object.values(confidences).some((conf) => conf > 0 && conf < 1)
	);

	const hasImages = $derived(options.some((opt) => opt.image));

	function nameMatches(search: string, item: DB.MetadataEnumVariant) {
		return [item.label, ...(item.synonyms ?? [])].find((val) =>
			val.toLowerCase().includes(search.toLowerCase())
		);
	}

	const confidenceOf = $derived((key: string) => confidences[serializeMetadataValue(key)]);

	let options = $derived(precomputedOptions ?? []);

	const loadingOptions = $derived(!precomputedOptions && options.length === 0);
	const optionsLoader = cancellable(
		async (signal, metadataId: NamespacedMetadataID, precomputed: boolean) => {
			if (precomputed) return;
			if (!uiState.currentProtocolId) return;
			console.info('Fetching options for metadata', metadataId);
			signal.throwIfAborted();
			options = await metadataOptionsOf(
				await idb.openDatabase(),
				uiState.currentProtocolId,
				metadataId
			);
			console.info('Fetched options for metadata', metadataId, options);
		}
	);

	$effect(() => {
		const loader = optionsLoader(metadata.id, Boolean(precomputedOptions));

		loader.do();
		return loader.cancel;
	});
</script>

<div class="metadata-combobox" class:wide-docs={hasImages} class:multiple>
	<Combobox
		// Put selected options first, and disabled options last
		items={options}
		{value}
		values={multiple ? [value, ...alternatives].filter((v) => v !== undefined) : undefined}
		{multiple}
		bind:open
		bind:focuser
		{sorter}
		searcher={nameMatches}
		viewport-testid="metadata-combobox-viewport"
		{...restProps}
	>
		{#snippet searchbox({ focusSetter, ...props })}
			<div class="searchbox" data-combobox-trigger>
				{#if loadingOptions}
					<LoadingText value={Loading}>Chargement</LoadingText>
				{:else}
					<input {...props} {@attach focusSetter} />
				{/if}
			</div>
		{/snippet}
		{#snippet listItem({ selected, ...item })}
			<div class="item" class:selected class:disabled={optionIsDisabled(item)}>
				<div class="check">
					<IconCheck />
				</div>
				<span class="label">
					{item.label}
					{#if item.matchedFrom && item.matchedFrom !== item.label}
						<br />
						<span class="aka">
							<Badge tooltip="Aussi connu sous le nom de">AKA</Badge>
							{item.matchedFrom}
						</span>
					{/if}
				</span>
				<div class="right">
					{#if item.icon || item.color}
						<div
							class="icon"
							style:background-color={item.color}
							style:color={item.color ? readableOn(item.color) : undefined}
						>
							{#if item.icon}
								<Icon icon={item.icon} />
							{/if}
						</div>
					{/if}

					{#if showConfidences}
						<div class="confidence">
							<ConfidencePercentage value={confidenceOf(item.key)} />
						</div>
					{/if}

					{#if enumOptionsExtraContent}
						<div class="extra-content">
							{@render enumOptionsExtraContent({
								option: item,
								disabled: optionIsDisabled(item),
								selected,
								confidence: confidenceOf(item.key),
							})}
						</div>
					{/if}
				</div>
			</div>
		{/snippet}

		{#snippet highlight(o)}
			{@const image = o.image ?? o.images?.at(0)}

			{#if image}
				<img src={image} alt="" />
			{:else if o.description || o.learnMore}
				<h2>{o.label}</h2>
			{/if}

			{#if o.description}
				<section class="description">
					<Markdown source={o.description} />
				</section>
			{/if}

			{#if o.learnMore}
				<LearnMoreLink href={o.learnMore} />
			{/if}

			{#await cascadeLabels( { db: idb.databaseHandle(), protocolId, option: o } ) then cascades}
				<MetadataCascadesTable explain {cascades} />
			{:catch error}
				<p class="error">
					Erreur lors de la récupération des étiquettes en cascade: {error}
				</p>
			{/await}
		{/snippet}
	</Combobox>
</div>

<style>
	.metadata-combobox {
		width: 100%;

		.searchbox,
		.searchbox input {
			width: 100%;
		}
	}

	.searchbox input {
		font-size: 1em;
		background: transparent;
	}

	.metadata-combobox.wide-docs {
		--combobox-content-width: 800px;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.item.selected {
		color: var(--fg-primary);
		font-weight: bold;
	}

	.item.disabled {
		opacity: 0.5;
	}

	.item .right {
		margin-left: auto;
	}

	.item .check {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.item:not(.selected) .check {
		opacity: 0;
		visibility: hidden;
	}

	.item .label .aka {
		font-size: 0.85em;
		font-style: italic;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	img {
		width: 100%;
		border-radius: calc(2 * var(--corner-radius) - var(--viewport-padding) / 2);
		overflow: hidden;
		flex-shrink: 0;
	}
</style>
