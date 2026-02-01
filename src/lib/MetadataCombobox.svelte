<script module>
	/** @typedef { { value: string; label: string; synonyms: string[], icon?: string, color?: string } } Item */

	/**
	 * @typedef {object} Props
	 * @property {import('./database.js').MetadataEnumVariant[]} options
	 * @property {WithoutChildrenOrChild<Combobox.InputProps>} [inputProps]
	 * @property {WithoutChildrenOrChild<Combobox.ContentProps>} [contentProps]
	 * @property {string} [id]
	 * @property {Record<string, number>} [confidences]
	 * @property {(action: 'focus' | 'blur' | 'toggle') => void} [focuser]
	 */
</script>

<script>
	import Icon from '@iconify/svelte';
	import VirtualList from '@sveltejs/svelte-virtual-list';
	import { Combobox, mergeProps } from 'bits-ui';
	import { marked } from 'marked';

	import IconCheck from '~icons/ri/check-line';

	import Badge from './Badge.svelte';
	import { cascadeLabels } from './cascades.js';
	import ConfidencePercentage from './ConfidencePercentage.svelte';
	import * as idb from './idb.svelte.js';
	import LearnMoreLink from './LearnMoreLink.svelte';
	import Logo from './Logo.svelte';
	import MetadataCascadesTable from './MetadataCascadesTable.svelte';
	import { scrollfader } from './scrollfader.js';
	import { isDebugMode } from './settings.svelte';
	import { uiState } from './state.svelte';
	import { compareBy, pick, readableOn } from './utils.js';

	/**
	 * @import {WithoutChildrenOrChild} from 'bits-ui';
	 * @import {CascadeLabelsCache} from './cascades.js';
	 */

	/**
	 * @type {Props & Combobox.RootProps}
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

	const highlightedOptionImage = $derived.by(() => {
		if (!highlightedOption) return undefined;
		if (highlightedOption.image) return highlightedOption.image;
		if (highlightedOption.images?.at(0)) return highlightedOption.images[0];
		return undefined;
	});

	/**
	 * @type {CascadeLabelsCache}
	 */
	let cascadeLabelsCache = $state({});
</script>

<Combobox.Root {value} bind:open {...mergedRootProps} {items}>
	<!-- <div class="search-icon" class:shown={open}>
		<IconSearch />
	</div> -->
	<Combobox.Input {...mergedInputProps}>
		{#snippet child({ props: { value, ...props } })}
			<input
				{...props}
				value={open ? value : label || value}
				{@attach (e) => {
					focuser = (action) => {
						switch (action) {
							case 'focus':
								e.focus();
								break;
							case 'blur':
								e.blur();
								open = false;
								break;
							case 'toggle':
								if (document.activeElement === e) {
									e.blur();
									open = false;
								} else {
									e.focus();
								}
								break;
						}
					};
				}}
			/>
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
				<div class="docs" {@attach scrollfader}>
					{#if highlightedOptionImage}
						<img src={highlightedOptionImage} alt="" />
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
						<LearnMoreLink href={highlightedOption.learnMore} />
					{/if}

					{#await cascadeLabels( { cache: cascadeLabelsCache, db: idb.databaseHandle(), protocolId: uiState.currentProtocolId, option: highlightedOption } ) then cascades}
						<MetadataCascadesTable {cascades} />
						{#if Object.keys(cascades).length > 0}
							<p><em>Métadonées mises à jour à la sélection de cette option</em></p>
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

	.items,
	.docs {
		width: 50%;
		scrollbar-color: var(--gray) transparent;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		overflow-y: auto;
	}

	:global([data-combobox-content][data-wide-docs]) {
		width: 800px;
	}

	:global([data-wide-docs] .items) {
		width: 40%;
	}

	:global([data-wide-docs] .docs) {
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

	.items .icon {
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
</style>
