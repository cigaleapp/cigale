<script>
	import { Combobox, mergeProps } from 'bits-ui';
	import { marked } from 'marked';
	import IconArrowRight from '~icons/ph/arrow-right';
	import IconCheck from '~icons/ph/check';
	import Logo from './Logo.svelte';
	import ConfidencePercentage from './ConfidencePercentage.svelte';
	import { getSettings } from './settings.svelte';
	/**
	 * @import {WithoutChildrenOrChild} from 'bits-ui';
	 */

	/** @typedef { { value: string; label: string } } Item */
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
	const items = $derived(options.map((opt) => ({ value: opt.key, label: opt.label })));

	const filteredItems = $derived.by(() => {
		if (searchValue === '')
			return items.toSorted((a, b) => {
				// Sort selected item first, then items with confidences (from high to low), then the rest, alphabetically
				const confidence = (/** @type {string} */ key) => confidences[key] ?? -1;
				if (a.value === value) return -1;
				if (b.value === value) return 1;
				const confidenceDiff = confidence(b.value) - confidence(a.value);
				if (confidenceDiff !== 0) return confidenceDiff;
				return a.label.localeCompare(b.label);
			});
		return items.filter((item) => item.label.toLowerCase().includes(searchValue.toLowerCase()));
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
			<div class="viewport">
				<div class="items">
					{#each filteredItems as item, i (i + item.value)}
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
									<span class="label">{item.label}</span>
									<div class="confidence">
										<ConfidencePercentage value={confidences[item.value]} />
									</div>
								</div>
							{/snippet}
						</Combobox.Item>
					{:else}
						<span class="no-results">Aucun résultat :/</span>
					{/each}
				</div>
				<div class="docs">
					{#if highlightedOption?.image}
						<img src={highlightedOption.image} alt="" class="thumb" />
					{:else if highlightedOption?.description || highlightedOption?.learnMore}
						<h2>{highlightedOption.label}</h2>
					{/if}
					{#if highlightedOption?.description}
						<section class="description">
							{#await marked(highlightedOption.description) then html}
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html html}
							{:catch error}
								{#if getSettings().showTechnicalMetadata}
									<p class="error">Markdown invalide: {error}</p>
								{/if}
								{highlightedOption.description}
							{/await}
						</section>
					{/if}
					{#if highlightedOption?.learnMore}
						<a href={highlightedOption.learnMore} target="_blank" class="learn-more">
							<IconArrowRight />
							<div class="text">
								<span>En savoir plus</span>
								<code class="domain">{new URL(highlightedOption.learnMore).hostname}</code>
							</div>
						</a>
					{/if}
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

	.items .confidence {
		margin-left: auto;
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
