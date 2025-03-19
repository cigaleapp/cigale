<script>
	import { Combobox, mergeProps } from 'bits-ui';
	import IconSearch from '~icons/ph/magnifying-glass';
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
		id,
		inputProps,
		contentProps,
		...restProps
	} = $props();

	let searchValue = $state('');

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
		mergeProps(inputProps, { oninput: handleInput, onfocus: () => (open = true) })
	);
</script>

<Combobox.Root bind:value bind:open {...mergedRootProps}>
	<!-- <div class="search-icon" class:shown={open}>
		<IconSearch />
	</div> -->
	<Combobox.Input {...mergedInputProps} />
	<!-- <Combobox.Trigger>Open</Combobox.Trigger> -->
	<Combobox.Portal>
		<Combobox.Content {...contentProps} sideOffset={8}>
			<div class="viewport">
				<div class="items">
					{#each filteredItems as item, i (i + item.value)}
						<Combobox.Item value={item.value} label={item.label}>
							{#snippet children({ selected })}
								{item.label}
								{selected ? '✅' : ''}
							{/snippet}
						</Combobox.Item>
					{:else}
						<span class="no-results">Aucun résultat :/</span>
					{/each}
				</div>
				<div class="docs">
					<img src="/fuck.webp" alt="fuck you" class="thumb" />
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
		padding: 1em;
		border-radius: var(--corner-radius);
		background-color: var(--gray);
	}

	.viewport {
		display: flex;
		flex-direction: row;
		overflow: hidden;
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
	}

	.items {
		overflow-y: scroll;
		display: flex;
		flex-direction: column;
	}

	.items :global([data-combobox-item]) {
		padding: 0.5em 0;
		cursor: pointer;
	}
	.items :global([data-combobox-item][data-highlighted]) {
		background-color: var(--bg-primary);
		color: var(--fg-primary);
	}

	.docs {
		display: flex;
		flex-direction: column;
	}

	img {
		width: 100%;
	}

	.search-icon {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.search-icon:not(.shown) {
		display: none;
	}
</style>
