<script>
	import { Combobox, mergeProps } from 'bits-ui';
	import IconArrowRight from '~icons/ph/arrow-right';
	import IconCheck from '~icons/ph/check';
	import Logo from './Logo.svelte';
	/**
	 * @import {WithoutChildrenOrChild} from 'bits-ui';
	 */

	/** @typedef { { value: string; label: string } } Item */
	/**
	 * @typedef {object} Props
	 * @property {NonNullable<import('./database').Metadata['options']>} options
	 * @property {WithoutChildrenOrChild<Combobox.InputProps>} [inputProps]
	 * @property {WithoutChildrenOrChild<Combobox.ContentProps>} [contentProps]
	 * @property {string} [id]
	 */

	/**
	 * @type {Props & Combobox.RootProps}
	 */
	let {
		options,
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
		if (searchValue === '') return items;
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
							{#each highlightedOption.description.split(/\r?\n/) as line, i (i)}
								<p>{line}</p>
							{/each}
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
		overflow-y: scroll;
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
