<script module>
	/**
	 * @typedef {object} Props
	 * @property {string|undefined} value
	 * @property {boolean} [multiple]
	 * @property {(newValue: string, newValues: string[]) => void} onValueChange
	 * @property {Pick<import('./database.js').Metadata, "id">} metadata
	 * @property {import('./database.js').MetadataEnumVariant[] | undefined} options
	 * @property {WithoutChildrenOrChild<import('bits-ui').Combobox.InputProps>} [inputProps]
	 * @property {WithoutChildrenOrChild<import('bits-ui').Combobox.ContentProps>} [contentProps]
	 * @property {string} [id]
	 * @property {Record<string, number>} [confidences]
	 * @property {Record<string, number>} [alternatives] to show as additionally selected when multiple=true
	 * @property {undefined | ((action: 'focus' | 'blur' | 'toggle') => void)} [focuser]
	 * @property {(option: import('./database.js').MetadataEnumVariant) => boolean|string} [optionIsDisabled]
	 * @property {import('svelte').ComponentProps<typeof import('$lib/MetadataInput.svelte').default>["enumOptionsExtraContent"]} [enumOptionsExtraContent]
	 */
</script>

<script>
	import Icon from '@iconify/svelte';

	import IconCheck from '~icons/ri/check-line';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';

	import Badge from './Badge.svelte';
	import { cascadeLabels } from './cascades.js';
	import Combobox from './Combobox.svelte';
	import ConfidencePercentage from './ConfidencePercentage.svelte';
	import * as idb from './idb.svelte.js';
	import { databaseHandle } from './idb.svelte.js';
	import LearnMoreLink from './LearnMoreLink.svelte';
	import Markdown from './Markdown.svelte';
	import { metadataOptionsOf } from './metadata/index.js';
	import MetadataCascadesTable from './MetadataCascadesTable.svelte';
	import { namespaceOfMetadataId } from './schemas/metadata.js';
	import { uiState } from './state.svelte';
	import { cancellable, compareBy, readableOn } from './utils.js';

	/**
	 * @import {WithoutChildrenOrChild} from 'bits-ui';
	 * @import {CascadeLabelsCache} from './cascades.js';
	 * @import {NamespacedMetadataId} from './metadata/namespacing.js';
	 * @import * as DB from './database.js';
	 */

	/**
	 * @type {Props & Omit<import('bits-ui').Combobox.RootProps, keyof Props>}
	 */
	let {
		options: precomputedOptions,
		metadata,
		multiple = false,
		alternatives = {},
		confidences = {},
		value = $bindable(),
		open = $bindable(false),
		focuser = $bindable(),
		optionIsDisabled = () => false,
		inputProps,
		contentProps,
		enumOptionsExtraContent,
		...restProps
	} = $props();

	const protocolId = $derived(namespaceOfMetadataId(metadata.id));

	const showConfidences = $derived(
		Object.keys(confidences).length > 0 &&
			Object.values(confidences).some((conf) => conf > 0 && conf < 1)
	);

	let options = $derived(precomputedOptions ?? []);

	const loadingOptions = $derived(!precomputedOptions && options.length === 0);
	const optionsLoader = cancellable(
		async (
			signal,
			/** @type {NamespacedMetadataId} */ metadataId,
			/** @type {boolean} */ precomputed
		) => {
			if (precomputed) return;
			if (!uiState.currentProtocolId) return;
			console.info('Fetching options for metadata', metadataId);
			signal.throwIfAborted();
			options = await metadataOptionsOf(
				databaseHandle(),
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

	const hasImages = $derived(options.some((opt) => opt.image));

	/**
	 * @param {DB.MetadataEnumVariant} a
	 * @param {DB.MetadataEnumVariant} b
	 */
	function compareByConfidence(a, b) {
		if (!(a.key in confidences)) return 1;
		if (!(b.key in confidences)) return -1;

		return confidences[b.key] - confidences[a.key];
	}

	/**
	 * @param {string} search
	 * @param {DB.MetadataEnumVariant} item
	 */
	function nameMatches(search, item) {
		return [item.label, ...(item.synonyms ?? [])].find((val) =>
			val.toLowerCase().includes(search.toLowerCase())
		);
	}
</script>

<div class="metadata-combobox" class:wide-docs={hasImages} class:multiple>
	<Combobox
		// Put disabled options last
		items={options.toSorted(compareBy((opt) => (optionIsDisabled(opt) ? 1 : -1)))}
		{value}
		values={multiple ? [value, ...Object.keys(alternatives)] : undefined}
		{multiple}
		bind:open
		bind:focuser
		sorter={compareByConfidence}
		searcher={nameMatches}
		viewport-testid="metadata-combobox-viewport"
		{inputProps}
		{contentProps}
		{...restProps}
	>
		{#snippet searchbox({ focusSetter, ...props })}
			<div class="searchbox">
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
							<ConfidencePercentage value={confidences[item.key]} />
						</div>
					{/if}

					{#if enumOptionsExtraContent}
						<div class="extra-content">
							{@render enumOptionsExtraContent({
								option: item,
								disabled: optionIsDisabled(item),
								selected,
								confidence: confidences[item.key],
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
				<MetadataCascadesTable {cascades} />
				{#if Object.keys(cascades).length > 0}
					<p><em>Métadonées mises à jour à la sélection de cette option</em></p>
				{/if}
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

		.searchbox {
			width: 100%;
		}

		:global(input) {
			width: 100%;
		}
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
