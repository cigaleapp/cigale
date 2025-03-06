<script>
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import { tables } from '$lib/idb.svelte';
	import Logo from '$lib/Logo.svelte';
	import Metadata from '$lib/Metadata.svelte';
	import MetadataList from '$lib/MetadataList.svelte';
	import { getSettings } from '$lib/settings.svelte';

	/**
	 * @typedef {object} Props
	 * @property {string[]} images source **href**s of the images/observations we're modifying the metadata on
	 * @property {() => void} onmerge callback to call when the user wants to merge images or observations into a single one
	 * @property {() => void} onaddmetadata callback to call when the user wants to add metadata
	 * @property {(key: string, value: import('$lib/metadata').RuntimeValue) => void} onmetadatachange callback to call when a metadata's value is modified
	 * @property {boolean} [allowmerge=false] whether the user is allowed to merge images or observations
	 * @property {Record<string, import('$lib/database').MetadataValue | undefined>} metadata values of the metadata we're viewing. Undefined if a metadata has multiple differing values for the selection.
	 */

	/** @type {Props} */
	let { images, onmerge, onaddmetadata, onmetadatachange, allowmerge, metadata } = $props();

	// TODO maybe put as a prop? hmmmmm
	const definitions = $derived(
		Object.fromEntries(
			Object.entries(metadata).map(([id]) => [id, tables.Metadata.state.find((m) => m.id === id)])
		)
	);

	const showTechnicalMetadata = $derived(getSettings().showTechnicalMetadata);
</script>

<div class="pannel">
	<div class="images">
		{#each images as image, i (i)}
			<img src={image} alt={'image ' + i} />
		{:else}
			<!-- svelte-ignore a11y_missing_attribute -->
			<img />
		{/each}
	</div>
	<h1>Métadonnées</h1>
	<MetadataList>
		{#each Object.entries(metadata).sort(([a], [b]) => a.localeCompare(b)) as [id, value] (id)}
			{@const definition = definitions[id]}
			{#if definition && (definition.label || showTechnicalMetadata)}
				<!-- the value variable here contains value, confidence and alternatives -->
				<Metadata
					{...definition}
					{...value ?? { value: undefined }}
					onblur={async (v) => {
						if (v === undefined) return;
						onmetadatachange(id, v);
					}}
				>
					{#if definition.label}
						{definition.label}
					{:else}
						<code>{definition.id}</code>
					{/if}
				</Metadata>
			{:else if !definition}
				<p class="error">
					<Logo variant="error" />
					Métadonnée inconnue
				</p>
			{/if}
		{/each}
	</MetadataList>
	<div class="button">
		{#if allowmerge}
			<ButtonPrimary onclick={onmerge} --width="80%">Fusionner les observations</ButtonPrimary>
		{/if}
		<ButtonPrimary onclick={onaddmetadata} --width="80%">
			Ajouter une métadonner les métadonnées
		</ButtonPrimary>
	</div>
</div>

<style>
	.pannel {
		width: 40vw;
		max-width: 700px;
		background-color: var(--bg-neutral);
		overflow-x: auto;
		padding: 1em;
		display: grid;
		grid-template-rows: max-content max-content auto max-content;
		height: 100%;
		flex-shrink: 0;
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
		mask-image: linear-gradient(to left, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 30%);
		overflow-x: hidden;
	}

	img {
		height: 50px;
	}

	.button {
		display: flex;
		gap: 20px;
		align-items: center;
		flex-direction: column;
	}
</style>
