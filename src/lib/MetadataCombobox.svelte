<script module>
	/**
	 * @typedef {object} Props
	 * @property {string|undefined} value
	 * @property {(newValue: string) => void} onValueChange
	 * @property {import('./database.js').MetadataEnumVariant[]} options
	 * @property {WithoutChildrenOrChild<import('bits-ui').Combobox.InputProps>} [inputProps]
	 * @property {WithoutChildrenOrChild<import('bits-ui').Combobox.ContentProps>} [contentProps]
	 * @property {string} [id]
	 * @property {Record<string, number>} [confidences]
	 * @property {(action: 'focus' | 'blur' | 'toggle') => void} [focuser]
	 */
</script>

<script>
	import Icon from '@iconify/svelte';

	import IconCheck from '~icons/ri/check-line';

	import Badge from './Badge.svelte';
	import { cascadeLabels } from './cascades.js';
	import Combobox from './Combobox.svelte';
	import ConfidencePercentage from './ConfidencePercentage.svelte';
	import * as idb from './idb.svelte.js';
	import LearnMoreLink from './LearnMoreLink.svelte';
	import Markdown from './Markdown.svelte';
	import MetadataCascadesTable from './MetadataCascadesTable.svelte';
	import { uiState } from './state.svelte';
	import { readableOn } from './utils.js';

	/**
	 * @import {WithoutChildrenOrChild} from 'bits-ui';
	 * @import {CascadeLabelsCache} from './cascades.js';
	 * @import * as DB from './database.js';
	 */

	/**
	 * @type {Props & Omit<import('bits-ui').Combobox.RootProps, keyof Props>}
	 */
	let {
		options,
		confidences = {},
		value = $bindable(),
		open = $bindable(false),
		focuser = $bindable(),
		inputProps,
		contentProps,
		...restProps
	} = $props();

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
		return [item.label, ...item.synonyms].find((val) =>
			val.toLowerCase().includes(search.toLowerCase())
		);
	}

	/**
	 * @type {CascadeLabelsCache}
	 */
	let cascadeLabelsCache = $state({});
</script>

<div class="metadata-combobox" class:wide-docs={hasImages}>
	<Combobox
		items={options}
		{value}
		bind:open
		bind:focuser
		sorter={compareByConfidence}
		searcher={nameMatches}
		viewport-testid="metadata-combobox-viewport"
		{inputProps}
		{contentProps}
		{...restProps}
	>
		{#snippet listItem({ selected, ...item })}
			<div class="item" class:selected>
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
					<div class="confidence">
						<ConfidencePercentage value={confidences[item.key]} />
					</div>
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

			{#await cascadeLabels( { cache: cascadeLabelsCache, db: idb.databaseHandle(), protocolId: uiState.currentProtocolId, option: o } ) then cascades}
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
