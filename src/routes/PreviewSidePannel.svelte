<script>
	import Metadata from '$lib/Metadata.svelte';
	import MetadataList from '$lib/MetadataList.svelte';

	let { metaNom, metaType, metaValue = $bindable(), metaOptions } = $props();
</script>

<div class="pannel">
	<MetadataList>
		{#each metaNom as nom, i}
			<Metadata bind:value={metaValue[i]} type={metaType[i]} options={metaOptions[i]}>
				{nom}
			</Metadata>
		{/each}
	</MetadataList>
</div>

<style>
	.pannel {
		position: fixed;
		right: 0;
		width: 30%;
		height: 100%;
		background-color: var(--bg-neutral);
	}
</style>
