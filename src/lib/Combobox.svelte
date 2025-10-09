<script generics="Value extends string">
	import { Combobox, mergeProps } from 'bits-ui';

	/**
	 * @import {WithoutChildrenOrChild} from 'bits-ui';
	 */

	/** @typedef { { value: Value; label: string } } Item */
	/**
	 * @typedef {object} Props
	 * @property {Item[]} options
	 * @property {WithoutChildrenOrChild<Combobox.InputProps>} [inputProps]
	 * @property {WithoutChildrenOrChild<Combobox.ContentProps>} [contentProps]
	 * @property {string} [id]
	 * @property {import('svelte').Snippet<[Item | undefined, { props: Record<string, unknown>, open: boolean }]>} [input]
	 * @property {import('svelte').Snippet<[Item & { selected: boolean }]>} [item]
	 * @property {import('svelte').Snippet<[Item[], import('svelte').Snippet<[Item]>]>} [items]
	 * @property {import('svelte').Snippet<[Item | undefined]>} [details]
	 * @property {boolean} [wide] whether the details part should be wider
	 */

	/**
	 * @type {Props & Combobox.RootProps}
	 */
	let {
		options,
		value = $bindable(),
		open = $bindable(false),
		inputProps,
		input: inputSnippet,
		contentProps,
		item,
		items,
		details,
		wide = false,
		...restProps
	} = $props();

	let searchValue = $state('');

	const selectedOption = $derived(options.find((opt) => opt.value === value));

	const label = $derived(selectedOption?.label ?? '');

	const filteredOptions = $derived.by(() => {
		if (searchValue === '') return options;

		return options.filter((item) =>
			item.label.toLowerCase().includes(searchValue.toLowerCase())
		);
	});

	$inspect({ options, filteredOptions, searchValue });

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

	/** @type {undefined | Item} */
	let highlightedOption = $state();
</script>

<Combobox.Root {value} bind:open {...mergedRootProps} items={options}>
	<!-- <div class="search-icon" class:shown={open}>
		<IconSearch />
	</div> -->
	<Combobox.Input {...mergedInputProps}>
		{#snippet child({ props })}
			{#if inputSnippet}
				{@render inputSnippet(selectedOption, { props, open })}
			{:else}
				<input {...props} />
			{/if}
		{/snippet}
	</Combobox.Input>
	<!-- <Combobox.Trigger>Open</Combobox.Trigger> -->
	<Combobox.Portal>
		<Combobox.Content
			{...contentProps}
			sideOffset={8}
			data-wide-details={wide ? true : undefined}
		>
			<div class="viewport" data-testid="combobox-viewport">
				<div class="items">
					{@render items?.(filteredOptions, optionSnippet)}
					{#snippet optionSnippet(/** @type {Item} */ option)}
						<Combobox.Item
							value={option.value}
							label={option.label}
							onHighlight={() => {
								highlightedOption = options.find(
									(opt) => opt.value === option.value
								);
							}}
						>
							{#snippet children({ selected })}
								{@render item?.({ ...option, selected })}
							{/snippet}
						</Combobox.Item>
					{/snippet}
				</div>
				<div class="docs">
					{@render details?.(highlightedOption)}
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

	:global([data-combobox-content][data-wide-details]) {
		width: 800px;
	}

	:global([data-wide-details] .items) {
		width: 40%;
	}

	:global([data-wide-details] .docs) {
		width: 60%;
	}

	.items {
		display: grid;
		grid-template-columns: repeat(auto-fill, var(--items-grid-size));
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
