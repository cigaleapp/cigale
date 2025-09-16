<script generics="ItemData">
	import { DropdownMenu } from 'bits-ui';

	/**
	 * @typedef {object} ItemBase
	 * @property {string} label
	 * @property {() => void} onclick
	 */

	/**
	 * @typedef {ItemBase & ItemData} Item
	 */

	/**
	 * @typedef {object} Props
	 * @property {Item[]} items
	 * @property {string} [help]
	 * @property {import('svelte').Snippet<[Item]>} [item]
	 * @property {import('svelte').Snippet<[{onclick: () => void}& Record<string, unknown>]>} trigger
	 */

	/** @type {Props} */
	const { items, item, trigger, help = '' } = $props();

	let open = $state(false);
</script>

<DropdownMenu.Root {open}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			{@render trigger({
				...props,
				onclick: () => {
					open = !open;
				}
			})}
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Portal>
		<DropdownMenu.Content>
			<DropdownMenu.Group>
				{#if help}
					<DropdownMenu.GroupHeading>{help}</DropdownMenu.GroupHeading>
				{/if}

				{#each items as i (i.label)}
					<DropdownMenu.Item textValue={i.label} onSelect={i.onclick}>
						{#if item}
							{@render item(i)}
						{:else}
							{i.label}
						{/if}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
	:global([data-dropdown-menu-content]) {
		display: flex;
		flex-direction: column;
		background-color: var(--bg-neutral);
		border: 1px solid var(--fg-primary);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	:global([data-dropdown-menu-group-heading]) {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-style: italic;
		color: var(--gay);
	}

	:global([data-dropdown-menu-item]) {
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		cursor: pointer;
		user-select: none;
		display: flex;
		align-items: center;
		gap: 0.25em;
	}

	:global([data-dropdown-menu-item]:is(:hover, :focus-visible)) {
		background-color: var(--bg-primary);
		color: var(--fg-primary);
	}
</style>
