<script>
	import { Combobox, mergeProps } from 'bits-ui';
	import IconSearch from '~icons/ph/magnifying-glass';
	/**
	 * @import {WithoutChildrenOrChild} from 'bits-ui';
	 */

	/** @typedef { { value: string; label: string } } Item */
	/**
	 * @typedef {object} Props
	 * @property {Item[]} items
	 * @property {WithoutChildrenOrChild<Combobox.InputProps>} [inputProps]
	 * @property {WithoutChildrenOrChild<Combobox.ContentProps>} [contentProps]
	 * @property {string} [id]
	 */

	/**
	 * @type {Props & Combobox.RootProps}
	 */
	let {
		items,
		value = $bindable(),
		open = $bindable(false),
		id,
		inputProps,
		contentProps,
		...restProps
	} = $props();

	let searchValue = $state('');

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
	const mergedInputProps = $derived(mergeProps(inputProps, { oninput: handleInput }));

	$inspect({ open, value, searchValue, items });
</script>

<Combobox.Root bind:value bind:open {...mergedRootProps}>
	<Combobox.Input {...mergedInputProps}>
		{#snippet child({ props })}
			<div class="input">
				<IconSearch />
				<input {...props} {id} type="text" />
			</div>
		{/snippet}
	</Combobox.Input>
	<!-- <Combobox.Trigger>Open</Combobox.Trigger> -->
	<Combobox.Portal>
		<Combobox.Content {...contentProps}>
			{#each filteredItems as item, i (i + item.value)}
				<Combobox.Item value={item.value} label={item.label}>
					{#snippet children({ selected })}
						{item.label}
						{selected ? '✅' : ''}
					{/snippet}
				</Combobox.Item>
			{:else}
				<span> No results found </span>
			{/each}
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
