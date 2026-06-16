<svelte:options runes={true} />

<script lang="ts">
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
