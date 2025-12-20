<script>
	import Icon from '@iconify/svelte';
	import VirtualList from '@sveltejs/svelte-virtual-list';
	import { Combobox, mergeProps } from 'bits-ui';
	import { marked } from 'marked';

	import IconArrowRight from '~icons/ri/arrow-right-line';
	import IconCheck from '~icons/ri/check-line';

	import Badge from './Badge.svelte';
	import ConfidencePercentage from './ConfidencePercentage.svelte';
	import * as idb from './idb.svelte.js';
	import { tables } from './idb.svelte.js';
	import Logo from './Logo.svelte';
	import OverflowableText from './OverflowableText.svelte';
	import { metadataOptionId, namespacedMetadataId } from './schemas/metadata.js';
	import ScrollFader from './ScrollFader.svelte';
	import { isDebugMode } from './settings.svelte';
	import { uiState } from './state.svelte';
	import { compareBy, pick, readableOn } from './utils.js';

	/**
	 * @import {WithoutChildrenOrChild} from 'bits-ui';
	 */

	/** @typedef { { value: string; label: string; synonyms: string[], icon?: string, color?: string } } Item */
	/**
	 * @typedef {object} Props
	 * @property {import('./database.js').MetadataEnumVariant[]} options
	 * @property {WithoutChildrenOrChild<Combobox.InputProps>} [inputProps]
	 * @property {WithoutChildrenOrChild<Combobox.ContentProps>} [contentProps]
	 * @property {string} [id]
	 * @property {Record<string, number>} [confidences]
	 */

	/**
	 * @type {Props & Combobox.RootProps}
	 */
	let {
		options,
		confidences = {},
		value = $bindable(),
		open = $bindable(false),
		inputProps,
		contentProps,
		...restProps
	} = $props();

	let searchValue = $state('');

	const hasImages = $derived(options.some((opt) => opt.image));

	const label = $derived(options.find((opt) => opt.key === value)?.label ?? '');

	/** @type {Item[]} */
	const items = $derived(
		options.map(({ key, ...rest }) => ({
			value: key,
			...pick(rest, 'label', 'synonyms', 'icon', 'color')
		}))
	);

	/**
	 * @param {string} search
	 * @param  {...string} values
	 */
	const nameMatches = (search, ...values) =>
		values.some((val) => val.toLowerCase().includes(search.toLowerCase()));

	const filteredItems = $derived.by(() => {
		if (searchValue === '') {
			return [
				...items
					.filter(({ value }) => value in confidences)
					.toSorted((a, b) => confidences[b.value] - confidences[a.value]),
				...items.filter(({ value }) => !(value in confidences))
			].map((item) => ({ ...item, matchedFrom: item.label }));
		}

		return items
			.filter((item) => nameMatches(searchValue, item.label, ...item.synonyms))
			.map((item) => ({
				...item,
				matchedFrom: nameMatches(searchValue, item.label)
					? item.label
					: item.synonyms.find((syn) => nameMatches(searchValue, syn))
			}))
			.toSorted(compareBy(({ label, matchedFrom }) => (label === matchedFrom ? 0 : 1)));
	});

	/**
	 * @param {Event & { currentTarget: HTMLInputElement }} e
	 */
	function handleInput(e) {
		searchValue = e.currentTarget.value;
	}

	/**
	 * @param {boolean} newOpen
	 */
	function handleOpenChange(newOpen) {
		if (!newOpen) searchValue = '';
	}

	const mergedRootProps = $derived(mergeProps(restProps, { onOpenChange: handleOpenChange }));
	const mergedInputProps = $derived(
		mergeProps(inputProps, {
			oninput: handleInput,
			onfocus: () => (open = true),
			defaultValue: label
		})
	);

	/** @type {undefined | import('./database').MetadataEnumVariant} */
	let highlightedOption = $state();

	/**
	 * @type {Record<string, Record<string, { value: string; metadata: string; depth: number, color?: string, icon?: string }>>}
	 */
	let cascadeLabelsCache = $state({});
	$effect(() => {
		// Halve cache when its size reaches 4000
		if (Object.keys(cascadeLabelsCache).length > 4000) {
			console.debug('Halving cascadeLabels cache');
			cascadeLabelsCache = Object.fromEntries(Object.entries(cascadeLabelsCache).slice(2000));
		}
	});

	async function cascadeLabels() {
		const protocolId = uiState.currentProtocol?.id;
		if (!protocolId) return {};
		if (!highlightedOption) return {};

		if (highlightedOption.key in cascadeLabelsCache) {
			return cascadeLabelsCache[highlightedOption.key];
		}

		/**
		 * Subfunction to recursively collect cascades.
		 * Base case: at some point all options will have no cascades
		 * @param {string} protocolId
		 * @param {Record<string, string>} cascade - The cascade we're collecting from
		 * @param {Set<string>} seen id of metadata already seen, to avoid cycles
		 * @param {number} [depth=0] - Current depth in the cascade
		 */
		async function collect(protocolId, cascade, seen, depth = 0) {
			/**
			 * @type {typeof cascadeLabelsCache[string]} labels
			 */
			const labels = {};
			for (const [metadataId, value] of Object.entries(cascade ?? {})) {
				if (seen.has(metadataId)) continue; // Avoid cycles
				seen.add(metadataId); // Mark this metadataId as seen
				const metadata = await tables.Metadata.get(
					namespacedMetadataId(protocolId, metadataId)
				);
				if (!metadata) continue;

				// If the cascaded metadata value is from an enum, use label instead of the key,
				// and see if there are nested cascades further down
				if (metadata.type === 'enum') {
					const option = await idb.get(
						'MetadataOption',
						metadataOptionId(namespacedMetadataId(protocolId, metadata.id), value)
					);
					if (!option) continue;
					labels[metadata.id] = {
						value: option.label,
						metadata: metadata.label,
						depth,
						...pick(option, 'color', 'icon')
					};

					if (Object.keys(option.cascade ?? {}).length > 0) {
						await collect(protocolId, option.cascade ?? {}, seen, depth + 1).then(
							(nested) => {
								Object.assign(labels, nested);
							}
						);
					}
				} else {
					// For other types, just show the value directly
					labels[metadata.id] = {
						value: value,
						metadata: metadata.label,
						depth
					};
				}
			}

			return labels;
		}

		cascadeLabelsCache[highlightedOption.key] = await collect(
			protocolId,
			highlightedOption.cascade ?? {},
			new Set()
		);

		return cascadeLabelsCache[highlightedOption.key];
	}
</script>

<Combobox.Root {value} bind:open {...mergedRootProps} {items}>
	<!-- <div class="search-icon" class:shown={open}>
		<IconSearch />
	</div> -->
	<Combobox.Input {...mergedInputProps}>
		{#snippet child({ props: { value, ...props } })}
			<input {...props} value={open ? value : value || label} />
		{/snippet}
	</Combobox.Input>
	<!-- <Combobox.Trigger>Open</Combobox.Trigger> -->
	<Combobox.Portal>
		<Combobox.Content
			{...contentProps}
			sideOffset={8}
			data-wide-docs={hasImages ? true : undefined}
		>
			<div class="viewport" data-testid="metadata-combobox-viewport">
				<div class="items">
					<VirtualList items={filteredItems} let:item>
						<Combobox.Item
							value={item.value}
							label={item.label}
							onHighlight={() => {
								highlightedOption = options.find((opt) => opt.key === item.value);
							}}
						>
							{#snippet children({ selected })}
								<div class="item" class:selected>
									<div class="check">
										<IconCheck />
									</div>
									<span class="label">
										{item.label}
										{#if item.matchedFrom && item.matchedFrom !== item.label}
											<br />
											<span class="aka">
												<Badge tooltip="Aussi connu sous le nom de">
													AKA
												</Badge>
												{item.matchedFrom}
											</span>
										{/if}
									</span>
									<div class="right">
										{#if item.icon || item.color}
											<div
												class="icon"
												style:background-color={item.color}
												style:color={item.color
													? readableOn(item.color)
													: undefined}
											>
												{#if item.icon}
													<Icon icon={item.icon} />
												{/if}
											</div>
										{/if}
										<div class="confidence">
											<ConfidencePercentage value={confidences[item.value]} />
										</div>
									</div>
								</div>
							{/snippet}
						</Combobox.Item>
					</VirtualList>
					{#if filteredItems.length === 0}
						<span class="no-results">Aucun résultat :/</span>
					{/if}
				</div>
				<ScrollFader height={200}>
					<div class="docs">
						{#if highlightedOption?.image}
							<img src={highlightedOption.image} alt="" class="thumb" />
						{:else if highlightedOption?.description || highlightedOption?.learnMore}
							<h2>{highlightedOption.label}</h2>
						{/if}
						{#if highlightedOption?.description}
							<section class="description">
								{#await marked(highlightedOption.description) then html}
									{@html html}
								{:catch error}
									{#if isDebugMode()}
										<p class="error">Markdown invalide: {error}</p>
									{/if}
									{highlightedOption.description}
								{/await}
							</section>
						{/if}
						{#if highlightedOption?.learnMore}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a
								href={highlightedOption.learnMore}
								target="_blank"
								class="learn-more"
							>
								<IconArrowRight />
								<div class="text">
									<span>En savoir plus</span>
									<code class="domain"
										>{new URL(highlightedOption.learnMore).hostname}</code
									>
								</div>
							</a>
						{/if}
						{#await cascadeLabels() then labels}
							<table class="cascades">
								<tbody>
									<!-- Cascade's recursion tree is displayed reversed because deeply recursive cascades are mainly meant for taxonomic stuff -- it's the childmost metadata that set their parent, so, in the resulting recursion tree, the parentmost metadata end up childmost (eg. species have cascades that sets genus, genus sets family, etc. so family is deeper in the recursion tree than genus, whereas in a taxonomic tree it's the opposite) -->
									{#each Object.entries(labels).toReversed() as [metadataId, { value, metadata, color, icon }] (metadataId)}
										<tr>
											<td>
												<OverflowableText text={metadata} />
											</td>
											<td>
												{#if icon || color}
													<div
														class="icon"
														style:background-color={color}
														style:color={color
															? readableOn(color)
															: undefined}
													>
														{#if icon}
															<Icon {icon} />
														{/if}
													</div>
												{/if}
												{value}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
							{#if Object.keys(labels).length > 0}
								<p>
									<em>Métadonées mises à jour à la sélection de cette option</em>
								</p>
							{/if}
						{:catch error}
							<p class="error">
								Erreur lors de la récupération des étiquettes en cascade: {error}
							</p>
						{/await}
						{#if !highlightedOption?.description && !highlightedOption?.learnMore && !highlightedOption?.image}
							<section class="empty">
								<Logo variant="empty" />
							</section>
						{/if}
					</div>
				</ScrollFader>
			</div>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>

<style>
	.no-results {
		color: var(--gay);
	}

	:global([data-combobox-content]) {
		width: 600px;
		height: 500px;
		border-radius: calc(2 * var(--corner-radius));
		background-color: var(--bg2-neutral);
		--viewport-padding: 1em;
		padding: var(--viewport-padding);
		z-index: 10000;
	}

	.viewport {
		display: flex;
		flex-direction: row;
		overflow: hidden;
		gap: 1em;
	}

	:global(input) {
		border: none;
		outline: none;
		font-size: 1.1em;
		font-weight: bold;
	}

	.viewport :global(> *) {
		width: 50%;
		scrollbar-color: var(--gray) transparent;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
	}

	.items,
	.docs {
		overflow-y: auto;
	}

	:global([data-combobox-content][data-wide-docs]) {
		width: 800px;
	}

	:global([data-wide-docs] .viewport > :nth-child(1)) {
		width: 40%;
	}

	:global([data-wide-docs] .viewport > :nth-child(2)) {
		width: 60%;
	}

	.items {
		display: flex;
		flex-direction: column;
	}

	.items :global([data-combobox-item]) {
		padding: 0.75em 0.5em;
		cursor: pointer;
	}
	.items :global([data-combobox-item][data-highlighted]) {
		background-color: var(--bg-primary);
		color: var(--fg-primary);
		border-radius: calc(2 * var(--corner-radius) - var(--viewport-padding) / 2);
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

	.items .right {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.items .icon,
	.cascades .icon {
		font-size: 1.4em;
		display: flex;
		align-items: center;
		height: 0.8em;
		width: 0.8em;
		border-radius: 50%;
	}

	.docs {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
	}

	.docs .empty {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		--size: 6rem;
	}

	img {
		width: 100%;
		border-radius: calc(2 * var(--corner-radius) - var(--viewport-padding) / 2);
		overflow: hidden;
		flex-shrink: 0;
	}

	.docs .description p:not(:last-child) {
		margin-bottom: 0.5em;
	}

	.docs table.cascades {
		border-collapse: collapse;
		table-layout: fixed;
		width: 100%;
	}

	.docs .cascades td {
		border: 1px solid color-mix(in srgb, var(--fg-neutral) 40%, transparent);
		border-left: none;
		border-right: none;
	}

	.docs .cascades td:first-child {
		overflow: hidden;
		padding-right: 1rem;
		width: 7rem;
	}

	.docs .cascades .icon {
		/* Sorry 😭 we're in a table cell, 
		display: flex fucks everything up */
		float: left;
		margin-right: 0.25em;
	}

	.learn-more {
		display: flex;
		align-items: center;
		color: var(--fg-primary);
		text-decoration: none;
		gap: 1em;
	}
	.learn-more .text {
		display: flex;
		flex-direction: column;
	}
	.learn-more .text .domain {
		font-size: 0.8em;
		color: var(--gay);
	}
</style>
