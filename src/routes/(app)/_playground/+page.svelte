<svelte:options runes={true} />

<script>
	import DropdownMenu from '$lib/DropdownMenu.svelte';
</script>

<DropdownMenu
	items={[
		{
			label: 'Feur',
			items: [
				{
					key: 'item',
					label: 'Item',
				},
			],
		},
	]}
>
	{#snippet trigger(props)}
		<button {...props}> feur </button>
	{/snippet}
</DropdownMenu>
