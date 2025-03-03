<script>
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import Metadata from '$lib/Metadata.svelte';
	import MetadataList from '$lib/MetadataList.svelte';
	let {
		images,
		metaNom,
		metaType,
		metaValue = $bindable(),
		metaOptions,
		clickFusion,
		clickAddMeta,
		showFusion
	} = $props();
</script>

<div class="pannel">
	<div class="images">
		{#each images as image, i}
			<img src={image} alt={'image ' + i} />
		{/each}
	</div>
	<h1>Métadonnées</h1>
	<MetadataList>
		{#each metaNom as nom, i}
			<Metadata bind:value={metaValue[i]} type={metaType[i]} options={metaOptions[i]}>
				{nom}
			</Metadata>
		{/each}
	</MetadataList>
	<div class="button">
		{#if showFusion}
			<ButtonPrimary onclick={clickFusion} --width="80%">Fusionner les observations</ButtonPrimary>
		{/if}
		<ButtonPrimary onclick={clickAddMeta} --width="80%">
			Ajouter une métadonner les métadonnées
		</ButtonPrimary>
	</div>
</div>

<style>
	.pannel {
		position: fixed;
		right: 0;
		width: 30%;
		height: 100%;
		background-color: var(--bg-neutral);
		overflow: hidden;
		padding-top: 10px;
		padding-left: 5px;
		display: flex;
		flex-direction: column;
		gap: 30px;
		border-style: solid;
		border-color: var(--bg-primary);
		border-width: var(--border-thickness);
		border-top-left-radius: var(--corner-radius);
		border-bottom-left-radius: var(--corner-radius);
	}

	h1 {
		font-size: 1.5em;
		font-weight: bolder;
	}

	.images {
		display: flex;
		flex-direction: row;
		gap: 5px;
		mask-image: linear-gradient(to left, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%);
	}

	img {
		height: 50px;
	}

	.button {
		position: fixed;
		display: flex;
		gap: 20px;
		align-items: center;
		flex-direction: column;
		bottom: 5%;
		height: fit-content;
		width: 30%;
	}
</style>
